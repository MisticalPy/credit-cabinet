import { api } from '../../../shared/api/client';

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

export async function sendChat(messages: ChatMessage[]): Promise<string> {
    const data = await api<{ reply: string }>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ messages }),
    });
    return data.reply;
}
