import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../entities/session/model/Auth-context";
import "../../../widgets/LoginDrawer/LoginDrawer.css";
import "./ProfileDrawer.css";

interface Props {
    open: boolean;
    onClose: () => void;
}

export function ProfileDrawer({ open, onClose }: Props) {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const goToAccount = () => {
        onClose();
        navigate("/account");
    };

    const handleLogout = async () => {
        setBusy(true);
        try {
            await logout();
            onClose();
            navigate("/");
        } catch (err) {
            console.error(err);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="drawer-backdrop" onClick={onClose}>
            <aside
                className="drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="drawer__header">
                    <h2 id="profile-title">Профиль</h2>
                    <button type="button" className="drawer__close" aria-label="Закрыть" onClick={onClose}>
                        ×
                    </button>
                </div>

                <nav className="profile-menu">
                    <button type="button" className="profile-menu__item" onClick={goToAccount}>
                        <span>
                            <b className="profile-menu__title">Аккаунт</b>
                            <span className="profile-menu__text">Данные о вашем бизнесе</span>
                        </span>
                        <span className="profile-menu__chevron" aria-hidden="true">
                            ›
                        </span>
                    </button>
                </nav>

                <button type="button" className="profile-logout" disabled={busy} onClick={handleLogout}>
                    {busy ? "Выходим…" : "Выйти"}
                </button>
            </aside>
        </div>
    );
}

export default ProfileDrawer;