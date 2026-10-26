import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../entities/session/model/Auth-context";
import { ApiError } from "../../shared/api/client";
import { profile } from "../../shared/api/endpoints";
import type { BusinessType, Industry } from "../../shared/api/types";
import "./AccountPage.css";

interface BusinessForm {
    company_name: string;
    inn: string;
    business_type: string;
    industry: string;
    registration_date: string;
    business_age_months: string; // read-only, calculated by the backend
    monthly_revenue: string;
}

const EMPTY: BusinessForm = {
    company_name: "",
    inn: "",
    business_type: "",
    industry: "",
    registration_date: "",
    business_age_months: "",
    monthly_revenue: "",
};

// code sent to the backend -> label shown to the user.
const BUSINESS_TYPES: Record<string, string> = {
    ip: "ИП",
    ooo: "ООО",
};

const INDUSTRIES: Record<string, string> = {
    trade: "Торговля",
    food: "Общепит",
    services: "Услуги",
    manufacturing: "Производство",
    construction: "Строительство",
    transport: "Транспорт",
    it: "IT",
    other: "Другое",
};

interface FieldProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    hint?: string;
    inputMode?: "numeric" | "text";
    disabled?: boolean;
}

function Field({ label, value, onChange, type = "text", hint, inputMode, disabled }: FieldProps) {
    return (
        <label className="account__field">
            <span className="account__label">{label}</span>
            <input
                className="account__input"
                type={type}
                inputMode={inputMode}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
            />
            {hint && <span className="account__hint">{hint}</span>}
        </label>
    );
}

interface SelectFieldProps {
    label: string;
    value: string;
    options: Record<string, string>;
    onChange: (v: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
    // Keep a value that is not in the list (e.g. loaded from the server) visible.
    const known = value === "" || value in options;
    return (
        <label className="account__field">
            <span className="account__label">{label}</span>
            <select className="account__input" value={value} onChange={(e) => onChange(e.target.value)}>
                <option value="" disabled>
                    Выберите
                </option>
                {!known && <option value={value}>{value}</option>}
                {Object.entries(options).map(([code, text]) => (
                    <option key={code} value={code}>
                        {text}
                    </option>
                ))}
            </select>
        </label>
    );
}

export default function AccountPage() {
    const { status, openLogin } = useAuth();
    const [form, setForm] = useState<BusinessForm>(EMPTY);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const set = <K extends keyof BusinessForm>(key: K, value: string) => {
        setMessage(null);
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const fromJson = (json: Record<string, unknown>): BusinessForm => ({
        company_name: String(json.company_name ?? ""),
        inn: String(json.inn ?? ""),
        business_type: String(json.business_type ?? ""),
        industry: String(json.industry ?? ""),
        registration_date: String(json.registration_date ?? ""),
        business_age_months: String(json.business_age_months ?? ""),
        monthly_revenue: String(json.monthly_revenue ?? ""),
    });

    // Load saved data once the user is logged in.
    useEffect(() => {
        if (status !== "ready") return;
        let cancelled = false;
        (async () => {
            try {
                const data = await profile.get();
                if (!cancelled) setForm(fromJson({ ...data }));
            } catch {
                /* 404 (профиль не заполнен) и прочее: пустая форма */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [status]);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const saved = await profile.save({
                company_name: form.company_name,
                inn: form.inn,
                business_type: form.business_type as BusinessType,
                industry: form.industry as Industry,
                registration_date: form.registration_date,
                monthly_revenue: form.monthly_revenue || "0",
            });
            // Backend returns the saved profile, including the calculated age.
            setForm(fromJson({ ...saved }));
            setMessage({ ok: true, text: "Данные сохранены" });
        } catch (err) {
            const text = err instanceof ApiError ? err.message : "Не удалось сохранить. Попробуйте ещё раз.";
            setMessage({ ok: false, text });
        } finally {
            setSaving(false);
        }
    };

    if (status === "loading") return null;

    if (status === "guest") {
        return (
            <div className="account account--locked">
                <h1 className="account__title">Аккаунт</h1>
                <p>Войдите, чтобы заполнить данные о бизнесе.</p>
                <button type="button" className="account__btn" onClick={openLogin}>
                    Войти
                </button>
            </div>
        );
    }

    return (
        <div className={"account_page"}>
            <div className="account">
                <div className="account__main">
                    <h1 className="account__title">Аккаунт</h1>

                    <form onSubmit={submit}>
                        <h2 className="account__section">Компания</h2>
                        <div className="account__grid">
                            <Field
                                label="Название компании"
                                value={form.company_name}
                                onChange={(v) => set("company_name", v)}
                            />
                            <Field
                                label="ИНН"
                                inputMode="numeric"
                                value={form.inn}
                                onChange={(v) => set("inn", v)}
                            />
                        </div>

                        <h2 className="account__section">Бизнес</h2>
                        <div className="account__grid">
                            <SelectField
                                label="Тип бизнеса"
                                value={form.business_type}
                                options={BUSINESS_TYPES}
                                onChange={(v) => set("business_type", v)}
                            />
                            <SelectField
                                label="Отрасль"
                                value={form.industry}
                                options={INDUSTRIES}
                                onChange={(v) => set("industry", v)}
                            />
                            <Field
                                label="Дата регистрации"
                                type="date"
                                value={form.registration_date}
                                onChange={(v) => set("registration_date", v)}
                            />
                            <Field
                                label="Возраст бизнеса, мес."
                                type="number"
                                disabled
                                value={form.business_age_months}
                                onChange={() => {}}
                                hint="Рассчитывается автоматически"
                            />
                            <Field
                                label="Выручка в месяц, ₽"
                                type="number"
                                value={form.monthly_revenue}
                                onChange={(v) => set("monthly_revenue", v)}
                            />
                        </div>

                        {message && (
                            <p className={message.ok ? "account__ok" : "account__error"}>{message.text}</p>
                        )}

                        <button type="submit" className="account__btn" disabled={saving}>
                            {saving ? "Сохраняем…" : "Сохранить"}
                        </button>
                    </form>
                </div>

                <aside className="account__aside">
                    <b>Как улучшить подбор?</b>
                    <p>Заполните данные о бизнесе — так ИИ сможет точнее подобрать подходящие кредиты.</p>
                </aside>
            </div>
        </div>
    );
}
