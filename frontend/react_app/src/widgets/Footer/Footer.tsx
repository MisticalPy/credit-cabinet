// @ts-ignore
import React, { useMemo, useState, useEffect, useRef} from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import type { Product, Purpose } from '../../shared/api/types';
import { useProducts } from '../../entities/product/model/useProducts';
import { groupByPurpose } from '../../entities/product/lib/groupByPurpose';
import LoanApplicationForm from './LoanApplicationModal';
import {useAuth} from "../../entities/session/model/Auth-context.ts";

import './Footer.css';
import FeedbackBuitton from "../../shared/UI/feedback";


const CIRCLE_LENGTH = 2 * Math.PI * 20;

const steps = [
    { id: 1, text: 'Напишите нашему ИИ ассистенту', progress: 0.25 },
    { id: 2, text: 'Оставьте заявку прямо в чате', progress: 0.5 },
    { id: 3, text: 'Получите деньги', progress: 1 },
];

// SVG path data for the sidebar icons (24x24 viewBox, stroke-based)
const ICONS: Record<string, string> = {
    chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z',
    dashboard: 'M5 20V10M12 20V4M19 20v-7',
    // calculator:
    //     'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
    archive: 'M3 4h18v4H3zM5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4',
    requests:
        'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 8h6M9 12h6M9 16h4',
    faq: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 17h.01',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    collapse: 'M11 17l-5-5 5-5M18 17l-5-5 5-5',
    open: '🏪',
    develop: '📈',
    current: '💳',
};

const NAV_ITEMS = [
    { id: 'chat', label: 'Чат', icon: 'chat' },
    { id: 'dashboard', label: 'Дашборд', icon: 'dashboard' },
    // { id: 'calculator', label: 'Умный калькулятор', icon: 'calculator' },
    { id: 'archive', label: 'Архив', icon: 'archive' },
    { id: 'requests', label: 'Мои заявки', icon: 'requests' },
    { id: 'faq', label: 'FAQ', icon: 'faq' },
];

function Icon({ name }: { name: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={ICONS[name]} />
        </svg>
    );
}


const nf = new Intl.NumberFormat('ru-RU');
const money = (n: number) => nf.format(n).replace(/\u00A0/g, ' ');

type Range = [number, number];

const PURPOSE_ICONS: Record<Purpose, string> = {
    working_capital: '💳',
    equipment: '🏭',
    development: '📈',
    refinancing: '🔄',
};

interface Props {
    onApply?: (sphereId: string, option: Product) => void;
    onCalculate?: (sphereId: string, option: Product) => void;
}

/** Amount (₽) and term (months) picked on the dashboard. */
type ApplyValues = { amount: number; term: number };

function Value({ label, range, unit }: { label: string; range: Range; unit: string }) {
    const [min, max] = range;
    const fmt = unit === 'мес.' ? String : money;
    return (
        <div className="loan-card__param">
            <span className="loan-card__label">{label}</span>
            {min === max ? (
                <b className="loan-card__value">
                    {fmt(min)} {unit}
                </b>
            ) : (
                <b className="loan-card__value">
                    <span>от {fmt(min)}</span>
                    <span>
            до {fmt(max)} {unit}
          </span>
                </b>
            )}
        </div>
    );
}

