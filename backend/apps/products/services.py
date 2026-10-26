from dataclasses import dataclass
from decimal import ROUND_DOWN, ROUND_HALF_UP, Decimal

from django.db.models import QuerySet

from apps.products.exceptions import ConditionsOutOfRangeError, ProfileRequiredError
from apps.products.models import CreditProduct
from apps.users import services as users_services
from apps.users.models import User

KOPECK = Decimal("0.01")


@dataclass(frozen=True)
class PaymentCalculation:
    monthly_payment: Decimal
    total: Decimal
    overpayment: Decimal


@dataclass(frozen=True)
class ProductMatch:
    product: CreditProduct
    payment: PaymentCalculation


def calculate_payment(
    *, amount: Decimal, term_months: int, annual_rate: Decimal
) -> PaymentCalculation:
    monthly_rate = annual_rate / 100 / 12
    if monthly_rate == 0:
        monthly = amount / term_months
    else:
        monthly = amount * monthly_rate / (1 - (1 + monthly_rate) ** -term_months)
    monthly = monthly.quantize(KOPECK, rounding=ROUND_HALF_UP)
    total = monthly * term_months
    return PaymentCalculation(monthly_payment=monthly, total=total, overpayment=total - amount)


def upsert_product(*, name: str, **fields) -> CreditProduct:
    """Создаёт продукт или обновляет существующий с тем же названием."""
    product, _ = CreditProduct.objects.update_or_create(name=name, defaults=fields)
    return product


def get_active_products() -> QuerySet[CreditProduct]:
    return CreditProduct.objects.filter(is_active=True)


def get_active_product(product_id: int) -> CreditProduct:
    """Нет такого или выключен -> DoesNotExist, обработчик API отдаст 404."""
    return get_active_products().get(pk=product_id)


def check_conditions(product: CreditProduct, *, amount: Decimal, term_months: int) -> None:
    if not product.min_amount <= amount <= product.max_amount:
        raise ConditionsOutOfRangeError(
            f"Сумма для «{product.name}»: от {product.min_amount} до {product.max_amount} ₽"
        )
    if not product.min_term_months <= term_months <= product.max_term_months:
        raise ConditionsOutOfRangeError(
            f"Срок для «{product.name}»: "
            f"от {product.min_term_months} до {product.max_term_months} мес."
        )


def calculate_for_product(
    *, product_id: int, amount: Decimal, term_months: int
) -> PaymentCalculation:
    product = get_active_product(product_id)
    check_conditions(product, amount=amount, term_months=term_months)
    return calculate_payment(amount=amount, term_months=term_months, annual_rate=product.rate)


def match_products(
    *, user: User, purpose: str, amount: Decimal, term_months: int, collateral: str
) -> list[ProductMatch]:
    """Условия запроса от клиента, данные бизнеса из его профиля."""
    profile = users_services.get_profile(user)
    if profile is None:
        raise ProfileRequiredError("Сначала заполните профиль бизнеса")

    products = get_active_products().filter(
        purpose=purpose,
        legal_form__in=[profile.business_type, CreditProduct.LegalForm.ANY],
        collateral_type__in=[CreditProduct.Collateral.NONE, collateral],
        min_amount__lte=amount,
        max_amount__gte=amount,
        min_term_months__lte=term_months,
        max_term_months__gte=term_months,
        min_business_age_months__lte=profile.business_age_months,
        min_monthly_revenue__lte=profile.monthly_revenue,
    )
    return [
        ProductMatch(
            product=p,
            payment=calculate_payment(amount=amount, term_months=term_months, annual_rate=p.rate),
        )
        for p in products
    ]


def max_amount_for_payment(
    *, monthly_payment: Decimal, term_months: int, annual_rate: Decimal
) -> Decimal:
    """Обратный аннуитет. Округляем вниз до тысяч."""
    monthly_rate = annual_rate / 100 / 12
    if monthly_rate == 0:
        amount = monthly_payment * term_months
    else:
        amount = monthly_payment * (1 - (1 + monthly_rate) ** -term_months) / monthly_rate
    return (amount / 1000).to_integral_value(rounding=ROUND_DOWN) * 1000
