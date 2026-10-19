// @ts-ignore
import React, { useState } from 'react';
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
    calculator:
        'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
    archive: 'M3 4h18v4H3zM5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4',
    requests:
        'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 8h6M9 12h6M9 16h4',
    faq: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 17h.01',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    collapse: 'M11 17l-5-5 5-5M18 17l-5-5 5-5',
};

const NAV_ITEMS = [
    { id: 'chat', label: 'Чат', icon: 'chat' },
    { id: 'dashboard', label: 'Дашборд', icon: 'dashboard' },
    { id: 'calculator', label: 'Умный калькулятор', icon: 'calculator' },
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

function Footer(){
    const [activeItem, setActiveItem] = useState('chat');
    const [collapsed, setCollapsed] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('Дима Маленький'); // need replace on real data


    // Enter button handler
    const handleLogin = () => {
        setUserName('Дима Маленький');
        setIsLoggedIn(true);
    };

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
                                <a className="BenefitButton" href="#">Получить кредит</a>
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
                    <section className="ChatPreview">
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
                                            onClick={() => setActiveItem(item.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && setActiveItem(item.id)}
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
                                        {isLoggedIn ? (
                                            <div className="SideNavUserName">{userName}</div>
                                        ) : (
                                            <div
                                                className="SideNavLogin"
                                                role="button"
                                                tabIndex={0}
                                                onClick={handleLogin}
                                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                            >
                                                Войти
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="ChatPanel">
                                <div className="ChatMessages">
                                    <h3 className="ChatGreeting">Здравствуйте, подберем кредит?</h3>
                                </div>

                                <form className="ChatInputBar" onSubmit={(e) => e.preventDefault()}>
                                    <input
                                        className="ChatInput"
                                        type="text"
                                        placeholder="Сообщение"
                                    />
                                    <button className="ChatSend" type="submit" aria-label="Отправить">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M12 19V5M12 5l-6 6M12 5l6 6" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
};

export default Footer;
