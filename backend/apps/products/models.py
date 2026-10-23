from django.db import models
from django.db.models import F, Q


class CreditProduct(models.Model):
    class Purpose(models.TextChoices):
        WORKING_CAPITAL = "working_capital", "Оборотные средства"
        EQUIPMENT = "equipment", "Оборудование"
        DEVELOPMENT = "development", "Развитие бизнеса"
        REFINANCING = "refinancing", "Рефинансирование"

    class LegalForm(models.TextChoices):
        IP = "ip", "ИП"
        OOO = "ooo", "ООО"
        ANY = "any", "Любая"

    class Collateral(models.TextChoices):
        NONE = "none", "Без залога"
        PROPERTY = "property", "Залог имущества"
        GUARANTEE = "guarantee", "Поручительство фонда"

    name = models.CharField("название", max_length=255, unique=True)
    description = models.TextField("описание", blank=True)
    purpose = models.CharField("цель", max_length=20, choices=Purpose.choices)
    legal_form = models.CharField("форма бизнеса", max_length=3, choices=LegalForm.choices)
    collateral_type = models.CharField("обеспечение", max_length=10, choices=Collateral.choices)
    min_amount = models.DecimalField("сумма от, ₽", max_digits=14, decimal_places=2)
    max_amount = models.DecimalField("сумма до, ₽", max_digits=14, decimal_places=2)
    min_term_months = models.PositiveSmallIntegerField("срок от, мес.")
    max_term_months = models.PositiveSmallIntegerField("срок до, мес.")
    rate = models.DecimalField("ставка, % годовых", max_digits=5, decimal_places=2)
    min_business_age_months = models.PositiveSmallIntegerField(
        "мин. возраст бизнеса, мес.", default=0
    )
    min_monthly_revenue = models.DecimalField(
        "мин. оборот в месяц, ₽", max_digits=14, decimal_places=2, default=0
    )
    is_active = models.BooleanField("активен", default=True)
    created_at = models.DateTimeField("создан", auto_now_add=True)
    updated_at = models.DateTimeField("изменён", auto_now=True)

    class Meta:
        verbose_name = "кредитный продукт"
        verbose_name_plural = "кредитные продукты"
        ordering = ["rate", "name"]
        constraints = [
            models.CheckConstraint(
                condition=Q(min_amount__gt=0) & Q(min_amount__lte=F("max_amount")),
                name="product_amount_range_valid",
            ),
            models.CheckConstraint(
                condition=Q(min_term_months__gte=1) & Q(min_term_months__lte=F("max_term_months")),
                name="product_term_range_valid",
            ),
            models.CheckConstraint(
                condition=Q(rate__gt=0) & Q(rate__lt=100),
                name="product_rate_valid",
            ),
            models.CheckConstraint(
                condition=Q(min_monthly_revenue__gte=0),
                name="product_min_revenue_non_negative",
            ),
        ]

    def __str__(self) -> str:
        return self.name
