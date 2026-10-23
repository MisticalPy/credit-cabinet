from ninja import Field, ModelSchema, Schema

from apps.users.models import User


class UserOut(ModelSchema):
    class Meta:
        model = User
        fields = ["id", "username", "role"]


class CredentialsIn(Schema):
    username: str = Field(min_length=3, max_length=150, pattern=r"^[\w.@+-]+$")
    password: str = Field(min_length=1, max_length=128)
