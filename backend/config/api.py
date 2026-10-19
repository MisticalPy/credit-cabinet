from ninja import NinjaAPI

from apps.users.api import router as auth_router

api = NinjaAPI(title="Кредитный кабинет API")

api.add_router("/auth", auth_router)
