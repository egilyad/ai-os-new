import type { IMemoryEngine } from '../contracts/memory';
import type { MemoryEntry } from '../types/memory-types';

/**
 * Demo seed for Memory: three Russian entries (decision, lesson, note)
 * about the demo storyline (agent veto, quiet hours).
 *
 * Idempotent: entries whose content starts with DEMO_MEMORY_PREFIX are reused.
 */
export const DEMO_MEMORY_PREFIX = 'Демо: ';

function entry(
    content: string,
    type: string,
    importance: number,
    labels: string[],
): Omit<MemoryEntry, 'id'> {
    return {
        content,
        metadata: {
            source: 'demo-seed',
            type,
            timestamp: Date.now(),
            importance,
            tags: { labels },
        },
    };
}

export async function seedMemoryDemo(engine: IMemoryEngine): Promise<MemoryEntry[]> {
    const existing = engine
        .getMemories()
        .filter((m) => m.content.startsWith(DEMO_MEMORY_PREFIX));
    if (existing.length > 0) return existing;

    const entries = [
        entry(
            'Демо: вето агентов работает только с журналом причин и кнопкой отмены у человека.',
            'decision',
            0.8,
            ['демо', 'вето'],
        ),
        entry(
            'Демо: ночной спам — причина №1 отключения уведомлений, тихие часы 23:00–7:00.',
            'lesson',
            0.7,
            ['демо', 'уведомления'],
        ),
        entry(
            'Демо: Рафаэль считает риски, Маркус строит, Элена следит за вежливостью.',
            'note',
            0.5,
            ['демо', 'команда'],
        ),
    ];
    await engine.storeBatch(entries);
    return engine.getMemories().filter((m) => m.content.startsWith(DEMO_MEMORY_PREFIX));
}
