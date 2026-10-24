from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q
from django.utils import timezone


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


class BusinessProfile(models.Model):
    class BusinessType(models.TextChoices):
        IP = "ip", "ИП"
        OOO = "ooo", "ООО"

    class Industry(models.TextChoices):
        TRADE = "trade", "Торговля"
        FOOD = "food", "Общепит"
        SERVICES = "services", "Услуги"
        MANUFACTURING = "manufacturing", "Производство"
        CONSTRUCTION = "construction", "Строительство"
        TRANSPORT = "transport", "Транспорт и логистика"
        IT = "it", "IT"
        OTHER = "other", "Другое"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="business_profile",
        verbose_name="пользователь",
    )
    business_type = models.CharField("форма бизнеса", max_length=3, choices=BusinessType.choices)
    company_name = models.CharField("название", max_length=255)
    inn = models.CharField("ИНН", max_length=12, unique=True)
    industry = models.CharField("отрасль", max_length=20, choices=Industry.choices)
    monthly_revenue = models.DecimalField("оборот в месяц, ₽", max_digits=14, decimal_places=2)
    registration_date = models.DateField("дата регистрации")
    created_at = models.DateTimeField("создан", auto_now_add=True)
    updated_at = models.DateTimeField("изменён", auto_now=True)

    class Meta:
        verbose_name = "профиль бизнеса"
        verbose_name_plural = "профили бизнеса"
        constraints = [
            models.CheckConstraint(
                condition=Q(business_type="ip", inn__regex=r"^\d{12}$")
                | Q(business_type="ooo", inn__regex=r"^\d{10}$"),
                name="business_profile_inn_matches_type",
            ),
            models.CheckConstraint(
                condition=Q(monthly_revenue__gte=0),
                name="business_profile_revenue_non_negative",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.company_name} ({self.inn})"

    @property
    def business_age_months(self) -> int:
        """Сколько полных месяцев работает бизнес."""
        today = timezone.localdate()
        d = self.registration_date
        return (today.year - d.year) * 12 + (today.month - d.month) - (today.day < d.day)
