import type { IGroupChatService } from '../../contracts/rivals';
import type { GroupChat } from '../../types/rival-types';

/**
 * Demo seed for Group Chat: one running chat where three members already
 * exchanged turns (posted statically via postTurn — no LLM needed).
 *
 * Idempotent: chats named DEMO_GROUPCHAT_NAME are reused.
 */
export const DEMO_GROUPCHAT_NAME = 'Демо: планёрка ☕';

const MARCUS = 'Marcus Hale';
const RAFAEL = 'Rafael Stone';
const ELENA = 'Elena Marchetti';

export async function seedGroupChatDemo(service: IGroupChatService): Promise<GroupChat> {
    const existing = (await service.listChats()).find((c) => c.name === DEMO_GROUPCHAT_NAME);
    if (existing) return existing;

    const chat = await service.createChat({
        name: DEMO_GROUPCHAT_NAME,
        members: [MARCUS, RAFAEL, ELENA],
    });
    await service.postTurn(
        chat.id,
        MARCUS,
        'Давайте быстро: бот-напоминалка, второй спринт. У меня каркас готов, что у остальных?',
    );
    await service.postTurn(
        chat.id,
        RAFAEL,
        'Риски посчитал: главный — спам напоминаниями. Предлагаю лимит три в день и тихие часы с 23 до 7.',
    );
    await service.postTurn(
        chat.id,
        ELENA,
        'Поддерживаю тихие часы. Плюс право на апелляцию: если бот ошибся, человек отменяет одним тапом.',
    );
    return (await service.get(chat.id)) ?? chat;
}
