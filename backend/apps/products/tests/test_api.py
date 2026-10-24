import pytest

pytestmark = pytest.mark.django_db

MATCH_QUERY = {"purpose": "working_capital", "amount": "500000", "term": 12}


def test_match_filters_by_request_and_profile(make_client, make_product, profile_data):
    client = make_client(profile=profile_data)  # ООО, оборот 850 тыс., бизнесу ~3,5 года
    fits = make_product(name="Подходит")
    make_product(name="Только ИП", legal_form="ip")
    make_product(name="Для старого бизнеса", min_business_age_months=120)
    make_product(name="Нужен залог", collateral_type="property")
    make_product(name="Выключен", is_active=False)

    response = client.get("/api/products/match", MATCH_QUERY)

    assert response.status_code == 200
    assert [m["product"]["id"] for m in response.json()] == [fits.id]


def test_match_requires_profile(auth_client, make_product):
    make_product()

    assert auth_client.get("/api/products/match", MATCH_QUERY).status_code == 400


def test_calculate_rejects_amount_outside_product(api_client, make_product):
    product = make_product(max_amount=1000000)

    response = api_client.get(
        f"/api/products/{product.id}/calculate", {"amount": "5000000", "term": 12}
    )

    assert response.status_code == 400


def test_calculate_inactive_product_is_404(api_client, make_product):
    product = make_product(is_active=False)

    response = api_client.get(
        f"/api/products/{product.id}/calculate", {"amount": "500000", "term": 12}
    )

    assert response.status_code == 404
