import { Cpu, Play, RotateCcw, Loader2 } from 'lucide-react';
import { glassCard, flexBetweenMb1, flexCenterGap2 } from '../../styles/common';

interface Props {
    availableModels: string[];
    modelTestResults: Record<string, { status: string; latency: number; error?: string }> | null;
    modelTesting: boolean;
    refreshingModels: boolean;
    onRefreshModels: () => void;
    onTestAll: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const ModelTestSection: React.FC<Props> = ({
    availableModels,
    modelTestResults,
    modelTesting,
    refreshingModels,
    onRefreshModels,
    onTestAll,
    t,
}) => {
    const hasWorkingModel =
        modelTestResults && Object.values(modelTestResults).some((r) => r.status === 'ok');

    const btnRefresh = {
        padding: '0.2rem 0.5rem',
        fontSize: '0.65rem',
        borderRadius: 6,
        background: 'rgba(59,130,246,0.12)',
        border: '1px solid rgba(59,130,246,0.2)',
        color: 'var(--accent)',
        cursor: refreshingModels ? 'wait' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
    } as const;

    const btnTest = {
        padding: '0.2rem 0.5rem',
        fontSize: '0.65rem',
        borderRadius: 6,
        background: 'rgba(168,85,247,0.15)',
        border: '1px solid rgba(168,85,247,0.25)',
        color: '#a855f7',
        cursor: modelTesting ? 'wait' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
    } as const;

    return (
        <div style={glassCard}>
            <div style={flexBetweenMb1}>
                <div style={flexCenterGap2}>
                    <Cpu size={14} color="#a855f7" aria-hidden="true" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {t('overview.available_models')}
                    </span>
                </div>
                <div style={flexCenterGap2}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {t('overview.models_count', { count: availableModels.length })}
                    </span>
                    <button
                        onClick={onRefreshModels}
                        disabled={refreshingModels}
                        style={btnRefresh}
                        title="Refresh model list from provider API"
                    >
                        {refreshingModels ? (
                            <Loader2 size={12} className="provider-spin" />
                        ) : (
                            <RotateCcw size={12} />
                        )}
                    </button>
                    <button
                        onClick={onTestAll}
                        disabled={modelTesting || !availableModels.length}
                        style={btnTest}
                        title="Quick Test All Models"
                    >
                        {modelTesting ? (
                            <Loader2 size={12} className="provider-spin" />
                        ) : (
                            <Play size={12} />
                        )}{' '}
                        {modelTesting ? 'Testing...' : 'Test All'}
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {availableModels.slice(0, 8).map((m) => {
                    const mr = modelTestResults?.[m];
                    const borderColor = mr
                        ? mr.status === 'ok'
                            ? '#10b981'
                            : mr.status === 'testing'
                              ? '#a855f7'
                              : '#ef4444'
                        : 'rgba(255,255,255,0.05)';
                    return (
                        <span
                            key={m}
                            style={{
                                padding: '0.2rem 0.5rem',
                                background: mr
                                    ? mr.status === 'ok'
                                        ? 'rgba(16,185,129,0.1)'
                                        : mr.status === 'testing'
                                          ? 'rgba(168,85,247,0.1)'
                                          : 'rgba(239,68,68,0.1)'
                                    : 'rgba(255,255,255,0.05)',
                                borderRadius: 4,
                                fontSize: '0.65rem',
                                color: mr
                                    ? mr.status === 'ok'
                                        ? '#10b981'
                                        : mr.status === 'testing'
                                          ? '#a855f7'
                                          : '#ef4444'
                                    : 'var(--text-muted)',
                                border: `1px solid ${borderColor}`,
                                transition: 'all 0.2s',
                            }}
                            title={mr?.error ? mr.error : mr ? `${mr.latency}ms` : m}
                        >
                            {m.split('/').pop()}
                            {mr && mr.status === 'testing' && (
                                <span style={{ marginLeft: 4 }}>⋯</span>
                            )}
                            {mr && mr.status === 'ok' && (
                                <span style={{ marginLeft: 4, opacity: 0.6 }}>{mr.latency}ms</span>
                            )}
                            {mr && mr.status === 'error' && (
                                <span style={{ marginLeft: 4 }}>✕</span>
                            )}
                        </span>
                    );
                })}
                {availableModels.length > 8 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent)', alignSelf: 'center' }}>
                        {t('overview.models_more', { count: availableModels.length - 8 })}
                    </span>
                )}
            </div>
            {modelTestResults && !modelTesting && (
                <div
                    style={{
                        marginTop: 8,
                        fontSize: '0.7rem',
                        color: hasWorkingModel ? '#10b981' : '#ef4444',
                    }}
                >
                    {hasWorkingModel
                        ? `${Object.values(modelTestResults).filter((r) => r.status === 'ok').length}/${Object.keys(modelTestResults).length} models working`
                        : 'All models failed'}
                </div>
            )}
        </div>
    );
};

export default ModelTestSection;
