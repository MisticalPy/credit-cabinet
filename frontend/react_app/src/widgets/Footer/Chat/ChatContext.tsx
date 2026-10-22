import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    useRef,
    type ReactNode,
} from 'react';
import { streamReply } from './ChatService';

export type Message = {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    status?: 'streaming' | 'done';
};

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
            for await (const chunk of streamReply(text)) {
                patch((m) => ({ ...m, text: m.text + chunk }));
            }
        } catch {
            patch((m) => ({ ...m, text: m.text || 'Не удалось получить ответ.' }));
        } finally {
            patch((m) => ({ ...m, status: 'done' }));
            streamingRef.current = false;
            setIsStreaming(false);
        }
    }, [input, isStreaming]);

    const value = useMemo(
        () => ({ messages, input, setInput, isStreaming, send }),
        [messages, input, isStreaming, send],
    );

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
    return ctx;
}

