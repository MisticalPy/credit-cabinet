from ninja import NinjaAPI
from ninja.security import django_auth

from apps.core.exceptions import ServiceError
from apps.users.api import profile_router
from apps.users.api import router as users_router

api = NinjaAPI(title="Умный кредитный кабинет", version="0.1.0", auth=django_auth)
api.add_router("/auth", users_router)
api.add_router("/profile", profile_router)


@api.exception_handler(ServiceError)
def service_error(request, exc: ServiceError):
    return api.create_response(request, {"detail": str(exc)}, status=400)
