# Лицензии сторонних компонентов

Дата генерации: 2026-10-26. Файл создан инструментами, вручную не правится.

Перечислены только runtime-зависимости: пакеты, которые попадают в образы `backend` и `frontend`.
Инструменты разработки и сборки (ruff, pytest, vite, typescript и другие) не включены.

## Как сгенерировано

Бэкенд (Python, пакетов: 24, версии из `backend/uv.lock`, платформа Linux как в Docker-образе):

```bash
cd backend
uv export --no-dev --no-hashes --no-emit-project --format requirements-txt -o req.txt
uv venv .venv && uv pip install --python .venv/bin/python -r req.txt pip-licenses
.venv/bin/pip-licenses --python .venv/bin/python --format=markdown --with-urls --order=license \
    --ignore-packages pip-licenses prettytable wcwidth pip
```

Фронтенд (npm, пакетов: 7, версии из `frontend/react_app/package-lock.json`):

```bash
cd frontend/react_app
npm ci
npx license-checker-rseidelsohn --production --json --excludePrivatePackages
```

Результат приведён к таблицам «пакет / версия / лицензия / ссылка» скриптом.

## Бэкенд (Python)

| Пакет | Версия | Лицензия | Сайт |
|---|---|---|---|
| annotated-types | 0.8.0 | MIT | https://github.com/annotated-types/annotated-types |
| anyio | 4.15.1 | MIT | https://anyio.readthedocs.io/en/stable/versionhistory.html |
| asgiref | 3.12.1 | BSD License | https://github.com/django/asgiref/ |
| Django | 6.1.2 | BSD-3-Clause | https://www.djangoproject.com/ |
| django-environ | 0.14.0 | MIT | https://django-environ.readthedocs.org |
| django-ninja | 1.7.1 | MIT License | https://django-ninja.dev |
| django-unfold | 0.110.0 | MIT | https://unfoldadmin.com |
| gunicorn | 26.2.0 | MIT | https://gunicorn.org |
| h11 | 0.16.0 | MIT License | https://github.com/python-hyper/h11 |
| httpcore2 | 2.16.0 | BSD-3-Clause | https://github.com/pydantic/httpx2 |
| httpx2 | 2.16.0 | BSD-3-Clause | https://github.com/pydantic/httpx2 |
| idna | 3.20 | BSD-3-Clause | https://github.com/kjd/idna |
| jiter | 0.18.0 | MIT | https://github.com/pydantic/jiter/ |
| openai | 3.37.0 | Apache-2.0 | https://github.com/openai/openai-python |
| psycopg | 3.3.6 | LGPL-3.0-only | https://psycopg.org/ |
| psycopg-binary | 3.3.6 | LGPL-3.0-only | https://psycopg.org/ |
| pydantic | 2.14.1 | MIT | https://github.com/pydantic/pydantic |
| pydantic_core | 2.50.1 | MIT | https://github.com/pydantic |
| sniffio | 1.3.1 | Apache Software License; MIT License | https://github.com/python-trio/sniffio |
| sqlparse | 0.6.0 | BSD License | https://github.com/andialbrecht/sqlparse |
| truststore | 0.10.5 | MIT | https://github.com/sethmlarson/truststore |
| typing-inspection | 0.4.4 | MIT | https://github.com/pydantic/typing-inspection |
| typing_extensions | 4.16.0 | PSF-2.0 | https://github.com/python/typing_extensions |
| whitenoise | 6.12.0 | MIT | https://github.com/evansd/whitenoise |

Примечание: `psycopg` и `psycopg-binary` распространяются под LGPL-3.0. Библиотека используется как есть, без модификации, и подключается как отдельный Python-пакет.

## Фронтенд (npm)

| Пакет | Версия | Лицензия | Репозиторий |
|---|---|---|---|
| cookie | 1.1.1 | MIT | https://github.com/jshttp/cookie |
| react | 19.3.0 | MIT | https://github.com/react/react |
| react-dom | 19.3.0 | MIT | https://github.com/react/react |
| react-router | 7.18.4 | MIT | https://github.com/remix-run/react-router |
| react-router-dom | 7.18.4 | MIT | https://github.com/remix-run/react-router |
| scheduler | 0.28.0 | MIT | https://github.com/react/react |
| set-cookie-parser | 2.7.2 | MIT | https://github.com/nfriedly/set-cookie-parser |

## Образы и сервисы

Docker-образы `postgres`, `nginx`, `node` и `python` (базовый образ `uv`) имеют собственные лицензии, указанные у их поставщиков; в этот список они не входят.
