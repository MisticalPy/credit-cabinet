/** Временная подпись статуса заявки; позже заменится общим словарём. */
export function statusLabel(status: string): string {
    return status === 'review' ? 'На рассмотрении' : status;
}
