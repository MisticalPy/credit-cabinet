import pytest

from apps.users.models import User
from conftest import ApiClient

pytestmark = pytest.mark.django_db


def test_csrf_sets_cookie(api_client):
    response = api_client.get("/api/auth/csrf")

    assert response.status_code == 204
    assert "csrftoken" in response.cookies


def test_login_then_me_then_logout(make_client):
    make_client("alex")
    client = ApiClient()

    login = client.post("/api/auth/login", {"username": "alex", "password": "Kofe-2026-xyz"})
    assert login.status_code == 200

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["username"] == "alex"

    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401


def test_login_with_csrf_enforced(make_client):
    make_client("alex")
    client = ApiClient(enforce_csrf_checks=True)

    client.get("/api/auth/csrf")
    token = client.cookies["csrftoken"].value

    login = client.post(
        "/api/auth/login",
        {"username": "alex", "password": "Kofe-2026-xyz"},
        HTTP_X_CSRFTOKEN=token,
    )
    assert login.status_code == 200
    assert client.get("/api/auth/me").status_code == 200


def test_register_ignores_role_and_lowercases_username(api_client):
    response = api_client.post(
        "/api/auth/register",
        {"username": "Alex", "password": "Kofe-2026-xyz", "role": "manager"},
    )

    assert response.status_code == 201
    assert response.json()["role"] == "client"
    user = User.objects.get()
    assert user.username == "alex"
    assert user.role == User.Role.CLIENT


def test_register_duplicate_username_is_case_insensitive(api_client, make_client):
    make_client("alex")

    response = api_client.post(
        "/api/auth/register", {"username": "ALEX", "password": "Kofe-2026-xyz"}
    )

    assert response.status_code == 400


def test_profile_requires_login(api_client):
    assert api_client.get("/api/profile").status_code == 401


def test_profile_create_then_update(auth_client, profile_data):
    assert auth_client.get("/api/profile").status_code == 404

    created = auth_client.put("/api/profile", profile_data)
    assert created.status_code == 201
    assert created.json()["monthly_revenue"] == "850000.00"

    updated = auth_client.put("/api/profile", {**profile_data, "monthly_revenue": "920000.00"})
    assert updated.status_code == 200
    assert auth_client.get("/api/profile").json()["monthly_revenue"] == "920000.00"


def test_profile_inn_taken_by_another_user(make_client, profile_data):
    make_client("alex").put("/api/profile", profile_data)

    response = make_client("ivan").put("/api/profile", profile_data)

    assert response.status_code == 400
