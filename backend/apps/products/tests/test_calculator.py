from decimal import Decimal

from apps.products.services import calculate_payment


def test_annuity_matches_reference_example():
    # Пример из спецификации: 800 000 ₽ на 24 мес. под 19,5% ≈ 40 521,50 ₽
    calc = calculate_payment(amount=Decimal("800000"), term_months=24, annual_rate=Decimal("19.5"))

    assert abs(calc.monthly_payment - Decimal("40521.50")) < 1


def test_total_and_overpayment_are_consistent():
    calc = calculate_payment(amount=Decimal("500000"), term_months=12, annual_rate=Decimal("21"))

    assert calc.total == calc.monthly_payment * 12
    assert calc.overpayment == calc.total - Decimal("500000")


def test_zero_rate_splits_amount_evenly():
    calc = calculate_payment(amount=Decimal("120000"), term_months=12, annual_rate=Decimal("0"))

    assert calc.monthly_payment == Decimal("10000.00")
    assert calc.overpayment == 0
