import React from 'react';
import type { ConversationScenario } from '../../kernel/contracts/conversation/scenario';
import { useTranslation } from '../../i18n/useTranslation';
import ScenarioStatusBadge from './ScenarioStatusBadge';

const btnStyle = (color: string): React.CSSProperties => ({
    background: 'none',
    border: `1px solid ${color}`,
    color,
    cursor: 'pointer',
    padding: '0.2rem 0.5rem',
    borderRadius: 4,
    fontSize: '0.72rem',
});

const ScenarioCard: React.FC<{
    scenario: ConversationScenario;
    onLoad: (scenario: ConversationScenario) => void;
    onDuplicate: (id: string) => void;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ scenario, onLoad, onDuplicate, onArchive, onDelete }) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.2)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                }}
            >
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{scenario.name}</div>
                <ScenarioStatusBadge status={scenario.status} />
            </div>
            {scenario.description && (
                <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.75 }}>
                    {scenario.description}
                </p>
            )}
            <div style={{ fontSize: '0.72rem', opacity: 0.6 }}>
                {t('director.library.participants')}: {scenario.participants.length} ·{' '}
                {t('director.library.turns')}: {scenario.turns.length} · v{scenario.version}
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button onClick={() => onLoad(scenario)} style={btnStyle('#3b82f6')}>
                    {t('director.library.load')}
                </button>
                <button onClick={() => onDuplicate(scenario.id)} style={btnStyle('#94a3b8')}>
                    {t('director.library.duplicate')}
                </button>
                {scenario.status !== 'archived' && (
                    <button onClick={() => onArchive(scenario.id)} style={btnStyle('#f59e0b')}>
                        {t('director.library.archive')}
                    </button>
                )}
                <button onClick={() => onDelete(scenario.id)} style={btnStyle('#ef4444')}>
                    {t('director.library.delete')}
                </button>
            </div>
        </div>
    );
};

export default ScenarioCard;
