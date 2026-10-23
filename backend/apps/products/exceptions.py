from apps.core.exceptions import ServiceError


class ProfileRequiredError(ServiceError):
    pass


class ConditionsOutOfRangeError(ServiceError):
    pass
