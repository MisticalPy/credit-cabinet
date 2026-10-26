import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BusinessType, Industry, Payment, Product, Profile } from "../../../shared/api/types.ts";
import { api, ApiError } from "../../../shared/api/client.ts";
import { products as productsApi, profile as profileApi } from "../../../shared/api/endpoints.ts";
import { useProducts } from "../../../entities/product/model/useProducts.ts";
import { useAuth } from "../../../entities/session/model/Auth-context.ts";
import { statusLabel } from './statusLabel.ts';
import './LoanApplicationForm.css';

const nf = new Intl.NumberFormat('ru-RU');
const money = (n: number | string) => nf.format(Number(n)).replace(/ /g, ' ');

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
    { value: 'ip', label: 'ИП' },
    { value: 'ooo', label: 'ООО' },
];

const INDUSTRIES: { value: Industry; label: string }[] = [
    { value: 'trade', label: 'Торговля' },
    { value: 'food', label: 'Общепит' },
    { value: 'services', label: 'Услуги' },
    { value: 'manufacturing', label: 'Производство' },
    { value: 'construction', label: 'Строительство' },
    { value: 'transport', label: 'Транспорт' },
    { value: 'it', label: 'IT' },
    { value: 'other', label: 'Другое' },
];

const labelOf = (list: { value: string; label: string }[], value: string) =>
    list.find((o) => o.value === value)?.label ?? value;

const STEP_TITLES = ['Заявка', 'Данные компании', 'Согласия'];

const LAST_STEP = STEP_TITLES.length - 1;

const COMMENT_MAX = 1000;

interface ProfileForm {
    business_type: BusinessType;
    company_name: string;
    inn: string;
    industry: Industry | '';
    monthly_revenue: string;
    registration_date: string;
}

const emptyProfile: ProfileForm = {
    business_type: 'ip',
    company_name: '',
    inn: '',
    industry: '',
    monthly_revenue: '',
    registration_date: '',
};

interface SubmitResult {
    status: string;
}

interface Props {
    product: Product;
    onClose: () => void;
    /** Amount (₽) and term (months) chosen on the dashboard; overrides the product defaults. */
    initialValues?: { amount: number; term: number };
}

const filled = (...v: string[]) => v.every((x) => x.trim() !== '');

const innLength = (t: BusinessType) => (t === 'ip' ? 12 : 10);

function isProfileFormValid(p: ProfileForm): boolean {
    return (
        filled(p.company_name, p.industry, p.monthly_revenue, p.registration_date) &&
        new RegExp(`^\\d{${innLength(p.business_type)}}$`).test(p.inn)
    );
}

function isLoanValid(product: Product, amount: string, term: string): boolean {
    const a = Number(amount);
    const t = Number(term);
    return (
        filled(amount, term) &&
        a >= Number(product.min_amount) &&
        a <= Number(product.max_amount) &&
        Number.isInteger(t) &&
        t >= product.min_term_months &&
        t <= product.max_term_months
    );
}

const errorText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

interface TextFieldProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    hint?: string;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
}

function TextField({ label, value, onChange, hint, type = 'text', placeholder, disabled }: TextFieldProps) {
    return (
        <label className="loan-form__field">
            <span className="loan-form__label">{label}</span>
            <input
                className="loan-form__input"
                type={type}
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
            />
            {hint && <span className="loan-form__hint">{hint}</span>}
        </label>
    );
}

