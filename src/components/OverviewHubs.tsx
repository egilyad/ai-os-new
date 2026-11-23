import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { OverviewHubService } from '../kernel/instances/services-extras';
import type { OverviewHubCard } from '../kernel/contracts/overview-hub';
import { eventBus, EVENTS } from '../kernel/instances/events';
import { agentService, memoryService } from '../kernel/instances/services-core';
import { notificationInboxService, runHistoryService } from '../kernel/instances/services-extras';
import { useActiveDebateStore } from '../stores/activeDebateStore';
import { useKeyStore } from '../stores/useKeyStore';

const STATUS_COLOR: Record<OverviewHubCard['status'], string> = {
    ok: 'var(--success)',
    warning: 'var(--warning)',
    error: 'var(--error)',
};

interface OverviewHubsProps {
    onNavigate: (page: string) => void;
}

const OverviewHubs: React.FC<OverviewHubsProps> = ({ onNavigate }) => {
    const keys = useKeyStore((s) => s.keys ?? []);
    const service = useMemo(
        () =>
            new OverviewHubService({
                agents: () =>
                    agentService.getAgents().map((a) => ({
                        id: a.id,
                        status: (a as { status?: string }).status,
                    })),
                memory: () => ({ count: memoryService.getMemories().length }),
                debates: () =>
                    Object.keys(useActiveDebateStore.getState().sessions).map((id) => ({ id })),
                providers: () => keys.map((k) => ({ id: k.id, status: k.status })),
                runs: async () => {
                    const [runs, failures] = await Promise.all([
                        runHistoryService.list(),
                        runHistoryService.listFailures(),
                    ]);
                    return { total: runs.length, failures: failures.length };
                },
                unread: () => notificationInboxService.list(true).length,
            }),
        [keys],
    );

    const [cards, setCards] = useState<OverviewHubCard[]>([]);
    const refresh = useCallback(() => {
        void service
            .snapshot()
            .then(setCards)
            .catch(() => setCards([]));
    }, [service]);

    useEffect(() => {
        refresh();
        const unsubs = [
            eventBus.on(EVENTS.NOTIFICATION, refresh),
            eventBus.on(EVENTS.KERNEL_UPDATED, refresh),
        ];
        return () => unsubs.forEach((u) => u());
    }, [refresh]);

    if (cards.length === 0) return null;

    return (
        <div
            role="region"
            aria-label="Overview hubs"
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 10,
                marginBottom: 16,
            }}
        >
            {cards.map((card) => (
                <button
                    key={card.id}
                    type="button"
                    onClick={() => onNavigate(card.link)}
                    aria-label={`${card.title}: ${card.value}`}
                    style={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        padding: '0.75rem 1rem',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                    }}
                >
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                        {card.title}
                    </div>
                    <div
                        style={{
                            fontSize: '1.4rem',
                            fontWeight: 700,
                            color: STATUS_COLOR[card.status],
                        }}
                    >
                        {card.value}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{card.hint}</div>
                </button>
            ))}
        </div>
    );
};

export default OverviewHubs;
