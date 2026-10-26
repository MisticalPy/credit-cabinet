from django.contrib.auth.models import Group, Permission
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Q

from apps.users.exceptions import InnTakenError, UsernameTakenError, WeakPasswordError
from apps.users.models import BusinessProfile, User


def normalize_username(username: str) -> str:
    return username.strip().lower()


MANAGERS_GROUP = "Менеджеры"
# (app_label, codename): менеджер смотрит и меняет заявки и продукты,
# историю статусов (инлайн в заявке) только смотрит
MANAGER_PERMISSIONS = (
    ("applications", "view_loanapplication"),
    ("applications", "change_loanapplication"),
    ("products", "view_creditproduct"),
    ("products", "change_creditproduct"),
    ("applications", "view_applicationstatushistory"),
)


def _validate_password(username: str, password: str) -> None:
    try:
        validate_password(password, User(username=username))
    except ValidationError as e:
        raise WeakPasswordError(" ".join(e.messages)) from e


def register_user(*, username: str, password: str) -> User:
    username = normalize_username(username)
    _validate_password(username, password)

    try:
        with transaction.atomic():
            return User.objects.create_user(
                username=username, password=password, role=User.Role.CLIENT
            )
    except IntegrityError as e:
        raise UsernameTakenError("Пользователь с таким логином уже существует") from e


def get_profile(user: User) -> BusinessProfile | None:
    return BusinessProfile.objects.filter(user=user).first()


def save_profile(*, user: User, data: dict) -> tuple[BusinessProfile, bool]:
    try:
        with transaction.atomic():
            return BusinessProfile.objects.update_or_create(user=user, defaults=data)
    except IntegrityError as e:
        raise InnTakenError("Профиль с таким ИНН уже зарегистрирован") from e


def get_user_by_username(username: str) -> User | None:
    return User.objects.filter(username=normalize_username(username)).first()


def ensure_managers_group() -> Group:
    """Идемпотентно создаёт группу менеджеров с нужными правами."""
    group, _ = Group.objects.get_or_create(name=MANAGERS_GROUP)
    query = Q()
    for app_label, codename in MANAGER_PERMISSIONS:
        query |= Q(content_type__app_label=app_label, codename=codename)
    group.permissions.set(Permission.objects.filter(query))
    return group


def ensure_manager(*, username: str, password: str) -> User:
    """Менеджер в группе «Менеджеры». Пароль существующего пользователя не меняем."""
    username = normalize_username(username)
    user = get_user_by_username(username)
    if user is None:
        _validate_password(username, password)
        user = User.objects.create_user(username=username, password=password)
    user.role = User.Role.MANAGER
    user.is_staff = True
    user.save()
    user.groups.add(ensure_managers_group())
    return user


def ensure_superuser(*, username: str, password: str) -> User:
    """Суперпользователь для админки. Пароль существующего пользователя не меняем."""
    username = normalize_username(username)
    user = get_user_by_username(username)
    if user is None:
        _validate_password(username, password)
        return User.objects.create_superuser(username=username, password=password)
    user.is_staff = True
    user.is_superuser = True
    user.save()
    return user
