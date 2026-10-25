import { createContext, useContext } from "react";
import type { User } from "../../../shared/api/types";

export type AuthStatus = "loading" | "guest" | "ready";

export type Credentials = { username: string; password: string };

export type AuthContextValue = {
    status: AuthStatus;
    user: User | null;
    login: (data: Credentials) => Promise<void>;
    register: (data: Credentials) => Promise<void>;
    logout: () => Promise<void>;
    loginOpen: boolean;
    openLogin: () => void;
    closeLogin: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}