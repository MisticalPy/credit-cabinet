from django.http import HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from ninja import Router
from ninja.security import django_auth

from apps.users.schemas import UserOut

router = Router(tags=["auth"])


@router.get("/csrf")
@ensure_csrf_cookie
def csrf(request):
    return HttpResponse(status=204)


@router.get("/me", response=UserOut, auth=django_auth)
def me(request):
    return request.user
