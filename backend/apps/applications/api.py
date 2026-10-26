from ninja import Router, Status

from apps.applications import services
from apps.applications.schemas import ApplicationDetailOut, ApplicationIn, ApplicationOut

router = Router(tags=["applications"])


@router.post("", response={201: ApplicationOut})
def create_application(request, data: ApplicationIn):
    application = services.create_application(user=request.user, **data.model_dump())
    return Status(201, application)


@router.get("", response=list[ApplicationOut])
def list_applications(request):
    return services.list_user_applications(request.user)


@router.get("/{application_id}", response=ApplicationDetailOut)
def get_application(request, application_id: int):
    return services.get_user_application(request.user, application_id)


@router.post("/{application_id}/submit", response=ApplicationDetailOut)
def submit_application(request, application_id: int):
    return services.submit_application(user=request.user, application_id=application_id)


@router.post("/{application_id}/accept-offer", response=ApplicationDetailOut)
def accept_offer(request, application_id: int):
    return services.accept_counter_offer(user=request.user, application_id=application_id)
