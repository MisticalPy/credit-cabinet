from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        CLIENT = "client", "Клиент"
        MANAGER = "manager", "Менеджер"

    role = models.CharField(
        "роль",
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
    )
