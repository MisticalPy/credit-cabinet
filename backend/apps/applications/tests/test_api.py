import pytest

from apps.applications import services
from apps.applications.models import LoanApplication
from apps.users.models import User

pytestmark = pytest.mark.django_db
S = LoanApplication.Status


@pytest.fixture
def client_with_application(make_client, make_product, profile_data):
    client = make_client(profile=profile_data)
    product = make_product()
    response = client.post(
        "/api/applications", {"product_id": product.id, "amount": "500000", "term_months": 12}
    )
    assert response.status_code == 201
    return client, response.json()["id"]


def test_submit_runs_scoring_and_moves_to_review(client_with_application):
    client, app_id = client_with_application

    response = client.post(f"/api/applications/{app_id}/submit")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == S.REVIEW
    assert [h["to_status"] for h in body["history"]] == [S.DRAFT, S.SUBMITTED, S.SCORING, S.REVIEW]
    assert "score" not in body  # клиент не видит баллы
    assert LoanApplication.objects.get(pk=app_id).score == 100


def test_submit_twice_is_rejected(client_with_application):
    client, app_id = client_with_application
    client.post(f"/api/applications/{app_id}/submit")

    assert client.post(f"/api/applications/{app_id}/submit").status_code == 400


def test_foreign_application_is_404(client_with_application, make_client):
    _, app_id = client_with_application
    stranger = make_client("ivan")

    assert stranger.get(f"/api/applications/{app_id}").status_code == 404


def test_counter_offer_accepted_by_client(client_with_application):
    client, app_id = client_with_application
    client.post(f"/api/applications/{app_id}/submit")
    manager = User.objects.create_user(username="manager", role=User.Role.MANAGER, is_staff=True)
    services.decide(
        application_id=app_id,
        manager=manager,
        decision=S.COUNTER_OFFER,
        comment="Можем предложить меньшую сумму",
        counter_amount=300000,
        counter_term_months=12,
    )

    response = client.post(f"/api/applications/{app_id}/accept-offer")

    assert response.status_code == 200
    assert response.json()["status"] == S.APPROVED
    assert response.json()["amount"] == "300000.00"


def test_submit_without_profile_is_400(auth_client, make_product):
    product = make_product()
    app_id = auth_client.post(
        "/api/applications", {"product_id": product.id, "amount": "500000", "term_months": 12}
    ).json()["id"]

    assert auth_client.post(f"/api/applications/{app_id}/submit").status_code == 400
