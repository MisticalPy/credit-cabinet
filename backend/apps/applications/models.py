from django.conf import settings
from django.db import models
from django.db.models import Q


class LoanApplication(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Черновик"
        SUBMITTED = "submitted", "Отправлена"
        SCORING = "scoring", "Проверка"
        REVIEW = "review", "На рассмотрении"
        APPROVED = "approved", "Одобрена"
        REJECTED = "rejected", "Отказ"
        COUNTER_OFFER = "counter_offer", "Встречное предложение"
        INFO_REQUESTED = "info_requested", "Запрошены данные"

    class Recommendation(models.TextChoices):
        APPROVE = "approve", "Одобрить"
        COUNTER_OFFER = "counter_offer", "Встречное предложение"
        REJECT = "reject", "Отказать"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="loan_applications",
        verbose_name="клиент",
    )
    product = models.ForeignKey(
        "products.CreditProduct",
        on_delete=models.PROTECT,
        related_name="applications",
        verbose_name="продукт",
    )
    amount = models.DecimalField("сумма, ₽", max_digits=14, decimal_places=2)
    term_months = models.PositiveSmallIntegerField("срок, мес.")
    rate = models.DecimalField("ставка, % годовых", max_digits=5, decimal_places=2)
    monthly_payment = models.DecimalField("платёж в месяц, ₽", max_digits=14, decimal_places=2)
    comment = models.TextField("на что нужны деньги", blank=True)
    status = models.CharField(
        "статус", max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True
    )

    score = models.SmallIntegerField("баллы", null=True, blank=True)
    recommendation = models.CharField(
        "рекомендация системы", max_length=20, choices=Recommendation.choices, blank=True
    )
    scoring_details = models.JSONField("детали скоринга", default=dict, blank=True)
    scored_at = models.DateTimeField("скоринг проведён", null=True, blank=True)
    suggested_amount = models.DecimalField(
        "рекомендуемая сумма, ₽", max_digits=14, decimal_places=2, null=True, blank=True
    )

    manager_comment = models.TextField("комментарий банка", blank=True)
    counter_amount = models.DecimalField(
        "встречная сумма, ₽", max_digits=14, decimal_places=2, null=True, blank=True
    )
    counter_term_months = models.PositiveSmallIntegerField(
        "встречный срок, мес.", null=True, blank=True
    )

    created_at = models.DateTimeField("создана", auto_now_add=True)
    updated_at = models.DateTimeField("изменена", auto_now=True)

    class Meta:
        verbose_name = "заявка"
        verbose_name_plural = "заявки"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="application_user_created_idx")
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gt=0) & Q(term_months__gte=1),
                name="application_amount_term_valid",
            ),
        ]

    def __str__(self) -> str:
        return f"Заявка №{self.pk}"


class ApplicationStatusHistory(models.Model):  # noqa: DJ008
    application = models.ForeignKey(
        LoanApplication, on_delete=models.CASCADE, related_name="history", verbose_name="заявка"
    )
    from_status = models.CharField(
        "из статуса", max_length=20, choices=LoanApplication.Status.choices, blank=True
    )
    to_status = models.CharField("в статус", max_length=20, choices=LoanApplication.Status.choices)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        verbose_name="кто",  # пусто = система
    )
    comment = models.TextField("комментарий", blank=True)
    created_at = models.DateTimeField("когда", auto_now_add=True)

    class Meta:
        verbose_name = "запись истории"
        verbose_name_plural = "история статусов"
        ordering = ["created_at", "id"]

    def __str__(self) -> str:
        return f"Заявка №{self.application_id}: {self.get_to_status_display()}"
