from datetime import date
from decimal import Decimal

from django.utils import timezone
from ninja import Field, ModelSchema, Schema
from pydantic import model_validator

from apps.users.models import BusinessProfile, User


class UserOut(ModelSchema):
    class Meta:
        model = User
        fields = ["id", "username", "role"]


class CredentialsIn(Schema):
    username: str = Field(min_length=3, max_length=150, pattern=r"^[\w.@+-]+$")
    password: str = Field(min_length=1, max_length=128)


class ProfileIn(Schema):
    business_type: BusinessProfile.BusinessType
    company_name: str = Field(min_length=1, max_length=255)
    inn: str = Field(pattern=r"^\d{10}(\d{2})?$")
    industry: BusinessProfile.Industry
    monthly_revenue: Decimal = Field(ge=0, max_digits=14, decimal_places=2)
    registration_date: date

    @model_validator(mode="after")
    def check_consistency(self):
        expected = 12 if self.business_type == BusinessProfile.BusinessType.IP else 10
        if len(self.inn) != expected:
            raise ValueError(f"ИНН для {self.business_type.label} должен содержать {expected} цифр")
        if self.registration_date > timezone.localdate():
            raise ValueError("Дата регистрации не может быть в будущем")
        return self


class ProfileOut(ModelSchema):
    business_age_months: int

    class Meta:
        model = BusinessProfile
        fields = [
            "business_type",
            "company_name",
            "inn",
            "industry",
            "monthly_revenue",
            "registration_date",
        ]
