import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import './DashboardView.css';

/* ---------- helpers ---------- */

const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const rub = (n: number) => `${nf.format(Math.round(n))}\u00A0₽`;

const compact = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace('.', ',')} млн`;
    if (n >= 1_000) return `${Math.round(n / 1_000)} тыс.`;
    return String(Math.round(n));
};

const formatDuration = (months: number) => {
    const y = Math.floor(months / 12);
    const m = months % 12;
    return [y ? `${y} л.` : '', m ? `${m} мес.` : ''].filter(Boolean).join(' ') || '0 мес.';
};

/** Loan card data passed from the catalog via router state. */
export interface DashboardPreset {
    productId: number | string;
    name: string;
    minAmount: number;
    maxAmount: number;
    rate: number;
    minTermMonths: number;
    maxTermMonths: number;
}

/** Provided by Footer through <Outlet context={...} />. */
export interface DashboardOutletContext {
    openApplication: (
        productId: DashboardPreset['productId'],
        values: { amount: number; term: number },
    ) => void;
}

interface YearRow {
    year: number;
    principal: number;
    interest: number;
}

interface Result {
    payment: number;
    years: YearRow[];
    totalInterest: number;
    totalPaid: number;
    months: number;
}

/** Annuity schedule with optional extra monthly payment, aggregated by year. */
function simulate(amount: number, annualRate: number, termMonths: number, extra: number): Result {
    const n = termMonths;
    const r = annualRate / 100 / 12;
    const payment = r === 0 ? amount / n : (amount * r) / (1 - Math.pow(1 + r, -n));

    const years: YearRow[] = Array.from({ length: Math.ceil(n / 12) }, (_, i) => ({
        year: i + 1,
        principal: 0,
        interest: 0,
    }));

    let balance = amount;
    let months = 0;
    let totalInterest = 0;

    while (balance > 0.005 && months < n) {
        const interest = balance * r;
        const principal = Math.min(balance, payment + extra - interest);
        balance -= principal;
        const row = years[Math.floor(months / 12)];
        row.principal += principal;
        row.interest += interest;
        totalInterest += interest;
        months += 1;
    }

    return {
        payment,
        years: years.filter((y) => y.principal + y.interest > 0),
        totalInterest,
        totalPaid: amount + totalInterest,
        months,
    };
}

/* ---------- field with slider ---------- */

interface FieldProps {
    label: string;
    display: string;
    value: number;
    min: number;
    max: number;
    step: number;
    marks: string[];
    onChange: (v: number) => void;
}

function Field({ label, display, value, min, max, step, marks, onChange }: FieldProps) {
    const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;
    return (
        <div className="dash-field">
            <div className="dash-field__box">
                <span className="dash-field__label">{label}</span>
                <b className="dash-field__value">{display}</b>
                <input
                    className="dash-range"
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    aria-label={label}
                    style={{ '--p': `${progress}%` } as CSSProperties}
                    onChange={(e) => onChange(Number(e.target.value))}
                />
            </div>
            <div className="dash-field__marks">
                {marks.map((m) => (
                    <span key={m}>{m}</span>
                ))}
            </div>
        </div>
    );
}

/* ---------- view ---------- */

interface Props {
    /** Slot for the loan offers block (LoanCatalog) — connected later. */
    loanCatalog?: ReactNode;
}

export default function DashboardView({ loanCatalog }: Props) {
    // Set by the calculator button on a loan card: navigate('/dashboard', { state: { preset } })
    const { state } = useLocation();
    const preset = (state as { preset?: DashboardPreset } | null)?.preset;
    const outlet = useOutletContext<DashboardOutletContext | undefined>();
    console.log({ preset, hasOpen: !!outlet?.openApplication });

    const [amount, setAmount] = useState(preset?.minAmount ?? 1_000_000);
    const [term, setTerm] = useState(preset?.minTermMonths ?? 60); // months
    // Without a preset this is a placeholder for illustration only.
    const [rate, setRate] = useState(preset?.rate ?? 20);
    const [extra, setExtra] = useState(0);

    // Another card was chosen while the dashboard is already open.
    useEffect(() => {
        if (!preset) return;
        setAmount(preset.minAmount);
        setTerm(preset.minTermMonths);
        setRate(preset.rate);
        setExtra(0);
    }, [preset]);

    const amountMin = preset?.minAmount ?? 30_000;
    const amountMax = preset?.maxAmount ?? 30_000_000;
    const termMin = preset?.minTermMonths ?? 12;
    const termMax = preset?.maxTermMonths ?? 180;

    const base = useMemo(() => simulate(amount, rate, term, 0), [amount, rate, term]);
    const res = useMemo(() => simulate(amount, rate, term, extra), [amount, rate, term, extra]);

    const yMax = Math.max(...res.years.map((y) => y.principal + y.interest), 1);
    const ticks = [1, 2 / 3, 1 / 3, 0].map((k) => yMax * k);

    if (!preset) {
        return (
            <div className="dash">
                <div className="dash-empty">
                    <p className="dash-empty__text">Выберите кредит, чтобы рассчитать платёж</p>
                    <button
                        type="button"
                        className="dash-submit-WC"
                        onClick={() =>
                            document
                                .querySelector('.loan-catalog')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                    >
                        Выбрать кредит
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dash">
            <div className="dash-calc">
                {/* controls */}
                <div className="dash-controls">
                    <Field
                        label="Сумма кредита"
                        display={rub(amount)}
                        value={amount}
                        min={amountMin}
                        max={amountMax}
                        step={10_000}
                        marks={
                            preset
                                ? [compact(amountMin), compact(amountMax)]
                                : ['30 тыс.', '15 млн', '30 млн']
                        }
                        onChange={setAmount}
                    />
                    <Field
                        label="Срок кредита"
                        display={formatDuration(term)}
                        value={term}
                        min={termMin}
                        max={termMax}
                        step={1}
                        marks={[formatDuration(termMin), formatDuration(termMax)]}
                        onChange={setTerm}
                    />
                    <Field
                        label="Процентная ставка"
                        display={`${rate.toFixed(1).replace('.', ',')} % годовых`}
                        value={rate}
                        min={1}
                        max={60}
                        step={0.1}
                        marks={['1 %', '60 %']}
                        onChange={setRate}
                    />
                    <Field
                        label="Доп. платёж в месяц"
                        display={`${rub(extra)}/мес`}
                        value={extra}
                        min={0}
                        max={100_000}
                        step={1_000}
                        marks={['0', '100 тыс.']}
                        onChange={setExtra}
                    />
                    {preset && <p className="dash-controls__note">Расчёт по кредиту «{preset.name}»</p>}
                    {preset && (
                            <button
                                type="button"
                                className="dash-submit"
                                onClick={() =>
                                    window.dispatchEvent(
                                        new CustomEvent('loan:open-application', {
                                            detail: { productId: preset.productId, values: { amount, term } },
                                        }),
                                    )
                                }
                            >
                                Оформить
                            </button>
                    )}
                </div>

                {/* result */}
                <div className="dash-result">
                    <div className="dash-stats">
                        <div className="dash-stats__main">
                            <span className="dash-stats__label">Ежемесячный платёж</span>
                            <div className="dash-stats__payment">
                                <b>{rub(res.payment + extra)}</b>
                                {extra > 0 && <span className="dash-badge">+{rub(extra)} доп.</span>}
                            </div>
                        </div>
                        <div className="dash-stats__item">
                            <span className="dash-stats__label">Переплата</span>
                            <b>{rub(res.totalInterest)}</b>
                        </div>
                        <div className="dash-stats__item">
                            <span className="dash-stats__label">Всего выплат</span>
                            <b>{rub(res.totalPaid)}</b>
                        </div>
                        <div className="dash-stats__item">
                            <span className="dash-stats__label">Срок погашения</span>
                            <b>{formatDuration(res.months)}</b>
                        </div>
                    </div>

                    {extra > 0 && base.totalInterest > res.totalInterest && (
                        <p className="dash-saving">
                            Экономия на процентах: <b>{rub(base.totalInterest - res.totalInterest)}</b>, быстрее на{' '}
                            <b>{formatDuration(base.months - res.months)}</b>
                        </p>
                    )}

                    <div className="dash-legend">
                        <span>
                            <i className="dash-dot dash-dot--principal" /> Основной долг
                        </span>
                        <span>
                            <i className="dash-dot dash-dot--interest" /> Проценты
                        </span>
                    </div>

                    <div className="dash-chart">
                        <div className="dash-chart__y">
                            {ticks.map((t, i) => (
                                <span key={i}>{compact(t)}</span>
                            ))}
                        </div>

                        <div className="dash-chart__main">
                            <div className="dash-chart__plot">
                                {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className="dash-chart__grid" style={{ top: `${(i / 3) * 100}%` }} />
                                ))}
                                <div className="dash-chart__bars">
                                    {res.years.map((y) => (
                                        <div
                                            key={y.year}
                                            className="dash-bar"
                                            title={`${y.year}-й год: долг ${rub(y.principal)}, проценты ${rub(y.interest)}`}
                                        >
                                            <div
                                                className="dash-bar__seg dash-bar__seg--interest"
                                                style={{ height: `${(y.interest / yMax) * 100}%` }}
                                            />
                                            <div
                                                className="dash-bar__seg dash-bar__seg--principal"
                                                style={{ height: `${(y.principal / yMax) * 100}%` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="dash-chart__x">
                                {res.years.map((y) => (
                                    <span key={y.year}>{y.year} г.</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                {/*{preset && (*/}
                {/*    <div className="dash-actions">*/}
                {/*        <button*/}
                {/*            type="button"*/}
                {/*            className="dash-submit"*/}
                {/*            onClick={() =>*/}
                {/*                window.dispatchEvent(*/}
                {/*                    new CustomEvent('loan:open-application', {*/}
                {/*                        detail: { productId: preset.productId, values: { amount, term } },*/}
                {/*                    }),*/}
                {/*                )*/}
                {/*            }*/}
                {/*        >*/}
                {/*            Оформить*/}
                {/*        </button>*/}
                {/*    </div>*/}
                {/*)}*/}
            </div>

            {/* slot: loan offers block (LoanCatalog) */}
            {loanCatalog && <div className="dash-slot">{loanCatalog}</div>}
        </div>
    );
}