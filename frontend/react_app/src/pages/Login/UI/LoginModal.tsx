import { useEffect, useState, type FormEvent } from "react";
import {useAuth} from "../../../entities/session/model/Auth-context.ts";
import "./loginModal.css";

type Mode = "login" | "register";

export function LoginModal() {
    const { loginOpen, closeLogin, login, register } = useAuth();
    const [mode, setMode] = useState<Mode>("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const close = () => {
        setError(null);
        setPassword("");
        closeLogin();
    };

    useEffect(() => {
        if (!loginOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setError(null);
                setPassword("");
                closeLogin();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [loginOpen, closeLogin]);

    if (!loginOpen) return null;

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await (mode === "login" ? login : register)({ username, password });
            setPassword("");
            closeLogin();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Не удалось выполнить запрос");
        } finally {
            setBusy(false);
        }
    };

    const isLogin = mode === "login";

    return (
        <div className="login-backdrop" onClick={close}>
            <form
                className="login-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-title"
                onClick={(e) => e.stopPropagation()}
                onSubmit={submit}
            >
                <h2 id="login-title">{isLogin ? "Вход" : "Регистрация"}</h2>

                <input
                    autoFocus
                    required
                    placeholder="Логин"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    required
                    type="password"
                    placeholder="Пароль"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p className="login-error">{error}</p>}

                <button type="submit" className="login-submit" disabled={busy}>
                    {busy ? "Подождите…" : isLogin ? "Войти" : "Создать аккаунт"}
                </button>
                <button
                    type="button"
                    className="login-switch"
                    onClick={() => {
                        setError(null);
                        setMode(isLogin ? "register" : "login");
                    }}
                >
                    {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                </button>
            </form>
        </div>
    );
}