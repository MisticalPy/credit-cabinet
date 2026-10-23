from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from apps.users.models import BusinessProfile, User


@admin.register(BusinessProfile)
class BusinessProfileAdmin(ModelAdmin):
    list_display = ["business_type", "company_name", "inn", "industry", "monthly_revenue", "user"]
    list_filter = ["business_type", "industry"]
    search_fields = ["company_name", "inn", "user__username"]
    list_select_related = ["user"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    list_display = ("username", "role", "is_staff", "is_active")
    search_fields = ["username"]
    list_filter = ("role", "is_staff", "is_superuser", "is_active")
    fieldsets = BaseUserAdmin.fieldsets + (("Роль", {"fields": ("role",)}),)


admin.site.unregister(Group)


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass
