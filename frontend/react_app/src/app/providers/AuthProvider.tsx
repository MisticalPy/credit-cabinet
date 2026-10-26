import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { ApiError } from "../../shared/api/client";
import { auth } from "../../shared/api/endpoints";
import type { User } from "../../shared/api/types";
import {
    AuthContext,
    type AuthContextValue,
    type AuthStatus,
    type Credentials,
} from "../../entities/session/model/Auth-context";



type State = { status: AuthStatus; user: User | null };

const GUEST: State = { status: "guest", user: null };

async function loadSession(): Promise<State> {
    try {
        const user = await auth.me();
        return { status: "ready", user };
    } catch (e) {
        if (e instanceof ApiError && e.status === 401) return GUEST;
        throw e;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<State>({ status: "loading", user: null });
    const [loginOpen, setLoginOpen] = useState(false);

    // One-time bootstrap: csrf cookie → me
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await auth.csrf();
                const next = await loadSession();
                if (!cancelled) setState(next);
            } catch (e) {
                console.error(e);
                if (!cancelled) setState(GUEST);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (data: Credentials) => {
        const user = await auth.login(data); // ApiError goes to the caller (modal shows e.message)
        setState({ status: "ready", user });
    }, []);

    const register = useCallback(async (data: Credentials) => {
        const user = await auth.register(data);
        setState({ status: "ready", user });
    }, []);

    const logout = useCallback(async () => {
        await auth.logout();
        setState(GUEST);
    }, []);

    const openLogin = useCallback(() => setLoginOpen(true), []);
    const closeLogin = useCallback(() => setLoginOpen(false), []);

    const value = useMemo<AuthContextValue>(
        () => ({ ...state, login, register, logout, loginOpen, openLogin, closeLogin }),
        [state, login, register, logout, loginOpen, openLogin, closeLogin],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}