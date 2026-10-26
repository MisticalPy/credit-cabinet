import { useEffect, useState } from 'react';
import type {Product, Purpose} from "../../../shared/api/types.ts";
import './LoanApplicationForm.css';

const nf = new Intl.NumberFormat('ru-RU');
const money = (n: number) => nf.format(n).replace(/\u00A0/g, ' ');

const PURPOSE_LABELS: Record<Purpose, string> = {
    working_capital: 'Оборотные средства',
    equipment: 'Оборудование',
    development: 'Развитие бизнеса',
    refinancing: 'Рефинансирование',
};

const EDUCATION = [
    'Среднее',
    'Среднее специальное',
    'Неполное высшее',
    'Высшее',
    'Несколько высших / учёная степень',
];

const MARITAL = [
    'Не женат / не замужем',
    'Женат / замужем',
    'Разведён / разведена',
    'Вдовец / вдова',
];

const STEP_TITLES = [
    'Заполните заявку на кредит',
    'Работа',
    'Место работы',
    'Образование и семья',
    'Дополнительный контакт',
];

const LAST_STEP = STEP_TITLES.length - 1;

export interface LoanApplication {
    productId: Product['id'];
    amount: string;
    term: string;
    purpose: Purpose;
    lastName: string;
    firstName: string;
    middleName: string;
    noMiddleName: boolean;
    phone: string;
    email: string;
    agreeData: boolean;
    agreeAds: boolean;
    employer: string;
    employerAddress: string;
    salary: string;
    experience: string;
    position: string;
    managerPhone: string;
    education: string;
    maritalStatus: string;
    contactPerson: string;
    contactPhone: string;
}

interface Props {
    product: Product;
    isLoggedIn: boolean;
    onLogin: () => void;
    onClose: () => void;
    onSubmit?: (data: LoanApplication) => void | Promise<void>;
    /** Amount (₽) and term (months) chosen on the dashboard; overrides the product defaults. */
    initialValues?: { amount: number; term: number };
}

const loanFields = (p: Product) => ({
    productId: p.id,
    amount: String(Number(p.min_amount)),
    term: String(p.min_term_months),
    purpose: p.purpose,
});

const initialData = (p: Product): LoanApplication => ({
    ...loanFields(p),
    lastName: '',
    firstName: '',
    middleName: '',
    noMiddleName: false,
    phone: '',
    email: '',
    agreeData: false,
    agreeAds: false,
    employer: '',
    employerAddress: '',
    salary: '',
    experience: '',
    position: '',
    managerPhone: '',
    education: '',
    maritalStatus: '',
    contactPerson: '',
    contactPhone: '',
});

// Only "is filled" checks. Content validation is up to the backend.
const filled = (...v: string[]) => v.every((x) => x.trim() !== '');

function isStepFilled(step: number, d: LoanApplication): boolean {
    switch (step) {
        case 0:
            return (
                filled(d.amount, d.term, d.lastName, d.firstName, d.phone, d.email) &&
                (d.noMiddleName || filled(d.middleName)) &&
                d.agreeData
            );
        case 1:
            return filled(d.employer, d.employerAddress, d.salary);
        case 2:
            return filled(d.experience, d.position, d.managerPhone);
        case 3:
            return filled(d.education, d.maritalStatus);
        case 4:
            return filled(d.contactPerson, d.contactPhone);
        default:
            return false;
    }
}

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
    options: string[];
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
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>
        </label>
    );
}

