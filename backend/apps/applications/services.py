from dataclasses import asdict
from decimal import Decimal

from django.db import transaction
from django.db.models import QuerySet
from django.utils import timezone

from apps.applications import scoring
from apps.applications.exceptions import (
    CounterOfferDataError,
    InvalidTransitionError,
    ProfileRequiredError,
)
from apps.applications.models import ApplicationStatusHistory, LoanApplication
from apps.integrations import checks
from apps.products import services as products_services
from apps.users import services as users_services
from apps.users.models import BusinessProfile, User

Status = LoanApplication.Status

TRANSITIONS: dict[str, set[str]] = {
    Status.DRAFT: {Status.SUBMITTED},
    Status.SUBMITTED: {Status.SCORING},
    Status.SCORING: {Status.REVIEW},
    Status.REVIEW: {Status.APPROVED, Status.REJECTED, Status.COUNTER_OFFER, Status.INFO_REQUESTED},
    Status.COUNTER_OFFER: {Status.APPROVED},
    Status.INFO_REQUESTED: {Status.SUBMITTED},
}
SUBMITTABLE = {Status.DRAFT, Status.INFO_REQUESTED}
MANAGER_DECISIONS = {Status.APPROVED, Status.REJECTED, Status.COUNTER_OFFER, Status.INFO_REQUESTED}


# ---------- чтение ----------


def list_user_applications(user: User) -> QuerySet[LoanApplication]:
    return LoanApplication.objects.filter(user=user).select_related("product")


def get_user_application(user: User, application_id: int) -> LoanApplication:
    return list_user_applications(user).prefetch_related("history").get(pk=application_id)


# ---------- действия клиента ----------


@transaction.atomic
def create_application(
    *, user: User, product_id: int, amount: Decimal, term_months: int, comment: str = ""
) -> LoanApplication:
    product = products_services.get_active_product(product_id)
    products_services.check_conditions(product, amount=amount, term_months=term_months)
    payment = products_services.calculate_payment(
        amount=amount, term_months=term_months, annual_rate=product.rate
    )
    application = LoanApplication.objects.create(
        user=user,
        product=product,
        amount=amount,
        term_months=term_months,
        comment=comment,
        rate=product.rate,
        monthly_payment=payment.monthly_payment,
    )
    ApplicationStatusHistory.objects.create(
        application=application, to_status=Status.DRAFT, actor=user
    )
    return application


def submit_application(*, user: User, application_id: int) -> LoanApplication:
    """Отправка: submitted → автоматический скоринг → review."""
    with transaction.atomic():
        application = _lock(application_id, user=user)
        if application.status not in SUBMITTABLE:
            raise InvalidTransitionError(
                "Отправить можно только черновик или заявку, по которой запросили данные"
            )
        profile = users_services.get_profile(user)
        if profile is None:
            raise ProfileRequiredError("Перед отправкой заполните профиль бизнеса")

        _transition(application, Status.SUBMITTED, actor=user)
        _transition(application, Status.SCORING, actor=None)
        _run_scoring(application, profile)
        _transition(
            application,
            Status.REVIEW,
            actor=None,
            comment=f"Рекомендация системы: {application.get_recommendation_display()} "
            + f"({application.score} баллов)",
        )
    return get_user_application(user, application_id)


def accept_counter_offer(*, user: User, application_id: int) -> LoanApplication:
    with transaction.atomic():
        application = _lock(application_id, user=user)
        if application.status != Status.COUNTER_OFFER:
            raise InvalidTransitionError("Встречного предложения по этой заявке нет")
        payment = products_services.calculate_payment(
            amount=application.counter_amount,
            term_months=application.counter_term_months,
            annual_rate=application.rate,
        )
        application.amount = application.counter_amount
        application.term_months = application.counter_term_months
        application.monthly_payment = payment.monthly_payment
        _transition(
            application, Status.APPROVED, actor=user, comment="Клиент принял встречное предложение"
        )
    return get_user_application(user, application_id)


# ---------- действие менеджера ----------


def decide(
    *,
    application_id: int,
    manager: User,
    decision: str,
    comment: str = "",
    counter_amount: Decimal | None = None,
    counter_term_months: int | None = None,
) -> LoanApplication:
    if decision not in MANAGER_DECISIONS:
        raise InvalidTransitionError("Недопустимое решение")
    with transaction.atomic():
        application = _lock(application_id)
        if decision == Status.COUNTER_OFFER:
            if counter_amount is None or counter_term_months is None:
                raise CounterOfferDataError("Для встречного предложения укажите сумму и срок")
            products_services.check_conditions(
                application.product, amount=counter_amount, term_months=counter_term_months
            )
            application.counter_amount = counter_amount
            application.counter_term_months = counter_term_months
        application.manager_comment = comment
        _transition(application, decision, actor=manager, comment=comment)
    return application


# ---------- внутренние ----------


def _lock(application_id: int, *, user: User | None = None) -> LoanApplication:
    qs = LoanApplication.objects.select_for_update(of=("self",)).select_related("product")
    if user is not None:
        qs = qs.filter(user=user)
    return qs.get(pk=application_id)


def _transition(
    application: LoanApplication, to_status: str, *, actor: User | None, comment: str = ""
) -> None:
    if to_status not in TRANSITIONS.get(application.status, set()):
        raise InvalidTransitionError(
            f"Нельзя перейти из «{application.get_status_display()}» в «{Status(to_status).label}»"
        )
    from_status = application.status
    application.status = to_status
    application.save()
    ApplicationStatusHistory.objects.create(
        application=application,
        from_status=from_status,
        to_status=to_status,
        actor=actor,
        comment=comment,
    )


def _run_scoring(application: LoanApplication, profile: BusinessProfile) -> None:
    egrul = checks.check_egrul(profile.inn)
    bki = checks.check_bki(profile.inn)
    result = scoring.calculate_score(
        scoring.ScoringFacts(
            business_age_months=profile.business_age_months,
            monthly_payment=application.monthly_payment,
            monthly_revenue=profile.monthly_revenue,
            company_active=egrul.is_active,
            has_overdue=bki.has_overdue,
        )
    )
    application.score = result.score
    application.recommendation = result.recommendation
    application.scored_at = timezone.now()
    application.scoring_details = {
        "version": scoring.SCORING_VERSION,
        "breakdown": [asdict(item) for item in result.breakdown],
        "facts": {  # снимок данных на момент скоринга
            "business_age_months": profile.business_age_months,
            "monthly_revenue": str(profile.monthly_revenue),
            "monthly_payment": str(application.monthly_payment),
        },
        "egrul": asdict(egrul),
        "bki": asdict(bki),
    }
    application.suggested_amount = (
        _suggest_amount(application, profile)
        if result.recommendation == LoanApplication.Recommendation.COUNTER_OFFER
        else None
    )


def _suggest_amount(application: LoanApplication, profile: BusinessProfile) -> Decimal | None:
    amount = products_services.max_amount_for_payment(
        monthly_payment=profile.monthly_revenue * scoring.COMFORTABLE_PAYMENT_SHARE,
        term_months=application.term_months,
        annual_rate=application.rate,
    )
    amount = min(amount, application.amount)
    return amount if amount >= application.product.min_amount else None
