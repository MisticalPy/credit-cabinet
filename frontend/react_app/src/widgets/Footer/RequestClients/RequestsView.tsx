import { useCallback, useEffect, useState } from 'react';
import { applications } from '../../../shared/api/endpoints';
import type { ApplicationDetail, ApplicationOut } from '../../../shared/api/types';
import { statusLabel } from '../../../entities/application/model/statusLabels';
import '../Archive/ArchiveView.css';

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
            <section className="Archive Archive--empty" aria-label="Мои заявки">
                <p className="ArchiveEmpty">Загрузка…</p>
            </section>
        );
    }

    if (detail) {
        return (
            <section className="Archive" aria-label="Заявка">
                <button type="button" className="ArchiveBtn" onClick={() => setDetail(null)}>
                    ← К списку
                </button>
                <h3>
                    {detail.product_name} — {statusLabel(detail.status)}
                </h3>
                {error && <p role="alert">{error}</p>}
                <p>
                    Сумма: {money(detail.amount)}; срок: {detail.term_months} мес.; ставка: {detail.rate}%;
                    платёж: {money(detail.monthly_payment)}
                </p>
                {detail.manager_comment && <p>Комментарий банка: {detail.manager_comment}</p>}
                {detail.status === 'counter_offer' && (
                    <div>
                        <p>
                            Встречное предложение:{' '}
                            {detail.counter_amount !== null && money(detail.counter_amount)}
                            {detail.counter_term_months !== null && `, ${detail.counter_term_months} мес.`}
                        </p>
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
            <section className="Archive Archive--empty" aria-label="Мои заявки">
                <p className="ArchiveEmpty">{error ?? 'Заявок пока нет'}</p>
            </section>
        );
    }

    return (
        <section className="Archive" aria-label="Мои заявки">
            {error && <p role="alert">{error}</p>}
            <ul className="ArchiveList">
                {items.map((a) => (
                    <li key={a.id} className="ArchiveItem">
                        <button type="button" className="ArchiveItemTitle" onClick={() => void open(a.id)}>
                            {a.product_name} · {money(a.amount)} · {a.term_months} мес. ·{' '}
                            {money(a.monthly_payment)}/мес · {statusLabel(a.status)} · {date(a.created_at)}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
