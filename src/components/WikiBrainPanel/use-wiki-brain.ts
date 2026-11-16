import { useCallback, useEffect, useRef, useState } from 'react';
import { getContainer } from '../../kernel/service-helper';
import { eventBus } from '../../kernel/events/event-bus';
import { EVENTS } from '../../kernel/events/event-names';
import type { IWikiBrainService } from '../../kernel/contracts/wiki-brain';

export interface WikiStats {
    pages: number;
    sources: number;
    pending: number;
    total: number;
    issues: number;
    units: number;
}

export interface WikiEventLine {
    id: string;
    event: string;
    ts: number;
    preview: string;
}

const WIKI_EVENTS = [
    EVENTS.WIKI_PAGE_WRITTEN,
    EVENTS.WIKI_PAGE_DELETED,
    EVENTS.WIKI_SOURCE_INGESTED,
    EVENTS.WIKI_EDIT_COMMITTED,
] as const;

export function getBrain(): IWikiBrainService {
    return getContainer().get<IWikiBrainService>('wikiBrainService');
}

export function useWikiStats(refreshKey: number): { stats: WikiStats | null; load: () => Promise<void> } {
    const [stats, setStats] = useState<WikiStats | null>(null);
    const load = useCallback(async () => {
        try {
            const brain = getBrain();
            const store = brain.store;
            const [allPages, allSources, allQueue, issues, units] = await Promise.all([
                store.listPages({ limit: 10000 }),
                store.listSources({ limit: 10000 }),
                store.listQueue(),
                brain.lint.listIssues(),
                getContainer().has('knowledgeUnitService')
                    ? getContainer().get<{ listAll(): Promise<unknown[]> }>('knowledgeUnitService').listAll()
                    : Promise.resolve([]),
            ]);
            const pending = allQueue.filter((t) => t.status === 'pending').length;
            setStats({
                pages: allPages.length,
                sources: allSources.length,
                pending,
                total: allQueue.length,
                issues: issues.length,
                units: units.length,
            });
        } catch {
            setStats(null);
        }
    }, []);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load, refreshKey]);
    return { stats, load };
}

export function useWikiEvents(limit = 12): WikiEventLine[] {
    const [events, setEvents] = useState<WikiEventLine[]>([]);
    const eventsRef = useRef<WikiEventLine[]>([]);

    useEffect(() => {
        const push = (name: string, payload: unknown) => {
            const preview = payload && typeof payload === 'object'
                ? JSON.stringify(payload).slice(0, 120)
                : String(payload ?? '');
            const line: WikiEventLine = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                event: name,
                ts: Date.now(),
                preview,
            };
            const next = [line, ...eventsRef.current].slice(0, limit);
            eventsRef.current = next;
            setEvents(next);
        };
        const unsubs = WIKI_EVENTS.map((name) =>
            eventBus.on(name as never, (payload) => push(String(name), payload)),
        );
        return () => {
            for (const off of unsubs) off();
        };
    }, [limit]);

    return events;
}
