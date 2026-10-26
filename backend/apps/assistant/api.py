from ninja import Router

from apps.assistant import services
from apps.assistant.schemas import ChatIn, ChatOut

router = Router(tags=["assistant"])


@router.post("/chat", response=ChatOut)
def chat(request, payload: ChatIn):
    messages = [m.model_dump() for m in payload.messages]
    return {"reply": services.chat(user=request.user, messages=messages)}
