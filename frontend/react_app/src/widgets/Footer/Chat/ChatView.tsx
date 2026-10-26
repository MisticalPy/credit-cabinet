import {
    useEffect,
    useLayoutEffect,
    useRef,
    // type ComponentType,
    type FormEvent,
    type KeyboardEvent,
} from 'react';
import { useChat } from './ChatContext';
import './Chat.css'

function ChatView() {
    const { messages, input, setInput, isStreaming, send } = useChat();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [input]);

    // Keep the view pinned to the newest text while it streams
    useEffect(() => {
        const el = messagesRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        send();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
        }
    };

    return (
        <>
            <div className="ChatPanel">
                <div ref={messagesRef} className="ChatMessages" role="log" aria-live="polite">
                    {messages.length === 0 ? (
                        <h3 className="ChatGreeting">Здравствуйте, подберем кредит?</h3>
                    ) : (
                        messages.map((m) => (
                            <div
                                key={m.id}
                                className={`ChatMessage ChatMessage--${m.role}`}
                                aria-busy={m.status === 'streaming'}
                            >
                                {m.status === 'streaming' && !m.text ? (
                                    <>
                                        <span className="Spinner" aria-label="Ассистент печатает" />
                                    </>
                                ) : (
                                    m.text
                                )}
                            </div>
                        ))
                    )}
                </div>

                <form className="ChatInputBar" onSubmit={handleSubmit}>
                    <textarea
                        ref={textareaRef}
                        className="ChatInput"
                        rows={1}
                        placeholder="Сообщение"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        className="ChatSend"
                        type="submit"
                        aria-label="Отправить"
                        disabled={!input.trim() || isStreaming}
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 19V5M12 5l-6 6M12 5l6 6" />
                        </svg>
                    </button>
                </form>
            </div>
        </>
    );
}

export default ChatView;
