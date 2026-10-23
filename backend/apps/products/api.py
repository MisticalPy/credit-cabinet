from ninja import Query, Router

from apps.products import services
from apps.products.schemas import CalculationQuery, MatchOut, MatchQuery, PaymentOut, ProductOut

router = Router(tags=["products"])


@router.get("", response=list[ProductOut], auth=None)
def list_products(request):
    return services.get_active_products()


@router.get("/match", response=list[MatchOut])
def match(request, params: Query[MatchQuery]):
    return services.match_products(
        user=request.user,
        purpose=params.purpose,
        amount=params.amount,
        term_months=params.term,
        collateral=params.collateral,
    )


@router.get("/{product_id}/calculate", response=PaymentOut, auth=None)
def calculate(request, product_id: int, params: Query[CalculationQuery]):
    return services.calculate_for_product(
        product_id=product_id, amount=params.amount, term_months=params.term
    )
