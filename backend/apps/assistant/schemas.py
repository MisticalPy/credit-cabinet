from typing import Literal

from ninja import Field, Schema


class MessageIn(Schema):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatIn(Schema):
    messages: list[MessageIn] = Field(min_length=1, max_length=50)


class ChatOut(Schema):
    reply: str
