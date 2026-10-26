/** Подписи статусов заявки для интерфейса. */
export const APPLICATION_STATUS_LABELS: Record<string, string> = {
    draft: 'Черновик',
    submitted: 'Отправлена',
    scoring: 'Проверка',
    review: 'На рассмотрении',
    approved: 'Одобрена',
    rejected: 'Отказ',
    counter_offer: 'Встречное предложение',
    info_requested: 'Запрошены данные',
};

/** Подпись статуса; если статус неизвестен — возвращаем его как есть. */
export function statusLabel(status: string): string {
    return APPLICATION_STATUS_LABELS[status] ?? status;
}
