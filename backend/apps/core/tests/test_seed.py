import pytest
from django.contrib.auth.models import Group, Permission
from django.core.management import call_command

from apps.applications.models import LoanApplication
from apps.products.models import CreditProduct
from apps.users.models import BusinessProfile, User
from apps.users.services import ensure_managers_group

pytestmark = pytest.mark.django_db


def _counts() -> dict[str, int]:
    return {
        "users": User.objects.count(),
        "products": CreditProduct.objects.count(),
        "applications": LoanApplication.objects.count(),
        "profiles": BusinessProfile.objects.count(),
        "groups": Group.objects.count(),
    }


@pytest.mark.parametrize(
    ("username", "recommendation", "score"),
    [
        ("client_approve", LoanApplication.Recommendation.APPROVE, 100),
        ("client_counter", LoanApplication.Recommendation.COUNTER_OFFER, 65),
        ("client_reject", LoanApplication.Recommendation.REJECT, 35),
    ],
)
def test_seed_client_applications(username: str, recommendation: str, score: int) -> None:
    call_command("seed")

    application = LoanApplication.objects.get(user__username=username)

    assert application.status == LoanApplication.Status.REVIEW
    assert application.recommendation == recommendation
    assert application.score == score


def test_seed_counter_offer_has_suggested_amount() -> None:
    call_command("seed")

    application = LoanApplication.objects.get(user__username="client_counter")

    assert application.suggested_amount is not None
    assert application.suggested_amount >= application.product.min_amount


def test_seed_staff_users() -> None:
    call_command("seed")

    manager = User.objects.get(username="manager")
    admin = User.objects.get(username="admin")

    assert manager.role == User.Role.MANAGER
    assert manager.is_staff
    assert manager.groups.filter(name="Менеджеры").exists()
    assert admin.is_superuser
    assert admin.is_staff


def test_seed_managers_group_permissions() -> None:
    call_command("seed")

    codenames = set(
        Group.objects.get(name="Менеджеры").permissions.values_list("codename", flat=True)
    )

    assert codenames == {
        "view_loanapplication",
        "change_loanapplication",
        "view_creditproduct",
        "change_creditproduct",
        "view_applicationstatushistory",
    }


def test_ensure_managers_group_adds_history_view_to_existing_group() -> None:
    group = ensure_managers_group()
    group.permissions.remove(Permission.objects.get(codename="view_applicationstatushistory"))

    ensure_managers_group()

    assert group.permissions.filter(codename="view_applicationstatushistory").exists()


def test_seed_is_idempotent() -> None:
    call_command("seed")
    first = _counts()

    call_command("seed")

    assert _counts() == first
    assert first["products"] >= 4
    assert first["applications"] == 3
