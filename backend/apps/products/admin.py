from django.contrib import admin
from unfold.admin import ModelAdmin

from apps.products.models import CreditProduct


@admin.register(CreditProduct)
class CreditProductAdmin(ModelAdmin):
    list_display = [
        "name",
        "purpose",
        "legal_form",
        "collateral_type",
        "rate",
        "min_amount",
        "max_amount",
        "min_term_months",
        "max_term_months",
        "is_active",
    ]
    list_editable = ["is_active"]
    list_filter = ["is_active", "purpose", "legal_form", "collateral_type"]
    search_fields = ["name"]
    readonly_fields = ["created_at", "updated_at"]
