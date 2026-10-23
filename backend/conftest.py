from decimal import Decimal

import pytest
from django.test import Client

from apps.products.models import CreditProduct
from apps.users import services as users_services


class ApiClient(Client):
    """Тестовый клиент, который по умолчанию отправляет JSON."""

    def post(self, path, data=None, content_type="application/json", **extra):
        return super().post(path, data, content_type=content_type, **extra)

    def put(self, path, data=None, content_type="application/json", **extra):
        return super().put(path, data, content_type=content_type, **extra)


@pytest.fixture
def api_client() -> ApiClient:
    """Браузер без входа."""
    return ApiClient()


@pytest.fixture
def make_client(db):
    """Фабрика: make_client("ivan", profile={...})
    браузер с вошедшим клиентом."""

    def _make(username: str = "alex", *, profile: dict | None = None) -> ApiClient:
        user = users_services.register_user(username=username, password="Kofe-2026-xyz")
        if profile is not None:
            users_services.save_profile(user=user, data=profile)
        client = ApiClient()
        client.force_login(user)
        return client

    return _make


@pytest.fixture
def make_product(db):
    """Фабрика: make_product(legal_form="ip")
    продукт, по умолчанию подходит профилю из profile_data."""

    def _make(**overrides) -> CreditProduct:
        fields = {
            "name": f"Продукт {CreditProduct.objects.count() + 1}",
            "purpose": CreditProduct.Purpose.WORKING_CAPITAL,
            "legal_form": CreditProduct.LegalForm.ANY,
            "collateral_type": CreditProduct.Collateral.NONE,
            "min_amount": Decimal("100000"),
            "max_amount": Decimal("3000000"),
            "min_term_months": 3,
            "max_term_months": 36,
            "rate": Decimal("21.00"),
            "min_business_age_months": 6,
            "min_monthly_revenue": Decimal("300000"),
        }
        fields.update(overrides)
        return CreditProduct.objects.create(**fields)

    return _make


@pytest.fixture
def auth_client(make_client) -> ApiClient:
    """Самый частый случай: один вошедший клиент."""
    return make_client()


@pytest.fixture
def profile_data() -> dict:
    return {
        "business_type": "ooo",
        "company_name": "Кофейня Зерно",
        "inn": "4205123456",
        "industry": "food",
        "monthly_revenue": "850000.00",
        "registration_date": "2023-03-15",
    }
