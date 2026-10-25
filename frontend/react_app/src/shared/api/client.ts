function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, message: string, body: unknown) {
        super(message);
        this.status = status;
        this.body = body;
    }
}

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method ?? "GET").toUpperCase();
    const headers = new Headers(options.headers);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    if (!SAFE_METHODS.includes(method)) {
        // Читаем токен КАЖДЫЙ раз: после входа Django его меняет
        const token = getCookie("csrftoken");
        if (token) headers.set("X-CSRFToken", token);
    }

    const response = await fetch(`/api${path}`, {
        ...options,
        method,
        headers,
        credentials: "same-origin",
    });

    if (response.status === 204) return undefined as T;

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const detail = data?.detail;
        const message = Array.isArray(detail)
            ? detail.map((d: { msg: string }) => d.msg).join("; ") // 422: список ошибок полей
            : detail ?? `Ошибка ${response.status}`;
        throw new ApiError(response.status, message, data);
    }
    return data as T;
}
