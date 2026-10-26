import { Outlet } from "react-router-dom";
import { useAuth } from "../../entities/session/model/Auth-context";

export function RequireAuth() {
    const { status, openLogin } = useAuth();
    if (status === "loading") return <div>Загрузка…</div>;
    if (status === "guest") {
        return (
            <div className="auth-locked">
                <h2>Требуется вход</h2>
                <p>Войдите в аккаунт, чтобы продолжить.</p>
                <button type="button" onClick={openLogin}>
                    Войти
                </button>
            </div>
        );
    }
    return <Outlet />;
}