from unittest.mock import patch

import pytest
from openai import APITimeoutError

pytestmark = pytest.mark.django_db

URL = "/api/assistant/chat"
BODY = {"messages": [{"role": "user", "content": "Какие есть кредиты?"}]}


@pytest.fixture(autouse=True)
def llm_settings(settings):
    settings.LLM_API_KEY = "test-key"


def test_chat_returns_reply(make_client, make_product, profile_data):
    client = make_client(profile=profile_data)
    make_product(name="Оборотка")
    with patch("apps.assistant.services.OpenAI") as openai_cls:
        create = openai_cls.return_value.chat.completions.create
        create.return_value.choices[0].message.content = "Есть «Оборотка»"

        response = client.post(URL, BODY)

    assert response.status_code == 200
    assert response.json() == {"reply": "Есть «Оборотка»"}
    system = create.call_args.kwargs["messages"][0]["content"]
    assert "Оборотка" in system
    assert "Кофейня Зерно" in system


def test_chat_requires_login(api_client):
    assert api_client.post(URL, BODY).status_code == 401


def test_chat_llm_error_is_503(auth_client):
    with patch("apps.assistant.services.OpenAI") as openai_cls:
        openai_cls.return_value.chat.completions.create.side_effect = APITimeoutError(request=None)

        response = auth_client.post(URL, BODY)

    assert response.status_code == 503
    assert response.json() == {"detail": "Ассистент временно недоступен"}
