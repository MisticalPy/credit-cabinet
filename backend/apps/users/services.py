from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.users.exceptions import UsernameTakenError, WeakPasswordError
from apps.users.models import User


def normalize_username(username: str) -> str:
    return username.strip().lower()


def register_user(*, username: str, password: str) -> User:
    username = normalize_username(username)
    try:
        validate_password(password, User(username=username))
    except ValidationError as e:
        raise WeakPasswordError(" ".join(e.messages)) from e

    try:
        with transaction.atomic():
            return User.objects.create_user(
                username=username, password=password, role=User.Role.CLIENT
            )
    except IntegrityError as e:
        raise UsernameTakenError("Пользователь с таким логином уже существует") from e
