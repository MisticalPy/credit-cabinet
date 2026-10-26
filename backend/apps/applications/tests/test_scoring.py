from decimal import Decimal

from apps.applications.models import LoanApplication
from apps.applications.scoring import ScoringFacts, calculate_score

R = LoanApplication.Recommendation


def facts(**overrides) -> ScoringFacts:
    data = {
        "business_age_months": 43,
        "monthly_payment": Decimal("40000"),
        "monthly_revenue": Decimal("850000"),
        "company_active": True,
        "has_overdue": False,
    }
    data.update(overrides)
    return ScoringFacts(**data)


def test_strong_client_is_approved():
    result = calculate_score(facts())
    assert (result.score, result.recommendation) == (100, R.APPROVE)


def test_young_business_with_heavy_payment_gets_counter_offer():
    result = calculate_score(
        facts(
            business_age_months=13,
            monthly_payment=Decimal("140000"),
            monthly_revenue=Decimal("350000"),
        )
    )
    assert (result.score, result.recommendation) == (65, R.COUNTER_OFFER)


def test_overdue_leads_to_reject():
    result = calculate_score(facts(has_overdue=True))
    assert (result.score, result.recommendation) == (35, R.REJECT)


def test_liquidated_company_is_stop_factor():
    result = calculate_score(facts(company_active=False))
    assert (result.score, result.recommendation) == (0, R.REJECT)