function LoanApplicationForm({ product, isLoggedIn, onLogin, onClose, onSubmit, initialValues }: Props) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<LoanApplication>(() => initialData(product));
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Another card was chosen: update loan fields, keep what the user already typed.
    useEffect(() => {
        setData((prev) => ({
            ...prev,
            ...loanFields(product),
            ...(initialValues && {
                amount: String(initialValues.amount),
                term: String(initialValues.term),
            }),
        }));
        setStep(0);
        setDone(false);
        setConfirmOpen(false);
    }, [product, initialValues]);

    const set = <K extends keyof LoanApplication>(key: K, value: LoanApplication[K]) =>
        setData((prev) => ({ ...prev, [key]: value }));

    const minAmount = Number(product.min_amount);
    const maxAmount = Number(product.max_amount);

    const handleConfirm = async () => {
        setSending(true);
        setError(null);
        try {
            await onSubmit?.(data);
            setConfirmOpen(false);
            setDone(true);
        } catch {
            setError('Не удалось отправить заявку. Попробуйте ещё раз.');
        } finally {
            setSending(false);
        }
    };

    const renderBody = () => {
        if (done) {
            return (
                <div className="loan-form__center">
                    <h2 className="loan-form__title">Заявка отправлена</h2>
                    <p className="loan-form__text">Мы сообщим о решении по SMS и на почту.</p>
                    <button type="button" className="loan-form__btn" onClick={onClose}>
                        Закрыть
                    </button>
                </div>
            );
        }

        if (!isLoggedIn) {
            return (
                <div className="loan-form__center">
                    <h2 className="loan-form__title">Войдите, чтобы подать заявку</h2>
                    <p className="loan-form__text">Заявка на «{product.name}» сохранится в вашем кабинете.</p>
                    <button type="button" className="loan-form__btn" onClick={onLogin}>
                        Войти
                    </button>
                </div>
            );
        }

        return (
            <>
                <div className="loan-form__progress">
                    Шаг {step + 1} из {STEP_TITLES.length} · {product.name}
                </div>
                <h2 className="loan-form__title">{STEP_TITLES[step]}</h2>

                {step === 0 && (
                    <>
                        <h3 className="loan-form__subtitle">Сумма и срок</h3>
                        <TextField
                            label="Сумма, ₽"
                            type="number"
                            value={data.amount}
                            onChange={(v) => set('amount', v)}
                            hint={`От ${money(minAmount)} до ${money(maxAmount)} ₽`}
                        />
                        <TextField
                            label="Срок, мес."
                            type="number"
                            value={data.term}
                            onChange={(v) => set('term', v)}
                            hint={`От ${product.min_term_months} до ${product.max_term_months} мес.`}
                        />
                        <TextField
                            label="Цель кредита"
                            value={PURPOSE_LABELS[data.purpose]}
                            onChange={() => {}}
                            disabled
                        />

                        <h3 className="loan-form__subtitle">Контактные данные</h3>
                        <div className="loan-form__warning" role="alert">
                            <span className="loan-form__warning-icon" aria-hidden="true">
                                ⚠
                            </span>
                            Проверьте, что введённые данные совпадают с паспортными
                        </div>
                        <TextField
                            label="Фамилия"
                            value={data.lastName}
                            onChange={(v) => set('lastName', v)}
                            hint="Укажите точно как в паспорте"
                        />
                        <TextField
                            label="Имя"
                            value={data.firstName}
                            onChange={(v) => set('firstName', v)}
                            hint="Укажите точно как в паспорте"
                        />
                        <TextField
                            label="Отчество"
                            value={data.middleName}
                            disabled={data.noMiddleName}
                            onChange={(v) => set('middleName', v)}
                            hint="Укажите точно как в паспорте"
                        />
                        <label className="loan-form__check">
                            <input
                                type="checkbox"
                                checked={data.noMiddleName}
                                onChange={(e) => {
                                    set('noMiddleName', e.target.checked);
                                    if (e.target.checked) set('middleName', '');
                                }}
                            />
                            <span>По паспорту без отчества</span>
                        </label>

                        <div className="loan-form__row">
                            <TextField
                                label="Мобильный телефон"
                                type="tel"
                                placeholder="+7 ("
                                value={data.phone}
                                onChange={(v) => set('phone', v)}
                                hint="Пришлём SMS с решением по кредиту"
                            />
                            <TextField
                                label="Электронная почта"
                                type="email"
                                value={data.email}
                                onChange={(v) => set('email', v)}
                                hint="Отправим кредитный договор"
                            />
                        </div>

                        <label className="loan-form__check">
                            <input
                                type="checkbox"
                                checked={data.agreeData}
                                onChange={(e) => set('agreeData', e.target.checked)}
                            />
                            <span>
                                Я соглашаюсь с условиями и даю своё согласие на обработку и использование моих
                                персональных данных, и разрешаю сделать запрос в бюро кредитных историй
                            </span>
                        </label>
                        <label className="loan-form__check">
                            <input
                                type="checkbox"
                                checked={data.agreeAds}
                                onChange={(e) => set('agreeAds', e.target.checked)}
                            />
                            <span>
                                Я даю согласие на получение рекламы, а также иной информации и предложений банка и
                                его партнёров
                            </span>
                        </label>
                    </>
                )}

                {step === 1 && (
                    <>
                        <TextField
                            label="Компания-работодатель"
                            value={data.employer}
                            onChange={(v) => set('employer', v)}
                        />
                        <TextField
                            label="Адрес работодателя"
                            value={data.employerAddress}
                            onChange={(v) => set('employerAddress', v)}
                        />
                        <TextField
                            label="Уровень дохода в месяц, ₽"
                            type="number"
                            value={data.salary}
                            onChange={(v) => set('salary', v)}
                        />
                    </>
                )}

                {step === 2 && (
                    <>
                        <TextField
                            label="Стаж на текущем месте, мес."
                            type="number"
                            value={data.experience}
                            onChange={(v) => set('experience', v)}
                        />
                        <TextField
                            label="Должность"
                            value={data.position}
                            onChange={(v) => set('position', v)}
                        />
                        <TextField
                            label="Телефон руководства"
                            type="tel"
                            value={data.managerPhone}
                            onChange={(v) => set('managerPhone', v)}
                            hint="Номер, по которому могут ответить на вопросы о вас"
                        />
                    </>
                )}

                {step === 3 && (
                    <>
                        <SelectField
                            label="Образование"
                            value={data.education}
                            options={EDUCATION}
                            onChange={(v) => set('education', v)}
                        />
                        <SelectField
                            label="Семейное положение"
                            value={data.maritalStatus}
                            options={MARITAL}
                            onChange={(v) => set('maritalStatus', v)}
                        />
                    </>
                )}

                {step === 4 && (
                    <>
                        <TextField
                            label="ФИО контактного лица"
                            value={data.contactPerson}
                            onChange={(v) => set('contactPerson', v)}
                            hint="Позвоним этому человеку, если не дозвонимся до вас"
                        />
                        <TextField
                            label="Телефон контактного лица"
                            type="tel"
                            value={data.contactPhone}
                            onChange={(v) => set('contactPhone', v)}
                        />
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
                            disabled={!isStepFilled(step, data)}
                            onClick={() => setStep((s) => s + 1)}
                        >
                            Продолжить
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="loan-form__btn"
                            disabled={!isStepFilled(step, data)}
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
                        <p className="loan-form__text">
                            Проверьте, что данные совпадают с паспортными. После отправки изменить их нельзя.
                        </p>
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