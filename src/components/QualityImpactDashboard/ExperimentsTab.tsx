import React, { useState, useEffect, useCallback } from 'react';
import { experimentEngine } from '../../kernel/instances';
import { getTechniques } from '../../kernel/instances';
import type { QualityExperiment } from '../../kernel/contracts/quality-impact';
import { useTranslation } from '../../i18n/useTranslation';
import {
    STATUS_COLOR,
    CONFIDENCE_COLOR,
    PRETTY_CONFIDENCE,
    tableContainerStyle,
    emptyStyle,
    badgeStyle,
    deltaStyle,
} from './quality-impact-shared';

const ExperimentsTab: React.FC = () => {
    const { t } = useTranslation();
    const [experiments, setExperiments] = useState<QualityExperiment[]>([]);
    const [expandedExp, setExpandedExp] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [expName, setExpName] = useState('');
    const [expSessions, setExpSessions] = useState('10');
    const [selectedTechs, setSelectedTechs] = useState<Record<string, boolean>>({});

    const allTechniques = getTechniques();

    const refresh = useCallback(() => {
        try {
            setExperiments(experimentEngine.getAllExperiments() ?? []);
        } catch {
            setExperiments([]);
        }
    }, []);

    useEffect(() => {
        refresh();
        const id = setInterval(refresh, 10000);
        return () => clearInterval(id);
    }, [refresh]);

    const handleCreate = async () => {
        const techIds = Object.entries(selectedTechs)
            .filter(([, v]) => v)
            .map(([k]) => k);
        if (techIds.length === 0 || !expName.trim()) return;
        await experimentEngine.startExperiment({
            techniqueIds: techIds,
            name: expName.trim(),
            enabledOnInit: true,
        });
        setShowCreate(false);
        setExpName('');
        setExpSessions('10');
        setSelectedTechs({});
        refresh();
    };

    const handleStop = async (id: string) => {
        await experimentEngine.stopExperiment(id);
        refresh();
    };
    const handleDelete = async (id: string) => {
        await experimentEngine.deleteExperiment(id);
        refresh();
    };

    const toggleTech = (techId: string) =>
        setSelectedTechs((s) => ({ ...s, [techId]: !s[techId] }));

    const expRowStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1.5fr 100px',
        padding: '12px 20px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background 0.15s',
    };

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                }}
            >
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--slate-200)' }}>
                    {t('quality_impact.experiments_title') ?? 'Experiments'}
                    <span
                        style={{
                            fontSize: '13px',
                            color: 'var(--slate-500)',
                            fontWeight: 400,
                            marginLeft: '8px',
                        }}
                    >
                        {experiments.length}{' '}
                        {t('quality_impact.experiments_count') ?? 'experiments'}
                    </span>
                </div>
                <button
                    onClick={() => {
                        setShowCreate(!showCreate);
                        setExpName('');
                        setExpSessions('10');
                        setSelectedTechs({});
                    }}
                    style={{
                        padding: '8px 16px',
                        background: showCreate
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                        border: `1px solid ${showCreate ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                        borderRadius: '8px',
                        color: showCreate ? '#ef4444' : '#60a5fa',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '13px',
                    }}
                >
                    {showCreate
                        ? (t('quality_impact.cancel') ?? 'Cancel')
                        : `+ ${t('quality_impact.create_experiment') ?? 'Create Experiment'}`}
                </button>
            </div>

            {showCreate && (
                <div
                    style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '12px',
                        border: '1px solid rgba(148, 163, 184, 0.15)',
                        padding: '20px',
                        marginBottom: '20px',
                    }}
                >
                    <div
                        style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                            marginBottom: '16px',
                        }}
                    >
                        {t('quality_impact.new_experiment') ?? 'New Experiment'}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <input
                            placeholder={
                                t('quality_impact.experiment_name_placeholder') ?? 'Experiment name'
                            }
                            value={expName}
                            onChange={(e) => setExpName(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                background: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '8px',
                                color: 'var(--slate-200)',
                                fontSize: '13px',
                            }}
                        />
                        <input
                            placeholder={t('quality_impact.sessions_placeholder') ?? 'Sessions'}
                            value={expSessions}
                            onChange={(e) => setExpSessions(e.target.value)}
                            type="number"
                            min="1"
                            max="100"
                            style={{
                                width: '100px',
                                padding: '8px 12px',
                                background: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '8px',
                                color: 'var(--slate-200)',
                                fontSize: '13px',
                            }}
                        />
                    </div>
                    <div style={{ maxHeight: '240px', overflow: 'auto', marginBottom: '16px' }}>
                        {(['P0', 'P1', 'P2'] as const).map((cat) => {
                            const techs = allTechniques.filter((tt) => tt.category === cat);
                            if (techs.length === 0) return null;
                            const catColor =
                                cat === 'P0' ? '#ef4444' : cat === 'P1' ? '#f59e0b' : '#3b82f6';
                            return (
                                <div key={cat} style={{ marginBottom: '8px' }}>
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            color: catColor,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            marginBottom: '6px',
                                        }}
                                    >
                                        {cat} — {techs.length}{' '}
                                        {t('quality_impact.techniques').toLowerCase()}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {techs.map((tech) => (
                                            <label
                                                key={tech.id}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    background: selectedTechs[tech.id]
                                                        ? `${catColor}20`
                                                        : 'rgba(15, 23, 42, 0.3)',
                                                    border: `1px solid ${selectedTechs[tech.id] ? catColor : 'transparent'}`,
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    color: selectedTechs[tech.id]
                                                        ? '#e2e8f0'
                                                        : '#94a3b8',
                                                    transition: 'all 0.1s',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedTechs[tech.id]}
                                                    onChange={() => toggleTech(tech.id)}
                                                    style={{ accentColor: catColor }}
                                                />
                                                {tech.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={
                            !expName.trim() ||
                            Object.values(selectedTechs).filter(Boolean).length === 0
                        }
                        style={{
                            padding: '8px 20px',
                            background: 'var(--accent)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '13px',
                            opacity:
                                !expName.trim() ||
                                Object.values(selectedTechs).filter(Boolean).length === 0
                                    ? 0.5
                                    : 1,
                        }}
                    >
                        {t('quality_impact.start_experiment') ?? 'Start Experiment'}
                    </button>
                </div>
            )}

            <div style={tableContainerStyle}>
                {experiments.length === 0 && !showCreate && (
                    <div style={emptyStyle}>
                        {t('quality_impact.no_experiments') ??
                            'No experiments yet. Create one to A/B test technique impact.'}
                    </div>
                )}
                {experiments.length > 0 && (
                    <>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1.5fr 100px',
                                padding: '12px 20px',
                                background: 'rgba(15, 23, 42, 0.5)',
                                borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--slate-500)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            <span>{t('quality_impact.experiment_name') ?? 'Name'}</span>
                            <span>{t('quality_impact.experiment_techniques') ?? 'Techniques'}</span>
                            <span>{t('quality_impact.experiment_progress') ?? 'Progress'}</span>
                            <span>{t('quality_impact.experiment_status') ?? 'Status'}</span>
                            <span></span>
                        </div>
                        {experiments.map((exp) => (
                            <React.Fragment key={exp.id}>
                                <div
                                    style={expRowStyle}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                        setExpandedExp(expandedExp === exp.id ? null : exp.id)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setExpandedExp(expandedExp === exp.id ? null : exp.id);
                                        }
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.background =
                                            'rgba(148, 163, 184, 0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background =
                                            'transparent';
                                    }}
                                >
                                    <span style={{ fontWeight: 500, color: 'var(--slate-200)' }}>
                                        {exp.name}
                                    </span>
                                    <span style={{ color: 'var(--slate-400)' }}>
                                        {exp.techniqueIds.length} techniques
                                    </span>
                                    <span style={{ color: 'var(--slate-400)' }}>
                                        {exp.sessionsCompleted}/{exp.sessionsPlanned}
                                    </span>
                                    <span>
                                        <span
                                            style={badgeStyle(
                                                STATUS_COLOR[exp.status] ?? '#6b7280',
                                            )}
                                        >
                                            {exp.status}
                                        </span>
                                    </span>
                                    <span
                                        style={{
                                            display: 'flex',
                                            gap: '6px',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {exp.status === 'running' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStop(exp.id);
                                                }}
                                                style={{
                                                    padding: '4px 10px',
                                                    background: 'rgba(245, 158, 11, 0.15)',
                                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                                    borderRadius: '6px',
                                                    color: 'var(--warning)',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {t('quality_impact.stop') ?? 'Stop'}
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(exp.id);
                                            }}
                                            style={{
                                                padding: '4px 10px',
                                                background: 'rgba(239, 68, 68, 0.15)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '6px',
                                                color: 'var(--error)',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {t('quality_impact.delete') ?? 'Delete'}
                                        </button>
                                        <span
                                            style={{
                                                color: 'var(--slate-500)',
                                                fontSize: '16px',
                                                marginLeft: '4px',
                                            }}
                                        >
                                            {expandedExp === exp.id ? '−' : '+'}
                                        </span>
                                    </span>
                                </div>
                                {expandedExp === exp.id && (
                                    <div
                                        style={{
                                            padding: '16px 20px 16px 40px',
                                            background: 'rgba(15, 23, 42, 0.3)',
                                            borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
                                            fontSize: '13px',
                                            color: 'var(--slate-300)',
                                        }}
                                    >
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>Created:</strong>{' '}
                                            {new Date(exp.createdAt).toLocaleString()}
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>Techniques:</strong>{' '}
                                            {exp.techniqueIds.join(', ')}
                                        </div>
                                        {exp.result && (
                                            <div style={{ marginTop: '12px' }}>
                                                <div
                                                    style={{
                                                        fontWeight: 600,
                                                        color: 'var(--slate-200)',
                                                        marginBottom: '8px',
                                                    }}
                                                >
                                                    {t('quality_impact.results') ?? 'Results'}
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                                                        gap: '8px',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                            color: 'var(--slate-500)',
                                                        }}
                                                    >
                                                        Technique
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                            color: 'var(--slate-500)',
                                                        }}
                                                    >
                                                        Avg ON
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                            color: 'var(--slate-500)',
                                                        }}
                                                    >
                                                        Avg OFF
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                            color: 'var(--slate-500)',
                                                        }}
                                                    >
                                                        Sessions
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                            color: 'var(--slate-500)',
                                                        }}
                                                    >
                                                        Confidence
                                                    </div>
                                                    {exp.result.techniqueResults.map((r) => (
                                                        <React.Fragment key={r.techniqueId}>
                                                            <div style={{ color: 'var(--slate-200)' }}>
                                                                {r.techniqueId}
                                                            </div>
                                                            <div style={deltaStyle(r.avgScoreOn)}>
                                                                {(r.avgScoreOn * 100).toFixed(1)}%
                                                            </div>
                                                            <div style={deltaStyle(r.avgScoreOff)}>
                                                                {(r.avgScoreOff * 100).toFixed(1)}%
                                                            </div>
                                                            <div style={{ color: 'var(--slate-400)' }}>
                                                                {r.sessionsOn + r.sessionsOff}
                                                            </div>
                                                            <div>
                                                                <span
                                                                    style={badgeStyle(
                                                                        CONFIDENCE_COLOR[
                                                                            r.confidence
                                                                        ] ?? '#6b7280',
                                                                    )}
                                                                >
                                                                    {PRETTY_CONFIDENCE[
                                                                        r.confidence
                                                                    ] ?? r.confidence}
                                                                </span>
                                                            </div>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </>
                )}
            </div>
        </>
    );
};

export default ExperimentsTab;
