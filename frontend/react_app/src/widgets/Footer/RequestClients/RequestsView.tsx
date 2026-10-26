import { useCallback, useEffect, useState } from 'react';
import { applications } from '../../../shared/api/endpoints';
import type { ApplicationDetail, ApplicationOut } from '../../../shared/api/types';
import { statusLabel } from '../../../entities/application/model/statusLabels';
import '../Archive/ArchiveView.css';
import './RequestsView.css';

const money = (v: string) => `${Number(v).toLocaleString('ru-RU')} ₽`;
const date = (v: string) => new Date(v).toLocaleDateString('ru-RU');
// ApiError.message уже собран из body.detail (строка или список msg через '; ')
const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Что-то пошло не так');

export default function RequestsView() {
    const [items, setItems] = useState<ApplicationOut[] | null>(null);
    const [detail, setDetail] = useState<ApplicationDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const loadList = useCallback(async () => {
        try {
            setItems(await applications.list());
        } catch (e) {
            setError(errorText(e));
            setItems((prev) => prev ?? []);
        }
    }, []);

    useEffect(() => {
        void loadList();
    }, [loadList]);

    const open = async (id: number) => {
        setError(null);
        try {
            setDetail(await applications.get(id));
        } catch (e) {
            setError(errorText(e));
        }
    };

    const accept = async (id: number) => {
        setBusy(true);
        setError(null);
        try {
            await applications.acceptOffer(id);
            setDetail(await applications.get(id));
            await loadList();
        } catch (e) {
            setError(errorText(e));
        } finally {
            setBusy(false);
        }
    };

    if (items === null) {
        return (
            <section className="Archive Requests Archive--empty" aria-label="Мои заявки">
                <p className="ArchiveEmpty">Загрузка…</p>
            </section>
        );
    }

    if (detail) {
        return (
            <section className="Archive Requests" aria-label="Заявка">
                <button type="button" className="ArchiveBtn" onClick={() => setDetail(null)}>
                    ← К списку
                </button>
                <h3>
                    {detail.product_name} — {statusLabel(detail.status)}
                </h3>
                {error && <p role="alert">{error}</p>}
                <dl className="RequestTerms">
                    <dt>Сумма</dt>
                    <dd>{money(detail.amount)}</dd>
                    <dt>Срок</dt>
                    <dd>{detail.term_months} мес.</dd>
                    <dt>Ставка</dt>
                    <dd>{detail.rate}%</dd>
                    <dt>Платёж</dt>
                    <dd>{money(detail.monthly_payment)}</dd>
                    {detail.manager_comment && (
                        <>
                            <dt>Комментарий банка</dt>
                            <dd>{detail.manager_comment}</dd>
                        </>
                    )}
                </dl>
                {detail.status === 'counter_offer' && (
                    <div>
                        <dl className="RequestTerms">
                            <dt>Встречное предложение</dt>
                            <dd>
                                {detail.counter_amount !== null && money(detail.counter_amount)}
                                {detail.counter_term_months !== null && `, ${detail.counter_term_months} мес.`}
                            </dd>
                        </dl>
                        <button
                            type="button"
                            className="ArchiveBtn"
                            disabled={busy}
                            onClick={() => void accept(detail.id)}
                        >
                            Принять
                        </button>
                    </div>
                )}
                <h4>История статусов</h4>
                <ul className="ArchiveList">
                    {detail.history.map((h, i) => (
                        <li key={i} className="ArchiveItem">
                            <span className="ArchiveItemTitle">
                                {h.from_status ? `${statusLabel(h.from_status)} → ` : ''}
                                {statusLabel(h.to_status)}
                                {h.comment && `: ${h.comment}`} ({date(h.created_at)})
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
        );
    }

    if (items.length === 0) {
        return (
            <section className="Archive Requests Archive--empty" aria-label="Мои заявки">
                <p className="ArchiveEmpty">{error ?? 'Заявок пока нет'}</p>
            </section>
        );
    }

    return (
        <section className="Archive Requests" aria-label="Мои заявки">
            {error && <p role="alert">{error}</p>}
            <ul className="ArchiveList">
                {items.map((a) => (
                    <li key={a.id}>
                        <button type="button" className="RequestCard" onClick={() => void open(a.id)}>
                            <span className="RequestCardHead">
                                <span className="RequestCardTitle">{a.product_name}</span>
                                <span className={`RequestBadge RequestBadge--${a.status}`}>
                                    {statusLabel(a.status)}
                                </span>
                            </span>
                            <dl className="RequestCardMeta">
                                <div>
                                    <dt>Сумма</dt>
                                    <dd>{money(a.amount)}</dd>
                                </div>
                                <div>
                                    <dt>Срок</dt>
                                    <dd>{a.term_months} мес.</dd>
                                </div>
                                <div>
                                    <dt>Платёж</dt>
                                    <dd>{money(a.monthly_payment)}/мес</dd>
                                </div>
                                <div>
                                    <dt>Дата</dt>
                                    <dd>{date(a.created_at)}</dd>
                                </div>
                            </dl>
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
