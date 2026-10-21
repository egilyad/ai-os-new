import { describe, it, expect, vi } from 'vitest';
import { AssistantDiaryService } from './assistant-diary-service';
import type { AgentJournalService, JournalEntry } from '../agent-journal-service';

function makeJournal() {
    const entries: JournalEntry[] = [];
    let counter = 0;
    const journal = {
        record: vi.fn(async (input: Omit<JournalEntry, 'id' | 'timestamp'>) => {
            counter += 1;
            const entry: JournalEntry = {
                ...input,
                id: `j-${counter}`,
                timestamp: Date.now(),
            };
            entries.unshift(entry);
            return entry;
        }),
        listByAgent: (agentId: string) => entries.filter((e) => e.agentId === agentId),
        search: (query: string) =>
            entries.filter((e) =>
                `${e.taskDescription} ${e.notes ?? ''}`.toLowerCase().includes(query.toLowerCase()),
            ),
        countByAgent: (agentId: string) => entries.filter((e) => e.agentId === agentId).length,
    };
    return { journal: journal as unknown as AgentJournalService, entries };
}

describe('AssistantDiaryService', () => {
    it('records an experience with the assistant tags', async () => {
        const { journal, entries } = makeJournal();
        const diary = new AssistantDiaryService({ journal });

        const entry = await diary.write({
            kind: 'lesson',
            text: 'Панель памяти открывается только после монтирования топологии',
            evidence: 'route: /memory',
        });

        expect(entry.kind).toBe('lesson');
        expect(entry.tags).toContain('assistant');
        expect(entry.tags).toContain('diary');
        expect(entry.tags).toContain('lesson');
        expect(entries[0]?.agentId).toBe('assistant');
        expect(entries[0]?.notes).toBe('route: /memory');
    });

    it('mirrors the entry into the long-term memory', async () => {
        const { journal } = makeJournal();
        const store = vi.fn(async () => 'mem-1');
        const diary = new AssistantDiaryService({ journal, memory: { store } });

        await diary.write({ kind: 'decision', text: 'Решили: доверять коду' });

        expect(store).toHaveBeenCalledWith({
            content: 'Решили: доверять коду',
            metadata: expect.objectContaining({ source: 'assistant', type: 'diary' }),
        });
    });

    it('does not fail when the memory mirror is broken', async () => {
        const { journal } = makeJournal();
        const store = vi.fn(async () => {
            throw new Error('memory is down');
        });
        const diary = new AssistantDiaryService({ journal, memory: { store } });

        await expect(diary.write({ kind: 'lesson', text: 'x' })).resolves.toMatchObject({
            kind: 'lesson',
        });
    });

    it('lists the recent entries and searches them', async () => {
        const { journal } = makeJournal();
        const diary = new AssistantDiaryService({ journal });

        await diary.write({ kind: 'question', text: 'где память?' });
        await diary.write({ kind: 'answer', text: 'в /memory' });

        expect(diary.recent(1)[0]?.text).toBe('в /memory');
        expect(diary.recent(10)).toHaveLength(2);
        expect(diary.search('память').map((e) => e.text)).toEqual(['где память?']);
        expect(diary.count()).toBe(2);
    });

    it('filters by kind and produces a prompt summary', async () => {
        const { journal } = makeJournal();
        const diary = new AssistantDiaryService({ journal });

        await diary.write({ kind: 'mistake', text: 'Сказал «открыл», а панель не открылась' });
        await diary.write({ kind: 'question', text: 'что дальше?' });

        expect(diary.byKind('mistake')).toHaveLength(1);
        const summary = diary.summary(5);
        expect(summary).toContain('(mistake)');
        expect(summary).toContain('(question)');
    });

    it('refuses an empty entry', async () => {
        const { journal } = makeJournal();
        const diary = new AssistantDiaryService({ journal });
        await expect(diary.write({ kind: 'lesson', text: '   ' })).rejects.toThrow(
            /text is required/,
        );
    });
});
