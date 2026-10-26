import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import './SiteFooter.css';

const COLUMNS = [
    {
        title: 'Малому бизнесу',
        links: [
            { label: 'Кредиты без залога', to: '/' },
            { label: 'Кредит на оборудование', to: '/' },
            { label: 'Рефинансирование', to: '/' },
            { label: 'Калькулятор платежа', to: '/dashboard' },
        ],
    },
    {
        title: 'Кабинет',
        links: [
            { label: 'ИИ-помощник', to: '/chat' },
            { label: 'Мои заявки', to: '/requests' },
            { label: 'Профиль компании', to: '/account' },
            { label: 'Архив чатов', to: '/archive' },
        ],
    },
    {
        title: 'Помощь',
        links: [
            { label: 'Частые вопросы', to: '/faq' },
            { label: 'Как подать заявку', to: '/faq' },
            { label: 'Требования к бизнесу', to: '/faq' },
        ],
    },
];

const WORDMARK = 'Деньги для бизнеса';

// Плавный скролл к каталогу кредитов, как у кнопки в HeroBlock
function scrollToCatalog() {
    document
        .querySelector('.loan-catalog')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function SiteFooter() {
    const ref = useRef<HTMLElement>(null);
    const [visible, setVisible] = useState(false);

    // Запускаем анимацию появления один раз, когда футер въезжает в экран
    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    // Свечение следует за курсором через CSS-переменные, без ререндера
    const handleMove = (e: MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
    };

    return (
        <footer
            ref={ref}
            className={`SiteFooter${visible ? ' is-visible' : ''}`}
            onMouseMove={handleMove}
        >
            <div className="SiteFooterGlow" aria-hidden />
            <div className="SiteFooterInner">
                <div className="SiteFooterTop">
                    <div className="SiteFooterCta reveal" style={{ '--i': 0 } as CSSProperties}>
                        <p className="SiteFooterCtaTitle">Подберём кредит за&nbsp;5&nbsp;минут</p>
                        <p className="SiteFooterCtaText">
                            ИИ-помощник сравнит условия и посчитает платёж
                        </p>
                        <button className="SiteFooterBtn" type="button" onClick={scrollToCatalog}>
                            Получить деньги
                            <span className="SiteFooterBtnArrow" aria-hidden>→</span>
                        </button>
                    </div>

                    {COLUMNS.map((col, i) => (
                        <nav
                            key={col.title}
                            className="SiteFooterCol reveal"
                            style={{ '--i': i + 1 } as CSSProperties}
                        >
                            <p className="SiteFooterColTitle">{col.title}</p>
                            {col.links.map((link) => (
                                <Link key={link.label} className="SiteFooterLink" to={link.to}>
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    ))}
                </div>

                <p className="SiteFooterWordmark" aria-label={WORDMARK}>
                    {/* Слова не рвутся, задержка букв сквозная по всей фразе */}
                    {WORDMARK.split(' ').map((word, w, words) => {
                        const offset = words.slice(0, w).join(' ').length + (w ? 1 : 0);
                        return (
                            <span key={w} className="SiteFooterWord" aria-hidden>
                                {[...word].map((ch, i) => (
                                    <span key={i} style={{ '--i': offset + i } as CSSProperties}>
                                        {ch}
                                    </span>
                                ))}
                            </span>
                        );
                    })}
                </p>

                <div className="SiteFooterBottom reveal" style={{ '--i': 5 } as CSSProperties}>
                    <div className="SiteFooterPhones">
                        <a href="tel:0502">0502</a>
                        <span>для мобильных</span>
                        <a href="tel:88002000000">8 800 200-00-00</a>
                        <span>по России бесплатно</span>
                    </div>
                    <p className="SiteFooterCopy">
                        © {new Date().getFullYear()} Кредитный кабинет предпринимателя. Демо-проект.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default SiteFooter;
