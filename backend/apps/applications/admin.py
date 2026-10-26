from django import forms
from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.utils.html import format_html, format_html_join
from unfold.admin import ModelAdmin, TabularInline
from unfold.widgets import (
    UnfoldAdminDecimalFieldWidget,
    UnfoldAdminIntegerFieldWidget,
    UnfoldAdminSelectWidget,
    UnfoldAdminTextareaWidget,
)

from apps.applications import services
from apps.applications.models import ApplicationStatusHistory, LoanApplication
from apps.core.exceptions import ServiceError

Status = LoanApplication.Status
DECISION_CHOICES = [("", "— выберите —")] + [
    (s.value, s.label)
    for s in (Status.APPROVED, Status.REJECTED, Status.COUNTER_OFFER, Status.INFO_REQUESTED)
]


class DecisionForm(forms.ModelForm):
    decision = forms.ChoiceField(
        label="Решение", choices=DECISION_CHOICES, required=False, widget=UnfoldAdminSelectWidget
    )
    decision_comment = forms.CharField(
        label="Комментарий для клиента", required=False, widget=UnfoldAdminTextareaWidget
    )
    counter_amount_input = forms.DecimalField(
        label="Встречная сумма, ₽",
        required=False,
        max_digits=14,
        decimal_places=2,
        widget=UnfoldAdminDecimalFieldWidget,
    )
    counter_term_input = forms.IntegerField(
        label="Встречный срок, мес.",
        required=False,
        min_value=1,
        widget=UnfoldAdminIntegerFieldWidget,
    )

    class Meta:
        model = LoanApplication
        fields: list[str] = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if "counter_amount_input" in self.fields:
            self.fields["counter_amount_input"].initial = self.instance.suggested_amount
            self.fields["counter_term_input"].initial = self.instance.term_months


class StatusHistoryInline(TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    can_delete = False
    fields = ["created_at", "from_status", "to_status", "actor", "comment"]
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(LoanApplication)
class LoanApplicationAdmin(ModelAdmin):
    form = DecisionForm
    inlines = [StatusHistoryInline]
    list_display = [
        "id",
        "user",
        "product",
        "amount",
        "term_months",
        "status",
        "score",
        "recommendation",
        "created_at",
    ]
    list_filter = ["status", "recommendation", "product"]
    search_fields = ["id", "user__username", "user__business_profile__inn"]
    list_select_related = ["user", "product"]
    readonly_fields = [
        "user",
        "product",
        "amount",
        "term_months",
        "rate",
        "monthly_payment",
        "comment",
        "status",
        "created_at",
        "score",
        "recommendation",
        "checks_summary",
        "scoring_breakdown",
        "suggested_amount",
        "manager_comment",
        "counter_amount",
        "counter_term_months",
    ]

    def get_fieldsets(self, request, obj=None):
        fieldsets = [
            (
                "Заявка",
                {
                    "fields": [
                        "user",
                        "product",
                        "amount",
                        "term_months",
                        "rate",
                        "monthly_payment",
                        "comment",
                        "status",
                        "created_at",
                    ]
                },
            ),
            (
                "Скоринг",
                {
                    "fields": [
                        "score",
                        "recommendation",
                        "checks_summary",
                        "scoring_breakdown",
                        "suggested_amount",
                    ]
                },
            ),
        ]
        if obj and obj.status == Status.REVIEW:
            fieldsets.append(
                (
                    "Решение менеджера",
                    {
                        "fields": [
                            "decision",
                            "decision_comment",
                            "counter_amount_input",
                            "counter_term_input",
                        ]
                    },
                )
            )
        else:
            fieldsets.append(
                ("Итог", {"fields": ["manager_comment", "counter_amount", "counter_term_months"]})
            )
        return fieldsets

    @admin.display(description="Внешние проверки")
    def checks_summary(self, obj):
        details = obj.scoring_details
        if not details:
            return "—"
        return (
            f"ЕГРЮЛ: {details['egrul']['status']} · БКИ: "
            f"просрочек {details['bki']['overdue_count']}"
        )

    @admin.display(description="Расшифровка баллов")
    def scoring_breakdown(self, obj):
        items = obj.scoring_details.get("breakdown", [])
        if not items:
            return "—"
        rows = format_html_join(
            "", "<li>{}: <b>{}</b></li>", ((i["reason"], f"{i['points']:+d}") for i in items)
        )
        return format_html("<ul>{}</ul>", rows)

    def has_add_permission(self, request):
        return False  # заявки создают клиенты

    def has_delete_permission(self, request, obj=None):
        return False  # заявки и история — аудит, не удаляем

    def save_model(self, request, obj, form, change):
        decision = form.cleaned_data.get("decision")
        if not decision:
            return
        try:
            services.decide(
                application_id=obj.pk,
                manager=request.user,
                decision=decision,
                comment=form.cleaned_data.get("decision_comment", ""),
                counter_amount=form.cleaned_data.get("counter_amount_input"),
                counter_term_months=form.cleaned_data.get("counter_term_input"),
            )
        except ServiceError as e:
            # сервис уже откатил свою транзакцию, заявка не изменилась
            self.message_user(request, str(e), level=messages.ERROR)
            request.decision_failed = True

    def response_change(self, request, obj):
        if getattr(request, "decision_failed", False):
            # без сообщения «успешно сохранено»: возвращаем на ту же страницу
            return HttpResponseRedirect(request.path)
        return super().response_change(request, obj)