function scrollToCatalog() {
    document
        .querySelector('.loan-catalog')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


function Footer({ onApply, onCalculate }: Props){
    const { status, user, openLogin } = useAuth();
    const { products, loading, error } = useProducts();
    const spheres = useMemo(() => groupByPurpose(products), [products]);
    const [activeId, setActiveId] = useState<Purpose | null>(null);
    const sphere = spheres.find((s) => s.id === activeId) ?? spheres[0];
    const [applyRequest, setApplyRequest] = useState<{
        product: Product;
        ts: number;
        values?: ApplyValues;
    } | null>(null);

    const formRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (applyRequest) {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [applyRequest]);

    const location = useLocation();
    const navigate = useNavigate();

    const currentPath = location.pathname.replace(/^\//, '');
    const activeItem = currentPath || 'chat';

    const [collapsed, setCollapsed] = useState(false);

    const handleNavClick = (path: string) => {
        navigate(`/${path}`);
    };

    const handleCalculate = (sphereId: string, opt: Product) => {
        navigate('/dashboard', {
            state: {
                preset: {
                    productId: opt.id,
                    name: opt.name,
                    minAmount: Number(opt.min_amount),
                    maxAmount: Number(opt.max_amount),
                    rate: Number(opt.rate),
                    minTermMonths: opt.min_term_months,
                    maxTermMonths: opt.max_term_months,
                },
            },
        });
        onCalculate?.(sphereId, opt);
        // the dashboard opens inside the chat window below the catalog, so scroll to it
        requestAnimationFrame(() =>
            chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        );
    };

    // Called by the dashboard ("Отправить"): opens the application form with its values.
    const openApplication = (productId: Product['id'], values: ApplyValues) => {
        const product = products.find((p) => p.id === productId);
        if (product) setApplyRequest({ product, ts: Date.now(), values });
    };

    useEffect(() => {
        const handler = (e: Event) => {
            const { productId, values } = (e as CustomEvent).detail;
            openApplication(productId, values);
        };
        window.addEventListener('loan:open-application', handler);
        return () => window.removeEventListener('loan:open-application', handler);
    }, [products]);

    return (
        <>
            <div className={"Infinite Footer"}>
                <FeedbackBuitton></FeedbackBuitton>
                <div className={"FooterContent"}>
                    <section className="Benefits">
                        <h2 className="BenefitsTitle">
                            Почему подбор кредита с ИИ - это выгодно
                        </h2>

                        <div className="BenefitsGrid">
                            <div className="BenefitCard">
                                <h3 className="BenefitCardTitle">Решение за 2 минуты</h3>
                                <p className="BenefitCardText">
                                    ИИ-помощник сам сравнит предложения и покажет лучшее для вашего бизнеса
                                </p>
                            </div>

                            <div className="BenefitCard">
                                <h3 className="BenefitCardTitle">Ставка под ваш бизнес</h3>
                                <p className="BenefitCardText">
                                    Учитываем оборот, отрасль и кредитную историю, чтобы снизить переплату
                                </p>
                            </div>

                            <div className="BenefitCard BenefitCardWide">
                                <h3 className="BenefitCardTitle">Персональный ИИ-помощник</h3>
                                <p className="BenefitCardText">
                                    Объяснит условия простыми словами, рассчитает платёж и поможет собрать документы
                                </p>
                                <a
                                    className="BenefitButton"
                                    href="#loan-catalog"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        scrollToCatalog();
                                    }}
                                >
                                    Получить кредит</a>
                            </div>
                        </div>
                    </section>
                    <section className="Steps">
                        <h2 className="StepsTitle">Получить кредит стало очень просто</h2>

                        <div className="StepsGrid">
                            {steps.map((step) => (
                                <div className="StepCard" key={step.id}>
                                    <div className="StepCircle">
                                        <svg viewBox="0 0 44 44" aria-hidden="true">
                                            <circle className="StepCircleTrack" cx="22" cy="22" r="20" />
                                            <circle
                                                className="StepCircleProgress"
                                                cx="22"
                                                cy="22"
                                                r="20"
                                                strokeDasharray={`${CIRCLE_LENGTH * step.progress} ${CIRCLE_LENGTH}`}
                                            />
                                        </svg>
                                        <span className="StepNumber">{step.id}</span>
                                    </div>
                                    <h3 className="StepCardTitle">{step.text}</h3>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="loan-catalog">
                        <h2 className="loan-catalog__title">Кредиты для бизнеса</h2>

                        {loading && <p className="loan-catalog__note">Загрузка…</p>}
                        {error && (
                            <p className="loan-catalog__note">Не удалось загрузить кредиты: {error}</p>
                        )}

                        {sphere && (
                            <>
                                <div className="loan-catalog__tabs" role="tablist">
                                    {spheres.map((s) => (
                                        <button
                                            key={s.id}
                                            role="tab"
                                            aria-selected={s.id === sphere.id}
                                            className={`loan-catalog__tab${s.id === sphere.id ? ' is-active' : ''}`}
                                            onClick={() => setActiveId(s.id)}
                                        >
                                            {s.title}
                                        </button>
                                    ))}
                                </div>

                                <div className="loan-catalog__grid" role="tabpanel">
                                    {sphere.products.map((opt) => (
                                        <article key={opt.id} className={`loan-card loan-card--${opt.purpose}`}>
                                            <div className="loan-card__media" aria-hidden="true">
                                                <span>{PURPOSE_ICONS[opt.purpose]}</span>
                                            </div>

                                            <div className="loan-card__body">
                                                <h3 className="loan-card__name">{opt.name}</h3>

                                                <div className="loan-card__params">
                                                    <Value
                                                        label="Сумма"
                                                        range={[Number(opt.min_amount), Number(opt.max_amount)]}
                                                        unit="₽"
                                                    />
                                                    <div className="loan-card__param">
                                                        <span className="loan-card__label">Ставка</span>
                                                        <b className="loan-card__value">{nf.format(Number(opt.rate))} %</b>
                                                    </div>
                                                    <Value
                                                        label="Срок"
                                                        range={[opt.min_term_months, opt.max_term_months]}
                                                        unit="мес."
                                                    />
                                                </div>

                                                <div className="loan-card__actions">
                                                    <button
                                                        type="button"
                                                        className="loan-card__btn"
                                                        onClick={() => {
                                                            setApplyRequest({ product: opt, ts: Date.now() });
                                                            onApply?.(sphere.id, opt);
                                                        }}
                                                    >
                                                        Получить
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="loan-card__btn loan-card__btn--icon"
                                                        aria-label="Калькулятор"
                                                        onClick={() => handleCalculate(sphere.id, opt)}
                                                    >
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                            <path d="M7 2h10a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v3h12V5a1 1 0 0 0-1-1H7Zm11 6H6v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9ZM8 12h2v2H8v-2Zm3 0h2v2h-2v-2Zm3 0h2v2h-2v-2ZM8 15h2v2H8v-2Zm3 0h2v2h-2v-2Zm3 0h2v2h-2v-2Z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </>
                        )}

                    </section>
                    <section className="ChatPreview" ref={chatRef}>
                        <h2 className="ChatPreviewTitle">Начните общение с ИИ прямо сейчас</h2>

                        <div className="ChatWindow">
                            <div className={`SideNav ${collapsed ? 'SideNavCollapsed' : ''}`}>
                                <div className="SideNavHeader">
                                    <div className="SideNavLogo">
                                        <div className="SideNavLogoMark">AI</div>
                                        <div className="SideNavLogoText">Кредитный ассистент</div>
                                    </div>
                                    <div
                                        className="SideNavToggle"
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Свернуть меню"
                                        onClick={() => setCollapsed((c) => !c)}
                                        onKeyDown={(e) => e.key === 'Enter' && setCollapsed((c) => !c)}
                                    >
                                        <Icon name="collapse" />
                                    </div>
                                </div>

                                <div className="SideNavMenu">
                                    {NAV_ITEMS.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`SideNavItem ${activeItem === item.id ? 'SideNavItemActive' : ''}`}
                                            role="button"
                                            tabIndex={0}
                                            title={item.label}
                                            onClick={() => handleNavClick(item.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleNavClick(item.id)}
                                        >
                                            <div className="SideNavIcon">
                                                <Icon name={item.icon} />
                                            </div>
                                            <div className="SideNavLabel">{item.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="SideNavFooter">
                                    <div className="SideNavUser">
                                        <div className="SideNavAvatar">
                                            <Icon name="user" />
                                        </div>

                                        {status === 'ready' ? (
                                            <div className="SideNavUserName">{user?.username}</div>
                                        ) : (
                                            <div className="SideNavLogin" role="button" tabIndex={0}
                                                 onClick={openLogin}
                                                 onKeyDown={(e) => e.key === 'Enter' && openLogin()}>
                                                Войти
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="Panel">
                                <Outlet context={{ openApplication }} />
                            </div>
                        </div>
                    </section>
                    <div ref={formRef}>
                        {applyRequest && (
                            <LoanApplicationForm
                                product={applyRequest.product}
                                initialValues={applyRequest.values}
                                onClose={() => setApplyRequest(null)}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Footer;
