from apps.core.exceptions import ServiceError


class UsernameTakenError(ServiceError):
    pass


class WeakPasswordError(ServiceError):
    pass


class InnTakenError(ServiceError):
    pass
