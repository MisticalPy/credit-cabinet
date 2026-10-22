from django.contrib import auth
from django.views.decorators.csrf import ensure_csrf_cookie
from ninja import Router
from ninja.errors import HttpError

from apps.users import services
from apps.users.schemas import CredentialsIn, UserOut

router = Router(tags=["auth"])


@router.get("/csrf", response={204: None}, auth=None)
@ensure_csrf_cookie
def csrf(request):
    return 204, None


@router.get("/me", response=UserOut)
def me(request):
    return request.user


@router.post("/register", response={201: UserOut}, auth=None)
def register(request, data: CredentialsIn):
    user = services.register_user(username=data.username, password=data.password)
    auth.login(request, user)
    return 201, user


@router.post("/login", response=UserOut, auth=None)
def login(request, data: CredentialsIn):
    user = auth.authenticate(
        request,
        username=services.normalize_username(data.username),
        password=data.password,
    )
    if user is None:
        raise HttpError(401, "Неверный логин или пароль")
    auth.login(request, user)
    return user


@router.post("/logout", response={204: None})
def logout(request):
    auth.logout(request)
    return 204, None
