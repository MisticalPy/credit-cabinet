from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.applications import services as applications_services
from apps.products import services as products_services
from apps.products.models import CreditProduct
from apps.users import services as users_services
from apps.users.exceptions import UsernameTakenError
from apps.users.models import BusinessProfile, User

DEMO_PASSWORD = "AlfaDemo2026"

Purpose = CreditProduct.Purpose
LegalForm = CreditProduct.LegalForm
Collateral = CreditProduct.Collateral

PRODUCTS = [
    {
        "name": "Оборотный без залога",
        "description": "Пополнение оборотных средств без обеспечения.",
        "purpose": Purpose.WORKING_CAPITAL,
        "legal_form": LegalForm.ANY,
        "collateral_type": Collateral.NONE,
        "min_amount": Decimal("100000"),
        "max_amount": Decimal("3000000"),
        "min_term_months": 3,
        "max_term_months": 36,
        "rate": Decimal("21.00"),
        "min_business_age_months": 6,
        "min_monthly_revenue": Decimal("300000"),
    },
    {
        "name": "Экспресс для ИП",
        "description": "Быстрый небольшой кредит для индивидуальных предпринимателей.",
        "purpose": Purpose.WORKING_CAPITAL,
        "legal_form": LegalForm.IP,
        "collateral_type": Collateral.NONE,
        "min_amount": Decimal("50000"),
        "max_amount": Decimal("1000000"),
        "min_term_months": 3,
        "max_term_months": 24,
        "rate": Decimal("24.00"),
        "min_business_age_months": 3,
        "min_monthly_revenue": Decimal("100000"),
    },
    {
        "name": "Оборудование под залог",
        "description": "Покупка оборудования под залог имущества.",
        "purpose": Purpose.EQUIPMENT,
        "legal_form": LegalForm.OOO,
        "collateral_type": Collateral.PROPERTY,
        "min_amount": Decimal("500000"),
        "max_amount": Decimal("10000000"),
        "min_term_months": 12,
        "max_term_months": 60,
        "rate": Decimal("17.50"),
        "min_business_age_months": 12,
        "min_monthly_revenue": Decimal("500000"),
    },
    {
        "name": "Развитие с поручительством фонда",
        "description": "Расширение бизнеса с поручительством фонда поддержки.",
        "purpose": Purpose.DEVELOPMENT,
        "legal_form": LegalForm.ANY,
        "collateral_type": Collateral.GUARANTEE,
        "min_amount": Decimal("300000"),
        "max_amount": Decimal("5000000"),
        "min_term_months": 12,
        "max_term_months": 48,
        "rate": Decimal("15.90"),
        "min_business_age_months": 12,
        "min_monthly_revenue": Decimal("300000"),
    },
    {
        "name": "Рефинансирование кредитов",
        "description": "Объединение действующих кредитов под залог имущества.",
        "purpose": Purpose.REFINANCING,
        "legal_form": LegalForm.ANY,
        "collateral_type": Collateral.PROPERTY,
        "min_amount": Decimal("500000"),
        "max_amount": Decimal("7000000"),
        "min_term_months": 12,
        "max_term_months": 60,
        "rate": Decimal("16.50"),
        "min_business_age_months": 12,
        "min_monthly_revenue": Decimal("400000"),
    },
]

# Исход задаётся ИНН (моки ЕГРЮЛ/БКИ), возрастом бизнеса и долей платежа в обороте.
# Даты считаем от сегодняшнего дня, чтобы баллы не «уезжали» со временем.
CLIENTS = [
    {
        "username": "client_approve",
        "outcome": "одобрить (100 баллов)",
        "product": "Оборотный без залога",
        "profile": {
            "business_type": BusinessProfile.BusinessType.OOO,
            "company_name": "ООО Зелёный Двор",
            "inn": "7701234561",  # без просрочек
            "industry": BusinessProfile.Industry.TRADE,
            "monthly_revenue": Decimal("1000000"),
            "age_days": 1100,  # ~3 года, платёж ~9% оборота
        },
        "amount": Decimal("1000000"),
        "term_months": 12,
    },
    {
        "username": "client_counter",
        "outcome": "встречное предложение (65 баллов)",
        "product": "Оборотный без залога",
        "profile": {
            "business_type": BusinessProfile.BusinessType.IP,
            "company_name": "ИП Петров А. С.",
            "inn": "770123456783",  # без просрочек
            "industry": BusinessProfile.Industry.SERVICES,
            "monthly_revenue": Decimal("400000"),
            "age_days": 365,  # ~12 мес., платёж ~40% оборота
        },
        "amount": Decimal("1700000"),
        "term_months": 12,
    },
    {
        "username": "client_reject",
        "outcome": "отказать (35 баллов)",
        "product": "Развитие с поручительством фонда",
        "profile": {
            "business_type": BusinessProfile.BusinessType.OOO,
            "company_name": "ООО Северный Путь",
            "inn": "7801234569",  # просрочки в БКИ
            "industry": BusinessProfile.Industry.TRANSPORT,
            "monthly_revenue": Decimal("1200000"),
            "age_days": 1100,
        },
        "amount": Decimal("800000"),
        "term_months": 24,
    },
]


class Command(BaseCommand):
    help = "Заполняет БД демо-данными: менеджер, админ, продукты, клиенты с заявками. Идемпотентна."

    def handle(self, *args, **options) -> None:
        users_services.ensure_manager(username="manager", password=DEMO_PASSWORD)
        users_services.ensure_superuser(username="admin", password=DEMO_PASSWORD)

        products = {
            fields["name"]: products_services.upsert_product(**fields) for fields in PRODUCTS
        }
        for spec in CLIENTS:
            self._seed_client(spec, products)

        self._print_credentials()

    def _seed_client(self, spec: dict, products: dict[str, CreditProduct]) -> None:
        try:
            user = users_services.register_user(username=spec["username"], password=DEMO_PASSWORD)
        except UsernameTakenError:
            user = users_services.get_user_by_username(spec["username"])

        profile = dict(spec["profile"])
        profile["registration_date"] = timezone.localdate() - timedelta(
            days=profile.pop("age_days")
        )
        users_services.save_profile(user=user, data=profile)

        if applications_services.list_user_applications(user).exists():
            return
        application = applications_services.create_application(
            user=user,
            product_id=products[spec["product"]].pk,
            amount=spec["amount"],
            term_months=spec["term_months"],
            comment="Демо-заявка",
        )
        applications_services.submit_application(user=user, application_id=application.pk)

    def _print_credentials(self) -> None:
        rows = [
            ("manager", User.Role.MANAGER.label, "менеджер, вход в админку"),
            ("admin", "суперпользователь", "полный доступ в админке"),
            *((spec["username"], User.Role.CLIENT.label, spec["outcome"]) for spec in CLIENTS),
        ]
        self.stdout.write(f"{'логин':<16}{'пароль':<16}{'роль':<20}ожидаемый исход")
        for username, role, outcome in rows:
            self.stdout.write(f"{username:<16}{DEMO_PASSWORD:<16}{role:<20}{outcome}")
        self.stdout.write(self.style.SUCCESS("Готово"))
