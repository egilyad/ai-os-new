/**
 * AssistantDiaryService — the assistant's own experience log.
 *
 * The assistant must not forget what it did and what it got wrong, otherwise
 * it repeats the same mistake every session. The diary stores that experience
 * in two places at once:
 *   - the agent journal (persistent, queryable by tag and date);
 *   - the long-term memory (semantic — it surfaces in the context of a later
 *     question, which is the "episodic" layer of the prompt).
 */
import type {
    AssistantDiaryEntry,
    AssistantDiaryKind,
} from '../../contracts/assistant';
import type { AgentJournalService, JournalEntry } from '../agent-journal-service';

export const ASSISTANT_DIARY_AGENT_ID = 'assistant';

export interface AssistantDiaryDeps {
    journal: AgentJournalService;
    /** Long-term memory — the diary becomes part of what the assistant recalls. */
    memory?: {
        store(entry: {
            content: string;
            metadata: Record<string, unknown>;
        }): Promise<string>;
    };
}

export interface WriteDiaryInput {
    kind: AssistantDiaryKind;
    text: string;
    evidence?: string;
    outcome?: AssistantDiaryEntry['outcome'];
    tags?: string[];
    importance?: number;
}

export class AssistantDiaryService {
    constructor(private readonly deps: AssistantDiaryDeps) {}

    /** Record an experience. */
    async write(input: WriteDiaryInput): Promise<AssistantDiaryEntry> {
        const text = input.text.trim();
        if (!text) throw new Error('diary entry text is required');
        const kind = input.kind;
        const tags = ['assistant', 'diary', kind, ...(input.tags ?? [])];

        const entry = await this.deps.journal.record({
            agentId: ASSISTANT_DIARY_AGENT_ID,
            agentName: 'Помощник',
            taskType: `assistant.${kind}`,
            taskDescription: text,
            outcome: input.outcome ?? 'success',
            durationMs: 0,
            tokensUsed: 0,
            notes: input.evidence,
            tags,
        });

        if (this.deps.memory) {
            try {
                await this.deps.memory.store({
                    content: input.evidence ? `${text}\n\n${input.evidence}` : text,
                    metadata: {
                        source: 'assistant',
                        type: 'diary',
                        timestamp: Date.now(),
                        importance: input.importance ?? 0.5,
                        agentId: ASSISTANT_DIARY_AGENT_ID,
                    },
                });
            } catch {
                // The journal already holds the entry — memory is a mirror.
            }
        }

        return {
            id: entry.id,
            kind,
            text,
            evidence: input.evidence,
            outcome: entry.outcome,
            tags,
            timestamp: entry.timestamp,
        };
    }

    /** The most recent experiences, newest first. */
    recent(limit = 10): AssistantDiaryEntry[] {
        return this.deps.journal
            .listByAgent(ASSISTANT_DIARY_AGENT_ID)
            .slice(0, Math.max(0, limit))
            .map(toDiaryEntry);
    }

    /** Search the diary by text. */
    search(query: string, limit = 10): AssistantDiaryEntry[] {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return this.deps.journal
            .search(query)
            .filter((e) => e.agentId === ASSISTANT_DIARY_AGENT_ID)
            .slice(0, Math.max(0, limit))
            .map(toDiaryEntry);
    }

    /** All experiences of one kind. */
    byKind(kind: AssistantDiaryKind, limit = 10): AssistantDiaryEntry[] {
        return this.recent(500)
            .filter((e) => e.kind === kind)
            .slice(0, Math.max(0, limit));
    }

    count(): number {
        return this.deps.journal.countByAgent(ASSISTANT_DIARY_AGENT_ID);
    }

    /** A compact block for the assistant prompt. */
    summary(limit = 5): string {
        const entries = this.recent(limit);
        if (entries.length === 0) return '';
        return entries
            .map((e) => `- (${e.kind}) ${e.text}${e.evidence ? ` — ${e.evidence}` : ''}`)
            .join('\n');
    }
}

function toDiaryEntry(entry: JournalEntry): AssistantDiaryEntry {
    const kind = (entry.taskType.replace(/^assistant\./, '') || 'question') as AssistantDiaryKind;
    return {
        id: entry.id,
        kind,
        text: entry.taskDescription,
        evidence: entry.notes,
        outcome: entry.outcome,
        tags: entry.tags,
        timestamp: entry.timestamp,
    };
}
