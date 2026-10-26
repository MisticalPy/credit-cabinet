import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {useChat} from "../Chat/ChatContext.tsx";
import './ArchiveView.css';

export default function ArchiveView() {
    const navigate = useNavigate();
    const { chats, openChat, deleteChat } = useChat();
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setConfirmId(null);
    };

    if (chats.length === 0) {
        return (
            <section className="Archive Archive--empty" aria-label="Архив">
                <p className="ArchiveEmpty">В архиве пока нет чатов</p>
            </section>
        );
    }

    return (
        <section className="Archive" aria-label="Архив">
            <ul className="ArchiveList">
                {chats.map((chat) => {
                    const isConfirming = confirmId === chat.id;

                    return (
                        <li key={chat.id} className="ArchiveItem" onKeyDown={handleKeyDown}>
                            <button
                                type="button"
                                className="ArchiveItemTitle"
                                onClick={() => {
                                    if (openChat(chat.id)) navigate('/chat');
                                }}
                            >
                                {chat.title}
                            </button>

                            {isConfirming ? (
                                <div className="ArchiveConfirm" role="alertdialog" aria-label="Удалить чат?">
                                    <span className="ArchiveConfirmText">Удалить?</span>
                                    <button
                                        type="button"
                                        className="ArchiveBtn ArchiveBtn--danger"
                                        autoFocus
                                        onClick={() => {
                                            deleteChat(chat.id);
                                            setConfirmId(null);
                                        }}
                                    >
                                        Удалить
                                    </button>
                                    <button
                                        type="button"
                                        className="ArchiveBtn"
                                        onClick={() => setConfirmId(null)}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="ArchiveDelete"
                                    aria-label={`Удалить чат «${chat.title}»`}
                                    onClick={() => setConfirmId(chat.id)}
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                                    </svg>
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}