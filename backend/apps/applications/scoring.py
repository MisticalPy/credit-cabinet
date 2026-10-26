from dataclasses import dataclass
from decimal import Decimal

from apps.applications.models import LoanApplication

Recommendation = LoanApplication.Recommendation

SCORING_VERSION = "v1"
APPROVE_THRESHOLD = 70
COUNTER_OFFER_THRESHOLD = 40
COMFORTABLE_PAYMENT_SHARE = Decimal("0.30")
MAX_PAYMENT_SHARE = Decimal("0.50")


@dataclass(frozen=True)
class ScoringFacts:
    business_age_months: int
    monthly_payment: Decimal
    monthly_revenue: Decimal
    company_active: bool
    has_overdue: bool


@dataclass(frozen=True)
class ScoreItem:
    reason: str
    points: int


@dataclass(frozen=True)
class ScoringResult:
    score: int
    recommendation: str
    breakdown: tuple[ScoreItem, ...]


def calculate_score(facts: ScoringFacts) -> ScoringResult:
    if not facts.company_active:
        stop = ScoreItem("Стоп-фактор: компания не действует по ЕГРЮЛ", 0)
        return ScoringResult(score=0, recommendation=Recommendation.REJECT, breakdown=(stop,))

    breakdown = (
        _age_item(facts.business_age_months),
        _payment_share_item(facts.monthly_payment, facts.monthly_revenue),
        _bki_item(facts.has_overdue),
        ScoreItem("ЕГРЮЛ: компания действующая", 15),
    )
    score = max(0, sum(item.points for item in breakdown))
    return ScoringResult(score=score, recommendation=_recommend(score), breakdown=breakdown)


def _age_item(months: int) -> ScoreItem:
    if months > 24:
        return ScoreItem("Бизнесу больше 2 лет", 30)
    if months >= 6:
        return ScoreItem("Бизнесу от 6 мес. до 2 лет", 15)
    return ScoreItem("Бизнесу меньше 6 мес.", 0)


def _payment_share_item(payment: Decimal, revenue: Decimal) -> ScoreItem:
    if revenue <= 0:
        return ScoreItem("Оборот не указан", 0)
    share = payment / revenue
    label = f"Платёж — {share:.0%} месячного оборота"
    if share <= COMFORTABLE_PAYMENT_SHARE:
        return ScoreItem(label, 30)
    if share <= MAX_PAYMENT_SHARE:
        return ScoreItem(label, 10)
    return ScoreItem(label, 0)


def _bki_item(has_overdue: bool) -> ScoreItem:
    if has_overdue:
        return ScoreItem("БКИ: есть просрочки", -40)
    return ScoreItem("БКИ: просрочек нет", 25)


def _recommend(score: int) -> str:
    if score >= APPROVE_THRESHOLD:
        return Recommendation.APPROVE
    if score >= COUNTER_OFFER_THRESHOLD:
        return Recommendation.COUNTER_OFFER
    return Recommendation.REJECT
