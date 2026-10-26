import { api } from "./client";
import type { Match, Payment, Product, Profile, User } from "./types";

type Credentials = { username: string; password: string };
type ProfileIn = Omit<Profile, "business_age_months">;

export const auth = {
    csrf: () => api<void>("/auth/csrf"),
    me: () => api<User>("/auth/me"),
    register: (data: Credentials) =>
        api<User>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: Credentials) =>
        api<User>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    logout: () => api<void>("/auth/logout", { method: "POST" }),
};

export const profile = {
    get: () => api<Profile>("/profile"),
    save: (data: ProfileIn) =>
        api<Profile>("/profile", { method: "PUT", body: JSON.stringify(data) }),
};

export const products = {
    list: () => api<Product[]>("/products"),
    calculate: (id: number, amount: string, term: number) =>
        api<Payment>(`/products/${id}/calculate?${new URLSearchParams({ amount, term: String(term) })}`),
    match: (q: { purpose: string; amount: string; term: number; collateral?: string }) =>
        api<Match[]>(`/products/match?${new URLSearchParams({ ...q, term: String(q.term) } as Record<string, string>)}`),
};