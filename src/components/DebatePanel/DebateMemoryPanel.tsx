import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Brain } from 'lucide-react';
import { debateHumanService, debateService, eventBus, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('DebateMemoryPanel');
import { computeStats, findRelated, getCurrentSessions } from './debate-memory-helpers';
import DebateMemoryStats from './DebateMemoryStats';
import RelatedDebates from './RelatedDebates';
import DebateSessionCard from './DebateSessionCard';
import type { DebateSession } from '../../kernel/contracts/debate-types';

interface DebateMemoryPanelProps {
    onSelectSession?: (sessionId: string) => void;
}

export const DebateMemoryPanel: React.FC<DebateMemoryPanelProps> = ({ onSelectSession }) => {
    const [sessions, setSessions] = useState<DebateSession[]>(getCurrentSessions);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [injecting, setInjecting] = useState(false);

    useEffect(() => {
        const unsub = eventBus.onSafe<DebateSession>('debate:updated', () => {
            setSessions(getCurrentSessions());
        });
        return () => {
            unsub();
        };
    }, []);

    const filteredSessions = useMemo(() => {
        let result = sessions;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (s) =>
                    s.topic.toLowerCase().includes(q) ||
                    (s.consensus ?? '').toLowerCase().includes(q) ||
                    (s.arguments ?? []).some((a) => a.content.toLowerCase().includes(q)),
            );
        }
        // D-C-12: Filter by session status (conclusionType does not exist on DebateSession)
        if (selectedType !== 'all') {
            result = result.filter((s) => s.status === selectedType);
        }
        return result.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }, [sessions, searchQuery, selectedType]);

    const stats = useMemo(() => computeStats(sessions), [sessions]);

    const relatedDebates = useMemo(() => {
        const targetSession = expandedId
            ? sessions.find((s) => s.id === expandedId)
            : filteredSessions[0];
        if (!targetSession) return [];
        const idx = sessions.indexOf(targetSession);
        if (idx === -1) return [];
        return findRelated(idx, sessions);
    }, [filteredSessions, sessions, expandedId]);

    const handleInjectMemory = useCallback(async () => {
        if (!filteredSessions[0] || injecting) return;
        setInjecting(true);
        try {
            const current = debateService.getActiveDebateSession();
            const related = relatedDebates.slice(0, 3);
            if (related.length === 0 || !current) return;
            const memoryText = related
                .map(
                    (r, i) =>
                        `[Reference ${i + 1}] Debate "${r.session.topic}": ${(
                            r.session.arguments ?? []
                        )
                            .slice(0, 3)
                            .map((a) => a.content.slice(0, 200))
                            .join(' | ')}`,
                )
                .join('\n\n');
            await debateHumanService.addArgument(
                debateService.getActiveDebateSession(),
                'Memory System',
                `### Memory from Past Debates\n\n${memoryText}`,
                0.8,
            );
        } catch (e) {
            LOGGER.warn('DebateMemoryPanel', 'inject memory failed', { error: e });
        } finally {
            setInjecting(false);
        }
    }, [filteredSessions, relatedDebates, injecting]);

    return (
        <div
            style={{
                flex: 1,
                overflow: 'auto',
                padding: '1rem',
                background: 'rgba(0,0,0,0.15)',
                borderRadius: 12,
                border: '1px solid var(--border)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <Brain size={20} color="#8b5cf6" />
                <h3
                    style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                    }}
                >
                    Debate Memory
                </h3>
                <span
                    style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}
                >
                    {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
                </span>
            </div>

            {sessions.length > 0 && <DebateMemoryStats {...stats} />}

            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search
                        size={14}
                        style={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            pointerEvents: 'none',
                        }}
                    />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by topic, content..."
                        style={{
                            width: '100%',
                            padding: '6px 10px 6px 30px',
                            borderRadius: 8,
                            boxSizing: 'border-box',
                            border: '1px solid var(--border)',
                            background: 'rgba(255,255,255,0.04)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            outline: 'none',
                        }}
                    />
                </div>
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={{
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-main)',
                        fontSize: '0.75rem',
                    }}
                >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                </select>
            </div>

            <RelatedDebates
                relatedDebates={relatedDebates}
                currentTopic={filteredSessions[0]?.topic}
                expandedId={expandedId}
                sessions={sessions}
                onSelectSession={onSelectSession}
                injecting={injecting}
                handleInjectMemory={handleInjectMemory}
                hasActiveSession={debateService.getActiveDebateSession()?.status === 'active'}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredSessions.length === 0 && (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '2rem',
                            color: 'var(--text-muted)',
                            fontSize: '0.8rem',
                        }}
                    >
                        {searchQuery
                            ? 'No sessions match your search.'
                            : 'No completed debates yet.'}
                    </div>
                )}
                {filteredSessions.map((session) => (
                    <DebateSessionCard
                        key={session.id}
                        session={session}
                        isExpanded={expandedId === session.id}
                        onToggle={() =>
                            setExpandedId(expandedId === session.id ? null : session.id)
                        }
                    />
                ))}
            </div>
        </div>
    );
};
