from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR.parent / ".env")

DEBUG = env.bool("DEBUG", default=False)
SECRET_KEY = env("SECRET_KEY")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

USE_HTTPS = env.bool("USE_HTTPS", default=False)

LLM_BASE_URL = env("LLM_BASE_URL", default="https://openai.bothub.chat/v1")
LLM_API_KEY = env("LLM_API_KEY", default="")
LLM_MODEL = env("LLM_MODEL", default="") or "gpt-4.1-nano"

# HSTS preload is effectively irreversible and not needed for this project
SILENCED_SYSTEM_CHECKS = ["security.W021"]

if USE_HTTPS:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=3600)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True


INSTALLED_APPS = [
    # Админка
    "unfold",
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Сторонние
    "ninja",
    # my app
    "apps.users",
    "apps.products",
    "apps.applications",
    "apps.core",
]

AUTH_USER_MODEL = "users.User"

UNFOLD = {
    "SITE_TITLE": "Кредитный кабинет",
    "SITE_HEADER": "Кредитный кабинет",
    "SITE_SYMBOL": "account_balance",
    "BORDER_RADIUS": "8px",
    "COLORS": {
        "base": {
            "50": "oklch(98.5% 0 0)",
            "100": "oklch(97% 0 0)",
            "200": "oklch(92.2% 0 0)",
            "300": "oklch(87% 0 0)",
            "400": "oklch(70.8% 0 0)",
            "500": "oklch(55.6% 0 0)",
            "600": "oklch(43.9% 0 0)",
            "700": "oklch(37.1% 0 0)",
            "800": "oklch(26.9% 0 0)",
            "900": "oklch(20.5% 0 0)",
            "950": "oklch(14.5% 0 0)",
        },
        "primary": {
            "50": "oklch(97.3% .013 29.3)",
            "100": "oklch(94.6% .03 29.3)",
            "200": "oklch(89.5% .06 29.3)",
            "300": "oklch(82% .11 29.3)",
            "400": "oklch(72% .17 29.3)",
            "500": "oklch(61.8% .226 29.3)",
            "600": "oklch(55% .21 29.3)",
            "700": "oklch(48% .18 29.3)",
            "800": "oklch(41% .15 29.3)",
            "900": "oklch(35% .12 29.3)",
            "950": "oklch(25% .09 29.3)",
        },
    },
}

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database

DATABASES = {"default": env.db("DATABASE_URL")}


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization

LANGUAGE_CODE = "ru-ru"
TIME_ZONE = "Europe/Moscow"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)

STATIC_URL = "static/"


# Email

MAILERS = {
    "default": {
        "BACKEND": "django.core.mail.backends.console.EmailBackend",
    },
}
