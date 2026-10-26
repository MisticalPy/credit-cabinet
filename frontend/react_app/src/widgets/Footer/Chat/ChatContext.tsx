import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    useRef,
    type ReactNode,
} from 'react';
import { ApiError } from '../../../shared/api/client';
import { sendChat } from './ChatService';

export type Message = {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    status?: 'streaming' | 'done';
    error?: boolean;
};

/** Текст ошибки для пузыря ассистента. */
function errorText(e: unknown): string {
    if (e instanceof ApiError) {
        if (e.status === 503) return 'Ассистент временно недоступен';
        if (e.status === 401 || e.status === 403) return 'Войдите, чтобы пользоваться чатом';
        return e.message || 'Не удалось получить ответ.';
    }
    return 'Не удалось получить ответ.';
}

type ChatContextValue = {
    messages: Message[];
    input: string;
    setInput: (value: string) => void;
    isStreaming: boolean;
    send: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);


export function ChatProvider({ children }: { children: ReactNode }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const streamingRef = useRef(false);

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || streamingRef.current) return;

        streamingRef.current = true;
        const assistantId = crypto.randomUUID();
        // В историю для бэкенда идут только успешные сообщения
        const history = [
            ...messages
                .filter((m) => m.text && !m.error)
                .map((m) => ({ role: m.role, content: m.text })),
            { role: 'user' as const, content: text },
        ];

        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: 'user', text },
            { id: assistantId, role: 'assistant', text: '', status: 'streaming' },
        ]);
        setInput('');
        setIsStreaming(true);

        const patch = (fn: (m: Message) => Message) =>
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)));

        try {
            const reply = await sendChat(history);
            patch((m) => ({ ...m, text: reply }));
        } catch (e) {
            patch((m) => ({ ...m, text: errorText(e), error: true }));
        } finally {
            patch((m) => ({ ...m, status: 'done' }));
            streamingRef.current = false;
            setIsStreaming(false);
        }
    }, [input, messages]);

    const value = useMemo(
        () => ({ messages, input, setInput, isStreaming, send }),
        [messages, input, isStreaming, send],
    );

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
    return ctx;
}
