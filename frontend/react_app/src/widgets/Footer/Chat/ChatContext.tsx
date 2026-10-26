import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { ApiError } from '../../../shared/api/client';
import { streamReply } from './ChatService';

export type Message = {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    status?: 'streaming' | 'done';
    error?: boolean;
};

export type ArchivedChat = {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
};

/* ---------- storage helpers ---------- */

const CURRENT_KEY = 'chat:current';
const ARCHIVE_KEY = 'chat:archive';
const TITLE_MAX = 60;

function read<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function write(key: string, value: unknown) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* storage full or unavailable: the chat still works, it just isn't saved */
    }
}

function remove(key: string) {
    try {
        localStorage.removeItem(key);
    } catch {
        /* ignore */
    }
}

/** Drops empty bubbles (e.g. a reply interrupted before its first word) and finalizes the rest. */
function cleanMessages(messages: Message[]): Message[] {
    return messages
        .filter((m) => m.text.trim() !== '')
        .map((m) => ({ ...m, status: 'done' as const }));
}

const hasUserMessage = (messages: Message[]) => messages.some((m) => m.role === 'user');

function toArchived(id: string, messages: Message[]): ArchivedChat {
    const first = messages.find((m) => m.role === 'user')?.text.trim() ?? 'Без названия';
    const title = first.length > TITLE_MAX ? `${first.slice(0, TITLE_MAX).trimEnd()}…` : first;
    return { id, title, messages, createdAt: Date.now() };
}

/**
 * Runs once when the provider mounts (page load or refresh):
 * moves the chat that was in progress into the archive and returns the archive.
 * Safe to run twice (React StrictMode): the second run finds nothing left to move.
 */
function archiveStoredChat(): ArchivedChat[] {
    const archive = read<ArchivedChat[]>(ARCHIVE_KEY, []);
    const current = read<{ id: string; messages: Message[] } | null>(CURRENT_KEY, null);
    if (!current) return archive;

    const messages = cleanMessages(current.messages ?? []);
    if (!hasUserMessage(messages)) {
        remove(CURRENT_KEY);
        return archive;
    }

    const next = [toArchived(current.id, messages), ...archive.filter((c) => c.id !== current.id)];
    write(ARCHIVE_KEY, next);
    remove(CURRENT_KEY);
    return next;
}

/* ---------- errors ---------- */

/** Текст ошибки для пузыря ассистента. */
function errorText(e: unknown): string {
    if (e instanceof ApiError) {
        if (e.status === 503) return 'Ассистент временно недоступен';
        if (e.status === 401 || e.status === 403) return 'Войдите, чтобы пользоваться чатом';
        return e.message || 'Не удалось получить ответ.';
    }
    return 'Не удалось получить ответ.';
}

/* ---------- context ---------- */

type ChatContextValue = {
    messages: Message[];
    input: string;
    setInput: (value: string) => void;
    isStreaming: boolean;
    send: () => void;
    chats: ArchivedChat[];
    /** Loads an archived chat as the current one. Returns false if it can't be opened right now. */
    openChat: (id: string) => boolean;
    deleteChat: (id: string) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [chats, setChats] = useState<ArchivedChat[]>(archiveStoredChat);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const streamingRef = useRef(false);
    const chatIdRef = useRef<string>(crypto.randomUUID());

    // Keep the chat in progress in storage so a refresh can archive it.
    useEffect(() => {
        if (messages.length === 0) remove(CURRENT_KEY);
        else write(CURRENT_KEY, { id: chatIdRef.current, messages });
    }, [messages]);

    // Persist the archive after open/delete.
    useEffect(() => {
        write(ARCHIVE_KEY, chats);
    }, [chats]);

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || streamingRef.current) return;

        streamingRef.current = true;
        const assistantId = crypto.randomUUID();
        // В историю для бэкенда идут только успешные сообщения (без текущего: его добавит streamReply)
        const history = messages
            .filter((m) => m.text && !m.error)
            .map((m) => ({ role: m.role, content: m.text }));

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
            let full = '';
            for await (const chunk of streamReply(text, history)) {
                full += chunk;
                patch((m) => ({ ...m, text: full }));
            }
        } catch (e) {
            patch((m) => ({ ...m, text: errorText(e), error: true }));
        } finally {
            patch((m) => ({ ...m, status: 'done' }));
            streamingRef.current = false;
            setIsStreaming(false);
        }
    }, [input, messages]);

    const openChat = useCallback(
        (id: string): boolean => {
            if (streamingRef.current) return false; // don't swap the chat mid-reply
            const target = chats.find((c) => c.id === id);
            if (!target) return false;

            // The chat being replaced goes to the archive so nothing is lost.
            const current = cleanMessages(messages);
            const currentId = chatIdRef.current;
            setChats((prev) => {
                const rest = prev.filter((c) => c.id !== id && c.id !== currentId);
                return hasUserMessage(current) ? [toArchived(currentId, current), ...rest] : rest;
            });

            chatIdRef.current = target.id;
            setMessages(target.messages);
            setInput('');
            return true;
        },
        [chats, messages],
    );

    const deleteChat = useCallback((id: string) => {
        setChats((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const value = useMemo(
        () => ({ messages, input, setInput, isStreaming, send, chats, openChat, deleteChat }),
        [messages, input, isStreaming, send, chats, openChat, deleteChat],
    );

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
    return ctx;
}