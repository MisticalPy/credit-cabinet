import { useEffect, useState, type FormEvent } from "react";
import {useAuth} from "../../entities/session/model/Auth-context.ts";
import "./LoginDrawer.css";

type Mode = "login" | "register";

// Opened via useAuth().openLogin(); no routing involved.
export function LoginDrawer() {
    const { loginOpen, closeLogin, login, register } = useAuth();
    const [mode, setMode] = useState<Mode>("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // Fresh form every time the drawer opens.
    useEffect(() => {
        if (!loginOpen) return;
        setMode("login");
        setError(null);
        setPassword("");
    }, [loginOpen]);

    useEffect(() => {
        if (!loginOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLogin();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [loginOpen, closeLogin]);

    if (!loginOpen) return null;

    const isLogin = mode === "login";

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await (isLogin ? login : register)({ username, password });
            setPassword("");
            closeLogin();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Не удалось выполнить запрос");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="drawer-backdrop" onClick={closeLogin}>
            <aside
                className="drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="drawer-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="drawer__header">
                    <h2 id="drawer-title">{isLogin ? "Вход" : "Регистрация"}</h2>
                    <button type="button" className="drawer__close" aria-label="Закрыть" onClick={closeLogin}>
                        ×
                    </button>
                </div>

                <form className="drawer__form" onSubmit={submit}>
                    <label className="drawer__field">
                        <span>Логин</span>
                        <input
                            autoFocus
                            required
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </label>
                    <label className="drawer__field">
                        <span>Пароль</span>
                        <input
                            required
                            type="password"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>

                    {error && <p className="drawer__error">{error}</p>}

                    <button type="submit" className="drawer__submit" disabled={busy}>
                        {busy ? "Подождите…" : isLogin ? "Войти" : "Создать аккаунт"}
                    </button>
                </form>

                <button
                    type="button"
                    className="drawer__switch"
                    onClick={() => {
                        setError(null);
                        setMode(isLogin ? "register" : "login");
                    }}
                >
                    {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                </button>
            </aside>
        </div>
    );
}

export default LoginDrawer;