interface SelectFieldProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
    return (
        <label className="loan-form__field">
            <span className="loan-form__label">{label}</span>
            <select className="loan-form__input" value={value} onChange={(e) => onChange(e.target.value)}>
                <option value="" disabled>
                    Выберите
                </option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function LoanApplicationForm({ product, onClose, initialValues }: Props) {
    const { status, openLogin } = useAuth();
    const isLoggedIn = status === 'ready';
    const { products } = useProducts();
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [productId, setProductId] = useState(product.id);
    const [amount, setAmount] = useState(String(Number(product.min_amount)));
    const [term, setTerm] = useState(String(product.min_term_months));
    const [comment, setComment] = useState('');
    const [payment, setPayment] = useState<Payment | null>(null);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfile);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [agreeData, setAgreeData] = useState(false);
    const [agreeBureau, setAgreeBureau] = useState(false);
    const [applicationId, setApplicationId] = useState<number | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [resultStatus, setResultStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Выбранный продукт: из списка, а пока он грузится — тот, что передан из Footer.
    const selected = products.find((p) => p.id === productId) ?? (product.id === productId ? product : null);

    // Another card was chosen: reset the loan fields, keep the profile.
    useEffect(() => {
        setProductId(product.id);
        setAmount(String(initialValues?.amount ?? Number(product.min_amount)));
        setTerm(String(initialValues?.term ?? product.min_term_months));
        setStep(0);
        setApplicationId(null);
        setResultStatus(null);
        setConfirmOpen(false);
    }, [product, initialValues]);

    // Профиль компании: 404 — ещё не заполнен, показываем форму.
    useEffect(() => {
        if (!isLoggedIn) return;
        let cancelled = false;
        setProfileLoading(true);
        profileApi
            .get()
            .then((p) => {
                if (!cancelled) setProfile(p);
            })
            .catch((e: unknown) => {
                if (cancelled) return;
                if (e instanceof ApiError && e.status === 404) {
                    setEditingProfile(true);
                } else {
                    setProfileError(errorText(e, 'Не удалось загрузить данные компании'));
                }
            })
            .finally(() => {
                if (!cancelled) setProfileLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isLoggedIn]);

    const loanValid = selected !== null && isLoanValid(selected, amount, term);

    // Ежемесячный платёж пересчитываем при изменении продукта, суммы и срока.
    useEffect(() => {
        if (!selected || !loanValid) {
            setPayment(null);
            return;
        }
        let cancelled = false;
        productsApi
            .calculate(selected.id, amount, Number(term))
            .then((p) => {
                if (!cancelled) setPayment(p);
            })
            .catch(() => {
                if (!cancelled) setPayment(null);
            });
        return () => {
            cancelled = true;
        };
    }, [selected, loanValid, amount, term]);

    const changeProduct = (id: string) => {
        const next = products.find((p) => p.id === Number(id));
        if (!next) return;
        setProductId(next.id);
        setAmount(String(Number(next.min_amount)));
        setTerm(String(next.min_term_months));
    };

    const setProfileField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
        setProfileForm((prev) => ({ ...prev, [key]: value }));

    const startEditProfile = () => {
        if (profile) {
            setProfileForm({
                business_type: profile.business_type,
                company_name: profile.company_name,
                inn: profile.inn,
                industry: profile.industry,
                monthly_revenue: profile.monthly_revenue,
                registration_date: profile.registration_date,
            });
        }
        setProfileError(null);
        setEditingProfile(true);
    };

    const saveProfile = async () => {
        if (!profileForm.industry) return;
        setProfileSaving(true);
        setProfileError(null);
        try {
            const saved = await profileApi.save({ ...profileForm, industry: profileForm.industry });
            setProfile(saved);
            setEditingProfile(false);
        } catch (e) {
            setProfileError(errorText(e, 'Не удалось сохранить данные компании'));
        } finally {
            setProfileSaving(false);
        }
    };

    const handleConfirm = async () => {
        if (!selected) return;
        setSending(true);
        setError(null);
        try {
            // Если черновик уже создан, а submit упал — не плодим дубли.
            let id = applicationId;
            if (id === null) {
                const created = await api<{ id: number }>('/applications', {
                    method: 'POST',
                    body: JSON.stringify({
                        product_id: selected.id,
                        amount,
                        term_months: Number(term),
                        comment,
                    }),
                });
                id = created.id;
                setApplicationId(id);
            }
            const result = await api<SubmitResult>(`/applications/${id}/submit`, { method: 'POST' });
            setResultStatus(result.status);
            setConfirmOpen(false);
        } catch (e) {
            setError(errorText(e, 'Не удалось отправить заявку. Попробуйте ещё раз.'));
        } finally {
            setSending(false);
        }
    };

    const isStepFilled = (s: number): boolean => {
        switch (s) {
            case 0:
                return loanValid;
            case 1:
                return profile !== null && !editingProfile;
            case 2:
                return agreeData && agreeBureau;
            default:
                return false;
        }
    };

    const renderProfile = () => {
        if (profileLoading) return <p className="loan-form__text">Загружаем данные компании…</p>;

        if (editingProfile) {
            return (
                <>
                    <SelectField
                        label="Форма бизнеса"
                        value={profileForm.business_type}
                        options={BUSINESS_TYPES}
                        onChange={(v) => setProfileField('business_type', v as BusinessType)}
                    />
                    <TextField
                        label="Название компании"
                        value={profileForm.company_name}
                        onChange={(v) => setProfileField('company_name', v)}
                    />
                    <TextField
                        label="ИНН"
                        value={profileForm.inn}
                        onChange={(v) => setProfileField('inn', v)}
                        hint={`${innLength(profileForm.business_type)} цифр`}
                    />
                    <SelectField
                        label="Отрасль"
                        value={profileForm.industry}
                        options={INDUSTRIES}
                        onChange={(v) => setProfileField('industry', v as Industry)}
                    />
                    <TextField
                        label="Выручка в месяц, ₽"
                        type="number"
                        value={profileForm.monthly_revenue}
                        onChange={(v) => setProfileField('monthly_revenue', v)}
                    />
                    <TextField
                        label="Дата регистрации"
                        type="date"
                        value={profileForm.registration_date}
                        onChange={(v) => setProfileField('registration_date', v)}
                    />
                    {profileError && <p className="loan-form__error">{profileError}</p>}
                    <div className="loan-form__footer">
                        {profile && (
                            <button
                                type="button"
                                className="loan-form__btn loan-form__btn--ghost"
                                disabled={profileSaving}
                                onClick={() => setEditingProfile(false)}
                            >
                                Отмена
                            </button>
                        )}
                        <button
                            type="button"
                            className="loan-form__btn"
                            disabled={profileSaving || !isProfileFormValid(profileForm)}
                            onClick={saveProfile}
                        >
                            {profileSaving ? 'Сохраняем…' : 'Сохранить'}
                        </button>
                    </div>
                </>
            );
        }

        if (!profile) {
            return profileError && <p className="loan-form__error">{profileError}</p>;
        }

        return (
            <>
                <p className="loan-form__text">
                    {labelOf(BUSINESS_TYPES, profile.business_type)} «{profile.company_name}»
                    <br />
                    ИНН {profile.inn}
                    <br />
                    Отрасль: {labelOf(INDUSTRIES, profile.industry)}
                    <br />
                    Выручка в месяц: {money(profile.monthly_revenue)} ₽
                    <br />
                    Дата регистрации: {profile.registration_date} · возраст бизнеса: {profile.business_age_months} мес.
                </p>
                <button type="button" className="loan-form__btn loan-form__btn--ghost" onClick={startEditProfile}>
                    Изменить
                </button>
            </>
        );
    };

    const renderBody = () => {
        if (resultStatus !== null) {
            return (
                <div className="loan-form__center">
                    <h2 className="loan-form__title">Заявка отправлена</h2>
                    <p className="loan-form__text">Статус: {statusLabel(resultStatus)}</p>
                    <div className="loan-form__footer">
                        <button
                            type="button"
                            className="loan-form__btn"
                            onClick={() => {
                                onClose();
                                navigate('/requests');
                            }}
                        >
                            Мои заявки
                        </button>
                        <button type="button" className="loan-form__btn loan-form__btn--ghost" onClick={onClose}>
                            Закрыть
                        </button>
                    </div>
                </div>
            );
        }

        if (!isLoggedIn) {
            return (
                <div className="loan-form__center">
                    <h2 className="loan-form__title">Войдите, чтобы подать заявку</h2>
                    <p className="loan-form__text">Заявка на «{product.name}» сохранится в вашем кабинете.</p>
                    <button type="button" className="loan-form__btn" onClick={openLogin}>
                        Войти
                    </button>
                </div>
            );
        }

        return (
            <>
                <div className="loan-form__progress">
                    Шаг {step + 1} из {STEP_TITLES.length} · {selected?.name ?? product.name}
                </div>
                <h2 className="loan-form__title">{STEP_TITLES[step]}</h2>

                {step === 0 && (
                    <>
                        <label className="loan-form__field">
                            <span className="loan-form__label">Продукт</span>
                            <select
                                className="loan-form__input"
                                value={productId}
                                onChange={(e) => changeProduct(e.target.value)}
                            >
                                {(products.length > 0 ? products : [product]).map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {selected && (
                            <>
                                <TextField
                                    label="Сумма, ₽"
                                    type="number"
                                    value={amount}
                                    onChange={setAmount}
                                    hint={`От ${money(selected.min_amount)} до ${money(selected.max_amount)} ₽`}
                                />
                                <TextField
                                    label="Срок, мес."
                                    type="number"
                                    value={term}
                                    onChange={setTerm}
                                    hint={`От ${selected.min_term_months} до ${selected.max_term_months} мес.`}
                                />
                            </>
                        )}
                        <label className="loan-form__field">
                            <span className="loan-form__label">Цель кредита</span>
                            <textarea
                                className="loan-form__input"
                                rows={3}
                                maxLength={COMMENT_MAX}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                            <span className="loan-form__hint">
                                {comment.length} / {COMMENT_MAX}
                            </span>
                        </label>
                        {payment && (
                            <p className="loan-form__text">
                                Ежемесячный платёж: {money(payment.monthly_payment)} ₽ · Всего: {money(payment.total)} ₽
                                · Переплата: {money(payment.overpayment)} ₽
                            </p>
                        )}
                    </>
                )}

                {step === 1 && renderProfile()}

                {step === 2 && (
                    <>
                        <label className="loan-form__check">
                            <input
                                type="checkbox"
                                checked={agreeData}
                                onChange={(e) => setAgreeData(e.target.checked)}
                            />
                            <span>Я соглашаюсь с условиями и даю согласие на обработку моих персональных данных</span>
                        </label>
                        <label className="loan-form__check">
                            <input
                                type="checkbox"
                                checked={agreeBureau}
                                onChange={(e) => setAgreeBureau(e.target.checked)}
                            />
                            <span>Я разрешаю сделать запрос в бюро кредитных историй</span>
                        </label>
                    </>
                )}

                <div className="loan-form__footer">
                    {step > 0 && (
                        <button
                            type="button"
                            className="loan-form__btn loan-form__btn--ghost"
                            onClick={() => setStep((s) => s - 1)}
                        >
                            Назад
                        </button>
                    )}
                    {step < LAST_STEP ? (
                        <button
                            type="button"
                            className="loan-form__btn"
                            disabled={!isStepFilled(step)}
                            onClick={() => setStep((s) => s + 1)}
                        >
                            Продолжить
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="loan-form__btn"
                            disabled={!isStepFilled(step)}
                            onClick={() => setConfirmOpen(true)}
                        >
                            Отправить
                        </button>
                    )}
                </div>
            </>
        );
    };

    return (
        <section className="loan-form" id="loan-application">
            <button type="button" className="loan-form__close" aria-label="Закрыть форму" onClick={onClose}>
                ×
            </button>
            {renderBody()}

            {confirmOpen && (
                <div className="loan-form__overlay" role="alertdialog" aria-modal="true">
                    <div className="loan-form__alert">
                        <h3 className="loan-form__subtitle">Отправить заявку?</h3>
                        <p className="loan-form__text">Проверьте данные. После отправки изменить заявку нельзя.</p>
                        {error && <p className="loan-form__error">{error}</p>}
                        <div className="loan-form__footer">
                            <button
                                type="button"
                                className="loan-form__btn loan-form__btn--ghost"
                                disabled={sending}
                                onClick={() => setConfirmOpen(false)}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className="loan-form__btn"
                                disabled={sending}
                                onClick={handleConfirm}
                            >
                                {sending ? 'Отправляем…' : 'Подтвердить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default LoanApplicationForm;
