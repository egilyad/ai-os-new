import type { ChatResponse } from '../../kernel/types/chat-types';
import type { ChatEntry, ChatSession, SessionStore } from '../../kernel/contracts/storage/session-store';

/**
 * Demo seed for Chat: one completed session with a finished user → assistant
 * exchange (plus a follow-up), written straight to the session store — no
 * LLM call needed.
 *
 * Idempotent: the fixed DEMO_CHAT_ID row is reused (put overwrites).
 */
export const DEMO_CHAT_ID = 'demo-chat-seed';
export const DEMO_CHAT_TITLE = 'Демо: вето агентов';

function response(id: string, content: string): ChatResponse {
    return {
        id,
        requestId: `req-${id}`,
        provider: 'OpenRouter',
        model: 'openai/gpt-4o',
        content,
        latency: 1200,
        status: 'done',
        timestamp: Date.now(),
    };
}

function entry(
    id: string,
    role: ChatEntry['role'],
    text: string,
    responses: ChatResponse[] = [],
    at: number,
): ChatEntry {
    return { id, role, text, responses, timestamp: at };
}

export async function seedChatDemo(store: SessionStore): Promise<string> {
    const now = Date.now();
    const assistantText = [
        'Коротко: да, но с журналом и кнопкой отмены. Вето без следа —',
        'это тихий саботаж, а вето с причиной и апелляцией — нормальный',
        'предохранитель. Если хочешь, распишу три условия внедрения.',
    ].join(' ');
    const followUpText = [
        'Три условия: 1) причина пишется в журнал; 2) человек перекрывает',
        'одной кнопкой; 3) частое вето разбираем раз в неделю, а не караем',
        'молча. Так Рафаэль спокоен за риски, а Элена — за справедливость.',
    ].join(' ');

    const session: ChatSession = {
        id: DEMO_CHAT_ID,
        title: DEMO_CHAT_TITLE,
        history: [
            entry('demo-chat-e1', 'user', 'Стоит ли давать агентам право вето на задачи?', [], now - 300000),
            entry(
                'demo-chat-e2',
                'assistant',
                assistantText,
                [response('demo-chat-r1', assistantText)],
                now - 280000,
            ),
            entry('demo-chat-e3', 'user', 'А какие именно три условия?', [], now - 200000),
            entry(
                'demo-chat-e4',
                'assistant',
                followUpText,
                [response('demo-chat-r2', followUpText)],
                now - 180000,
            ),
        ],
        createdAt: now - 300000,
        updatedAt: now - 180000,
        tags: ['демо'],
    };
    await store.put(session);
    return DEMO_CHAT_ID;
}
