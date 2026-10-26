from datetime import datetime
from decimal import Decimal

from ninja import Field, Schema

from apps.applications.models import ApplicationStatusHistory, LoanApplication


class ApplicationIn(Schema):
    product_id: int
    amount: Decimal = Field(gt=0, max_digits=14, decimal_places=2)
    term_months: int = Field(ge=1, le=360)
    comment: str = Field(default="", max_length=1000)


class HistoryOut(Schema):
    from_status: str
    to_status: LoanApplication.Status
    comment: str
    created_at: datetime

    @staticmethod
    def resolve_comment(obj: ApplicationStatusHistory) -> str:
        """Комментарий системных переходов (скоринг, рекомендация) клиенту не отдаём."""
        return "" if obj.actor_id is None else obj.comment


class ApplicationOut(Schema):
    id: int
    product_id: int
    product_name: str = Field(alias="product.name")
    amount: Decimal
    term_months: int
    rate: Decimal
    monthly_payment: Decimal
    comment: str
    status: LoanApplication.Status
    manager_comment: str
    counter_amount: Decimal | None
    counter_term_months: int | None
    created_at: datetime
    updated_at: datetime


class ApplicationDetailOut(ApplicationOut):
    history: list[HistoryOut]
