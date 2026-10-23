from decimal import Decimal

from ninja import Field, ModelSchema, Schema

from apps.products.models import CreditProduct


class ProductOut(ModelSchema):
    class Meta:
        model = CreditProduct
        fields = [
            "id",
            "name",
            "description",
            "purpose",
            "legal_form",
            "collateral_type",
            "min_amount",
            "max_amount",
            "min_term_months",
            "max_term_months",
            "rate",
            "min_business_age_months",
            "min_monthly_revenue",
        ]


class CalculationQuery(Schema):
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    term: int = Field(ge=1, le=360)


class MatchQuery(CalculationQuery):
    purpose: CreditProduct.Purpose
    collateral: CreditProduct.Collateral = CreditProduct.Collateral.NONE


class PaymentOut(Schema):
    monthly_payment: Decimal
    total: Decimal
    overpayment: Decimal


class MatchOut(Schema):
    product: ProductOut
    payment: PaymentOut
