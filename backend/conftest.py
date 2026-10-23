import pytest
from django.test import Client

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
    """Фабрика: make_client("ivan") -> браузер с вошедшим клиентом."""

    def _make(username: str = "alex") -> ApiClient:
        user = users_services.register_user(username=username, password="Kofe-2026-xyz")
        client = ApiClient()
        client.force_login(user)
        return client

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
