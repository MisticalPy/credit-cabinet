# Архитектура

Три диаграммы: схема развёртывания, жизненный цикл заявки и модель данных.
Диаграммы написаны в Mermaid и отображаются в GitLab, GitHub и большинстве редакторов Markdown.

## 1. Развёртывание (docker compose)

```mermaid
flowchart LR
    browser["Браузер клиента / менеджера"]

    subgraph compose["docker compose"]
        nginx["frontend: nginx :8080<br/>статика SPA (React + Vite)"]
        web["web: gunicorn :8000<br/>Django 6 + Django Ninja API<br/>админка unfold, whitenoise"]
        migrate["migrate (одноразовый)<br/>migrate + seed"]
        db[("db: PostgreSQL 18")]

        subgraph inproc["in-process внутри Django"]
            mocks["apps/integrations<br/>моки ЕГРЮЛ и БКИ"]
        end
    end

    llm["LLM API<br/>(опционально, чат-ассистент)"]

    browser -->|"HTTP :8080"| nginx
    nginx -->|"/api, /admin, /static"| web
    web --> db
    web --> mocks
    web -.->|"если задан LLM_API_KEY"| llm
    migrate --> db
    migrate -.->|"web стартует после успешного завершения"| web
```

Что важно знать:

- Единственная публичная точка входа для пользователя - nginx на порту 8080. Он отдаёт собранную SPA, а запросы на `/api`, `/admin` и `/static` проксирует в `web:8000`.
- Статику админки раздаёт сам Django через whitenoise, поэтому общий volume с nginx не нужен.
- Сервис `migrate` применяет миграции и запускает идемпотентный `seed`; сервис `web` стартует только после его успешного завершения.
- Проверки ЕГРЮЛ и БКИ - детерминированные функции в `backend/apps/integrations/checks.py`, а не сетевые вызовы.
- LLM нужна только чат-ассистенту (`POST /api/assistant/chat`). Без `LLM_API_KEY` ассистент отвечает 503, остальные функции работают.
- Бэкенд также опубликован напрямую на `127.0.0.1:8000`, PostgreSQL в dev-режиме (через `compose.override.yaml`) - на `127.0.0.1:5432`.

## 2. Статусы заявки

Переходы взяты из `TRANSITIONS` в `backend/apps/applications/services.py`.

```mermaid
stateDiagram-v2
    [*] --> draft: клиент создаёт заявку
    draft --> submitted: клиент отправляет
    submitted --> scoring: система
    scoring --> review: автоскоринг завершён
    review --> approved: менеджер одобряет
    review --> rejected: менеджер отказывает
    review --> counter_offer: менеджер предлагает другие условия
    review --> info_requested: менеджер запрашивает данные
    counter_offer --> approved: клиент принимает встречное предложение
    info_requested --> submitted: клиент отправляет повторно
    approved --> [*]
    rejected --> [*]
```

Пояснения:

- Переходы `draft -> submitted -> scoring -> review` выполняются одним вызовом `POST /api/applications/{id}/submit`: система отправляет заявку, запускает скоринг и переводит её на рассмотрение менеджеру. Каждый шаг пишется в историю статусов.
- Решение принимает менеджер в админке (`decide`): одобрить, отказать, встречное предложение или запрос данных. Рекомендация скоринга носит совещательный характер.
- Из `counter_offer` клиент может только принять предложение (`accept-offer`). Отдельного перехода «клиент отказался» в коде нет.
- `rejected` и `approved` - конечные статусы, других переходов из них нет.

## 3. Модель данных

Поля и связи взяты из `backend/apps/*/models.py`.

```mermaid
erDiagram
    USER ||--o| BUSINESS_PROFILE : "имеет (один профиль)"
    USER ||--o{ LOAN_APPLICATION : "подаёт"
    CREDIT_PRODUCT ||--o{ LOAN_APPLICATION : "выбран в"
    LOAN_APPLICATION ||--o{ APPLICATION_STATUS_HISTORY : "ведёт историю"
    USER |o--o{ APPLICATION_STATUS_HISTORY : "автор перехода (пусто = система)"

    USER {
        int id PK
        string username UK
        string password
        string role "client | manager"
        bool is_staff
        bool is_superuser
    }

    BUSINESS_PROFILE {
        int id PK
        int user_id FK "OneToOne"
        string business_type "ip | ooo"
        string company_name
        string inn UK "12 цифр для ИП, 10 для ООО"
        string industry
        decimal monthly_revenue
        date registration_date
        datetime created_at
        datetime updated_at
    }

    CREDIT_PRODUCT {
        int id PK
        string name UK
        text description
        string purpose
        string legal_form "ip | ooo | any"
        string collateral_type "none | property | guarantee"
        decimal min_amount
        decimal max_amount
        int min_term_months
        int max_term_months
        decimal rate "% годовых"
        int min_business_age_months
        decimal min_monthly_revenue
        bool is_active
        datetime created_at
        datetime updated_at
    }

    LOAN_APPLICATION {
        int id PK
        int user_id FK
        int product_id FK "PROTECT"
        decimal amount
        int term_months
        decimal rate "зафиксирована на момент заявки"
        decimal monthly_payment
        text comment
        string status
        int score "0..100, после скоринга"
        string recommendation "approve | counter_offer | reject"
        json scoring_details "расшифровка, ЕГРЮЛ, БКИ"
        datetime scored_at
        decimal suggested_amount
        text manager_comment
        decimal counter_amount
        int counter_term_months
        datetime created_at
        datetime updated_at
    }

    APPLICATION_STATUS_HISTORY {
        int id PK
        int application_id FK
        string from_status
        string to_status
        int actor_id FK "SET NULL, пусто = система"
        text comment
        datetime created_at
    }
```

Ограничения БД (`CheckConstraint`): ИНН должен соответствовать типу бизнеса (12 цифр для ИП, 10 для ООО), оборот неотрицательный, диапазоны суммы и срока продукта корректны, ставка в диапазоне (0; 100), сумма и срок заявки положительны.
