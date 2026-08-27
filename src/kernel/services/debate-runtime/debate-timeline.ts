import { CONFIG } from '../config-registry';
import { rootLogger } from '../logger-service';
import type {
    TimelineEntry,
    IDebateTimeline,
    ReasoningTrace,
} from '../../contracts/debate-runtime';

const LOGGER = rootLogger.child('DebateTimeline');

function getMaxEntries(): number {
    return CONFIG?.services?.debate?.timelineMaxEntries ?? 5000;
}

function storageKey(sessionId: string): string {
    return `debate_timeline_${sessionId}`;
}

const MAX_TIMELINE_CONTENT = 500;

function truncatePayload(entry: TimelineEntry): TimelineEntry {
    if (entry.type === 'agent:responded' && entry.payload && typeof entry.payload === 'object') {
        const p = entry.payload as Record<string, unknown>;
        if (typeof p.content === 'string' && p.content.length > MAX_TIMELINE_CONTENT) {
            return {
                ...entry,
                payload: { ...p, content: p.content.slice(0, MAX_TIMELINE_CONTENT) },
            };
        }
    }
    return entry;
}

export class DebateTimeline implements IDebateTimeline {
    private entries: TimelineEntry[] = [];
    private cursor = 0;
    private warned = false;
    private loadedSessions = new Set<string>();

    async loadPersisted(sessionId: string): Promise<void> {
        if (this.loadedSessions.has(sessionId)) return;
        this.loadedSessions.add(sessionId);
        try {
            const { BucketStorageAdapter } = await import('../storage-adapter');
            const saved = await BucketStorageAdapter.RESEARCH.get<TimelineEntry[]>(
                storageKey(sessionId),
            );
            if (saved && Array.isArray(saved)) {
                this.entries.push(...saved);
            }
        } catch (e) {
            LOGGER.warn('DebateTimeline', 'Failed to load persisted entries', { error: String(e) });
        }
    }

    async persist(sessionId: string): Promise<void> {
        try {
            const sessionEntries = this.entries
                .filter((e) => e.sessionId === sessionId)
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(-500); // only keep last 500 — localStorage has ~5MB limit
            const { BucketStorageAdapter } = await import('../storage-adapter');
            await BucketStorageAdapter.RESEARCH.set(storageKey(sessionId), sessionEntries);
        } catch (e) {
            // QuotaExceededError — try with even fewer entries
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                try {
                    const sessionEntries = this.entries
                        .filter((e) => e.sessionId === sessionId)
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .slice(-100);
                    const { BucketStorageAdapter } = await import('../storage-adapter');
                    await BucketStorageAdapter.RESEARCH.set(storageKey(sessionId), sessionEntries);
                    LOGGER.warn(
                        'DebateTimeline',
                        `localStorage full — persisted last 100 entries only`,
                    );
                } catch {
                    // still failed — skip persistence entirely
                }
            }
        }
    }

    record(entry: Omit<TimelineEntry, 'id' | 'timestamp'>): void {
        const full = truncatePayload({
            ...entry,
            id: `${Date.now()}-${this.cursor}`,
            timestamp: Date.now(),
        });

        if (this.entries.length < getMaxEntries()) {
            this.entries.push(full);
        } else {
            if (!this.warned) {
                LOGGER.warn(
                    'DebateTimeline',
                    `Circular buffer full at ${getMaxEntries()} — overwriting oldest entries`,
                );
                this.warned = true;
            }
            this.entries[this.cursor % getMaxEntries()] = full;
        }
        this.cursor++;
    }

    getEntries(sessionId: string): TimelineEntry[] {
        return this.entries
            .filter((e) => e.sessionId === sessionId)
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    getByType(type: string): TimelineEntry[] {
        return this.entries.filter((e) => e.type === type);
    }

    getReasoningTraces(sessionId: string): ReasoningTrace[] {
        const entries = this.getEntries(sessionId);
        return entries
            .filter((e) => e.type === 'agent:responded')
            .map((e) => {
                const p = e.payload as { agentId?: string; content?: string; round?: number };
                return {
                    agentId: p?.agentId || 'unknown',
                    round: p?.round || 0,
                    decisionPoints: this.extractDecisionPoints(p?.content || ''),
                    uncertaintyMap: this.extractUncertainties(p?.content || ''),
                    timestamp: e.timestamp,
                };
            });
    }

    private extractDecisionPoints(content: string): string[] {
        const points: string[] = [];
        const patterns = [
            /поэтому|следовательно|вывод|итог|конечно|ясно|важно|критично|ключевой|главный/gi,
            /therefore|thus|consequently|clearly|importantly|crucially|key|main/gi,
        ];
        for (const pattern of patterns) {
            const matches = content.match(pattern);
            if (matches) points.push(...matches.slice(0, 3));
        }
        return points.slice(0, 5);
    }

    private extractUncertainties(content: string): Record<string, number> {
        const uncertainties: Record<string, number> = {};
        const phrases = [
            ['возможно', 0.6],
            ['вероятно', 0.7],
            ['не уверен', 0.4],
            ['может быть', 0.5],
            ['предположительно', 0.5],
            ['perhaps', 0.6],
            ['possibly', 0.6],
            ['maybe', 0.5],
            ['uncertain', 0.4],
            ['likely', 0.7],
            ['probably', 0.7],
        ] as const;
        const lower = content.toLowerCase();
        for (const [phrase, score] of phrases) {
            if (lower.includes(phrase)) uncertainties[phrase] = score;
        }
        return uncertainties;
    }

    removeSession(sessionId: string): void {
        this.entries = this.entries.filter((e) => e.sessionId !== sessionId);
    }

    snapshot(): TimelineEntry[] {
        return [...this.entries].sort((a, b) => a.timestamp - b.timestamp);
    }

    destroy(): void {
        this.entries = [];
        this.cursor = 0;
        this.loadedSessions.clear();
    }
}
