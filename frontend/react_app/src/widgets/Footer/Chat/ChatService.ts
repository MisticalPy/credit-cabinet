import { api } from '../../../shared/api/client';

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

/** Отправляет всю историю диалога ассистенту и возвращает его ответ. */
export async function sendChat(messages: ChatMessage[]): Promise<string> {
    const data = await api<{ reply: string }>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ messages }),
    });
    return data.reply;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Отдаёт ответ ассистента по частям (по словам и пробелам).
 * history — предыдущие сообщения диалога, без текущего.
 */
export async function* streamReply(
    userText: string,
    history: ChatMessage[] = [],
): AsyncGenerator<string> {
    const reply = await sendChat([...history, { role: 'user', content: userText }]);

    for (const part of reply.split(/(\s+)/)) {
        if (!part) continue;
        await sleep(40);
        yield part;
    }
}