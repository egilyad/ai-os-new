import { Activity } from 'lucide-react';
import type { DebateSessionSnapshot } from '../../kernel/instances';
import { PHASE_COLORS } from './debate-runtime-constants';
import { PhaseTimeline } from './PhaseTimeline';
import {
    debateRuntimeEmptyState,
    debateRuntimeSectionTitle,
    flexColGap3,
} from '../../styles/common';

interface SessionListPanelProps {
    sessions: DebateSessionSnapshot[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const SessionListPanel: React.FC<SessionListPanelProps> = ({
    sessions,
    selectedId,
    onSelect,
    t,
}) => (
    <div style={flexColGap3}>
        <h3 style={debateRuntimeSectionTitle}>
            <Activity size={16} /> {t('debate_runtime.active_sessions', { count: sessions.length })}
        </h3>
        {sessions.length === 0 ? (
            <div style={debateRuntimeEmptyState}>{t('debate_runtime.no_sessions')}</div>
        ) : (
            sessions.map((s) => (
                <div
                    key={s.id}
                    onClick={() => onSelect(s.id)}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background:
                            selectedId === s.id ? 'rgba(139,92,246,0.1)' : 'rgba(30,30,50,0.3)',
                        border: `1px solid ${selectedId === s.id ? 'rgba(139,92,246,0.3)' : 'rgba(100,116,139,0.15)'}`,
                        transition: 'all 0.2s',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <span style={{ fontWeight: 600, color: 'var(--slate-200)', fontSize: '0.85rem' }}>
                            {s.topic}
                        </span>
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.5rem',
                                borderRadius: 4,
                                background: `${PHASE_COLORS[s.phase]}20`,
                                color: PHASE_COLORS[s.phase],
                            }}
                        >
                            {s.phase}
                        </span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            fontSize: '0.75rem',
                            color: 'var(--slate-500)',
                        }}
                    >
                        <span>{t('debate_runtime.round', { value: s.round })}</span>
                        <span>{t('debate_runtime.topology', { value: s.topology.type })}</span>
                        <span>
                            {t('debate_runtime.agents_count', { count: s.agentStates.length })}
                        </span>
                    </div>
                    <PhaseTimeline phase={s.phase} />
                </div>
            ))
        )}
    </div>
);

export default SessionListPanel;
