from apps.core.exceptions import ServiceError


class InvalidTransitionError(ServiceError):
    pass


class ProfileRequiredError(ServiceError):
    pass


class CounterOfferDataError(ServiceError):
    pass
