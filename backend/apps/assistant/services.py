import logging

from django.conf import settings
from openai import OpenAI, OpenAIError

from apps.products import services as products_services
from apps.users import services as users_services
from apps.users.models import User

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Ты ассистент кредитного кабинета для малого бизнеса.
Отвечай коротко и по делу, на русском.
Решений по кредиту не принимаешь и не обещаешь одобрение, заявки не создаёшь:
для этого клиент сам подаёт заявку в кабинете.
Платежи сам не считай, бери только цифры из данных ниже,
для точного расчёта советуй калькулятор в кабинете."""


class AssistantUnavailableError(Exception):
    """LLM недоступна или не настроена. Обработчик в config/api.py отдаёт 503."""


def build_context(user: User) -> str:
    lines = ["Активные продукты:"]
    for p in products_services.get_active_products():
        # Пример платежа считаем сами, а не моделью
        payment = products_services.calculate_payment(
            amount=p.max_amount, term_months=p.max_term_months, annual_rate=p.rate
        )
        lines.append(
            f"- {p.name}: {p.get_purpose_display()}, {p.get_legal_form_display()}, "
            f"{p.get_collateral_type_display()}, {p.min_amount}–{p.max_amount} ₽, "
            f"{p.min_term_months}–{p.max_term_months} мес., {p.rate}% годовых, "
            f"бизнес от {p.min_business_age_months} мес., оборот от {p.min_monthly_revenue} ₽. "
            f"Платёж при {p.max_amount} ₽ на {p.max_term_months} мес.: "
            f"{payment.monthly_payment} ₽/мес."
        )

    profile = users_services.get_profile(user)
    if profile is None:
        lines.append("Профиль бизнеса не заполнен.")
    else:
        lines.append(
            f"Профиль клиента: {profile.company_name}, {profile.get_business_type_display()}, "
            f"{profile.get_industry_display()}, оборот {profile.monthly_revenue} ₽/мес., "
            f"бизнесу {profile.business_age_months} мес."
        )
    return "\n".join(lines)


def chat(*, user: User, messages: list[dict]) -> str:
    if not settings.LLM_API_KEY:
        raise AssistantUnavailableError
    client = OpenAI(
        base_url=settings.LLM_BASE_URL, api_key=settings.LLM_API_KEY, timeout=30, max_retries=0
    )
    system = {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n{build_context(user)}"}
    try:
        response = client.chat.completions.create(
            model=settings.LLM_MODEL, messages=[system, *messages]
        )
    except OpenAIError as e:
        # Только тип ошибки: в тексте может оказаться что-то лишнее
        logger.warning("LLM request failed: %s", type(e).__name__)
        raise AssistantUnavailableError from e
    return response.choices[0].message.content or ""
