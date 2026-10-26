from decimal import Decimal

import pytest
from django.contrib.messages import get_messages
from django.test import Client
from django.urls import reverse

from apps.applications import services
from apps.applications.models import ApplicationStatusHistory, LoanApplication
from apps.users import services as users_services
from apps.users.models import User

pytestmark = pytest.mark.django_db
S = LoanApplication.Status


@pytest.fixture
def review_application(make_product, profile_data) -> LoanApplication:
    """Заявка клиента, дошедшая до статуса «На рассмотрении»."""
    user = users_services.register_user(username="alex", password="Kofe-2026-xyz")
    users_services.save_profile(user=user, data=profile_data)
    product = make_product()
    application = services.create_application(
        user=user, product_id=product.id, amount=Decimal("500000"), term_months=12
    )
    services.submit_application(user=user, application_id=application.id)
    application.refresh_from_db()
    assert application.status == S.REVIEW
    return application


@pytest.fixture
def admin_client() -> Client:
    manager = User.objects.create_superuser(username="boss", password="Kofe-2026-xyz")
    client = Client()
    client.force_login(manager)
    return client


@pytest.fixture
def manager_client() -> Client:
    manager = users_services.ensure_manager(username="mgr", password="Kofe-2026-xyz")
    client = Client()
    client.force_login(manager)
    return client


def _post_decision(client: Client, application: LoanApplication, **data):
    """POST решения менеджера на страницу изменения заявки (как из браузера)."""
    url = reverse("admin:applications_loanapplication_change", args=[application.pk])
    payload = {
        "decision_comment": "",
        "counter_amount_input": "",
        "counter_term_input": "",
        # management-form inline'а истории статусов
        "history-TOTAL_FORMS": "0",
        "history-INITIAL_FORMS": "0",
        "history-MIN_NUM_FORMS": "0",
        "history-MAX_NUM_FORMS": "1000",
        **data,
    }
    return client.post(url, payload, follow=True)


def _messages(response) -> list[str]:
    return [str(m) for m in get_messages(response.wsgi_request)]


def test_manager_approves_application(admin_client, review_application):
    response = _post_decision(
        admin_client, review_application, decision=S.APPROVED, decision_comment="Одобряем"
    )

    assert response.status_code == 200
    review_application.refresh_from_db()
    assert review_application.status == S.APPROVED
    assert review_application.manager_comment == "Одобряем"
    last = ApplicationStatusHistory.objects.filter(application=review_application).latest("id")
    assert (last.from_status, last.to_status, last.comment) == (S.REVIEW, S.APPROVED, "Одобряем")


def test_service_error_is_shown_to_manager(admin_client, review_application):
    history_count = ApplicationStatusHistory.objects.count()

    response = _post_decision(admin_client, review_application, decision=S.COUNTER_OFFER)

    assert response.status_code == 200
    review_application.refresh_from_db()
    assert review_application.status == S.REVIEW
    assert review_application.counter_amount is None
    assert ApplicationStatusHistory.objects.count() == history_count
    messages = _messages(response)
    assert any("укажите сумму и срок" in m for m in messages)
    assert not any("успешно" in m for m in messages)


def test_counter_offer_out_of_product_limits_changes_nothing(admin_client, review_application):
    response = _post_decision(
        admin_client,
        review_application,
        decision=S.COUNTER_OFFER,
        counter_amount_input="99999999",
        counter_term_input="12",
    )

    assert response.status_code == 200
    review_application.refresh_from_db()
    assert review_application.status == S.REVIEW
    assert review_application.counter_amount is None
    assert review_application.counter_term_months is None
    messages = _messages(response)
    assert messages and not any("успешно" in m for m in messages)


def test_manager_sees_status_history_inline(manager_client, review_application):
    url = reverse("admin:applications_loanapplication_change", args=[review_application.pk])

    response = manager_client.get(url)

    assert response.status_code == 200
    assert "history-TOTAL_FORMS" in response.content.decode()
