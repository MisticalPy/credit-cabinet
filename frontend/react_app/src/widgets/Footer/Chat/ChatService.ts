const TEST_REPLY = `Это тестовый ответ ассистента.

Сейчас текст приходит по частям, как при настоящей генерации. Позже эта заглушка будет заменена на запрос к бэкенду, а интерфейс останется без изменений. 


Кстати, не возвращать кредиты нельзя

Это тестовый ответ ассистента.

Сейчас текст приходит по частям, как при настоящей генерации. Позже эта заглушка будет заменена на запрос к бэкенду, а интерфейс останется без изменений. 


Кстати, не возвращать кредиты нельзя`;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));


export async function* streamReply(_userText: string): AsyncGenerator<string> {
    await sleep(700);

    for (const part of TEST_REPLY.split(/(\s+)/)) {
        if (!part) continue;
        await sleep(40);
        yield part;
    }
}