"""Моки внешних проверок. Ответ детерминирован по последней цифре ИНН:
- ЕГРЮЛ: ИНН оканчивается на 0 → компания ликвидирована (стоп-фактор)
- БКИ: ИНН оканчивается на 7, 8 или 9 → есть просрочки
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class EgrulResult:
    is_active: bool
    status: str


@dataclass(frozen=True)
class BkiResult:
    has_overdue: bool
    overdue_count: int


def check_egrul(inn: str) -> EgrulResult:
    if inn.endswith("0"):
        return EgrulResult(is_active=False, status="Ликвидирована")
    return EgrulResult(is_active=True, status="Действующая")


def check_bki(inn: str) -> BkiResult:
    last_digit = int(inn[-1])
    if last_digit >= 7:
        return BkiResult(has_overdue=True, overdue_count=last_digit - 6)
    return BkiResult(has_overdue=False, overdue_count=0)
