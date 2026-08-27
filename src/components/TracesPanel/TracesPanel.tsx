import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Activity, ZoomIn, Search, Cpu, Radio, Clock, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '../../kernel/instances';
import type { CognitiveTrace } from '../../kernel/instances';
import { cognitiveService } from '../../kernel/instances';
import TraceDebugger from './TraceDebugger';
import TopologyTraceView from './TopologyTraceView';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { emptyStateFlex } from '../../styles/common';
import { getStatusColor } from '../Common/status-vocabulary';

function traceMatchesDiagnostic(trace: CognitiveTrace, q: string): boolean {
    const diag = trace?.metadata?.diagnostics as
        { issues?: Array<{ type?: string; message?: string }> } | undefined;
    if (!diag?.issues?.length) return false;
    return diag.issues.some(
        (i) =>
            (typeof i.type === 'string' && i.type.toLowerCase().includes(q)) ||
            (typeof i.message === 'string' && i.message.toLowerCase().includes(q)),
    );
}

const TracesPanel: React.FC = () => {
    const { t } = useTranslation();
    const [traces, setTraces] = useState<CognitiveTrace[]>(cognitiveService.getTraces());
    const [selectedTrace, setSelectedTrace] = useState<CognitiveTrace | null>(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(traces.length === 0);
    const [error, setError] = useState<string | null>(null);
    const [showLiveTopology, setShowLiveTopology] = useState(false);

    const isMountedRef = useRef(true);
    const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearError = useAutoClearError(setError);

    useEffect(() => {
        isMountedRef.current = true;
        const sub = eventBus.onSafe<CognitiveTrace[]>('trace:updated', (data) => {
            if (!isMountedRef.current) return;
            setTraces(data);
            setIsLoading(false);
            setError(null);
        });
        loadingTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) setIsLoading(false);
        }, 3000);
        return () => {
            isMountedRef.current = false;
            sub();
            if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
        };
    }, []);

    const stats = useMemo(() => {
        const total = traces.length;
        const completed = traces.filter((t) => t.status === 'completed').length;
        const failed = traces.filter((t) => t.status === 'failed').length;
        const running = traces.filter((t) => t.status === 'running').length;
        const avgConfidence =
            total > 0 ? traces.reduce((s, t) => s + t.semanticConfidence, 0) / total : 0;
        return { total, completed, failed, running, avgConfidence };
    }, [traces]);

    const deleteTrace = useCallback(
        (id: string) => {
            try {
                cognitiveService.deleteTrace(id);
                const updated = traces.filter((t) => t.id !== id);
                if (isMountedRef.current) {
                    setTraces(updated);
                    setError(null);
                }
            } catch (err) {
                console.warn('[TracesPanel] Failed to delete trace:', err);
                if (isMountedRef.current) {
                    setError('Failed to delete trace');
                    clearError();
                }
            }
        },
        [traces, clearError],
    );

    const handleSelectTrace = useCallback((trace: CognitiveTrace) => {
        if (!isMountedRef.current) return;
        setSelectedTrace(trace);
    }, []);

    const filteredTraces = traces.filter((t) => {
        if (filter !== 'all' && t.status !== filter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const baseMatch =
                t.input.toLowerCase().includes(q) || t.traceId.toLowerCase().includes(q);
            if (!baseMatch && !traceMatchesDiagnostic(t, q)) return false;
        }
        return true;
    });

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                position: 'relative',
            }}
        >
            <AnimatePresence>
                {selectedTrace && (
                    <TraceDebugger trace={selectedTrace} onClose={() => setSelectedTrace(null)} />
                )}
            </AnimatePresence>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '1.5rem',
                }}
            >
                <div>
                    <h2
                        style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            margin: '0 0 0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            color: 'var(--slate-50)',
                        }}
                    >
                        <Activity size={28} color="#a855f7" aria-hidden="true" />{' '}
                        {t('traces.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('traces.subtitle')}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowLiveTopology((v) => !v)}
                        style={{
                            padding: '0.6rem 1rem',
                            borderRadius: 10,
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: showLiveTopology
                                ? 'rgba(16,185,129,0.15)'
                                : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${showLiveTopology ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            color: showLiveTopology ? '#10b981' : '#e2e8f0',
                        }}
                    >
                        <Radio size={16} /> Live
                    </button>
                    <div style={{ position: 'relative', width: 320 }}>
                        <Search
                            size={16}
                            style={{
                                position: 'absolute',
                                left: 14,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--slate-500)',
                            }}
                            aria-hidden="true"
                        />
                        <input
                            type="text"
                            placeholder={t('traces.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem 0.85rem 2.75rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: 12,
                                color: 'white',
                                fontSize: '0.9rem',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#a855f7')}
                            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.05)')}
                            aria-label={t('common.aria.search')}
                        />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '0.4rem',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                        role="tablist"
                        aria-label={t('common.aria.filter')}
                    >
                        {['all', 'running', 'completed', 'failed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                role="tab"
                                aria-selected={filter === f}
                                style={{
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: 10,
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    background:
                                        filter === f
                                            ? f === 'completed'
                                                ? 'rgba(16,185,129,0.15)'
                                                : f === 'failed'
                                                  ? 'rgba(239,68,68,0.15)'
                                                  : f === 'running'
                                                    ? 'rgba(59,130,246,0.15)'
                                                    : 'rgba(255,255,255,0.1)'
                                            : 'transparent',
                                    color:
                                        filter === f
                                            ? f === 'completed'
                                                ? '#10b981'
                                                : f === 'failed'
                                                  ? '#ef4444'
                                                  : f === 'running'
                                                    ? '#60a5fa'
                                                    : 'white'
                                            : '#64748b',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {[
                    { label: t('traces.total'), value: stats.total, color: '#a855f7' },
                    { label: t('traces.completed'), value: stats.completed, color: 'var(--success)' },
                    { label: t('traces.failed'), value: stats.failed, color: 'var(--error)' },
                    {
                        label: t('traces.avg_confidence'),
                        value: `${Math.round(stats.avgConfidence * 100)}%`,
                        color: 'var(--accent)',
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        style={{
                            padding: '1rem 1.25rem',
                            borderRadius: 12,
                            border: `1px solid ${stat.color}22`,
                            background: `linear-gradient(135deg, ${stat.color}0A 0%, rgba(0,0,0,0) 100%)`,
                            backdropFilter: 'blur(10px)',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: 'var(--slate-400)',
                                textTransform: 'uppercase',
                                fontWeight: 800,
                                marginBottom: '0.25rem',
                                letterSpacing: '0.05em',
                            }}
                        >
                            {stat.label}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--error-tint)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 10,
                            color: '#fca5a5',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                        role="alert"
                        aria-live="polite"
                    >
                        <AlertTriangle size={14} aria-hidden="true" /> {error}
                        <button
                            onClick={() => setError(null)}
                            style={{
                                cursor: 'pointer',
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                color: 'inherit',
                            }}
                            aria-label={t('common.dismiss_error')}
                        >
                            <X size={14} aria-hidden="true" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {showLiveTopology && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{
                        borderRadius: 16,
                        border: '1px solid rgba(16,185,129,0.2)',
                        background: 'rgba(16,185,129,0.03)',
                        padding: '1rem',
                        overflow: 'hidden',
                    }}
                >
                    <TopologyTraceView />
                </motion.div>
            )}

            <div
                style={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 24,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <div
                    style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(0,0,0,0.3)',
                        display: 'grid',
                        gridTemplateColumns: '150px 1fr 140px 120px 180px 100px',
                        gap: '1.5rem',
                        color: 'var(--slate-500)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    <span>{t('traces.table.trace_id')}</span>
                    <span>{t('traces.header_input')}</span>
                    <span>{t('traces.table.status')}</span>
                    <span>{t('traces.table.steps')}</span>
                    <span>{t('traces.header_confidence')}</span>
                    <span style={{ textAlign: 'right' }}>{t('traces.table.actions')}</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <AnimatePresence>
                        {filteredTraces.map((trace) => (
                            <motion.div
                                key={trace.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                                    display: 'grid',
                                    gridTemplateColumns: '150px 1fr 140px 120px 180px 100px',
                                    gap: '1.5rem',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                }}
                                onClick={() => handleSelectTrace(trace)}
                                whileHover={{
                                    background: 'rgba(255,255,255,0.03)',
                                    boxShadow: 'inset 4px 0 0 #a855f7',
                                }}
                                role="row"
                                aria-label={`Trace ${trace.traceId}, status ${trace.status}`}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Activity size={16} color="#a855f7" aria-hidden="true" />
                                    <span
                                        style={{
                                            fontFamily: '"JetBrains Mono", monospace',
                                            fontSize: '0.9rem',
                                            color: '#a855f7',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {trace.traceId}
                                    </span>
                                </div>

                                <div style={{ overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: 'var(--slate-50)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {trace.input}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-400)',
                                            marginTop: '0.4rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontWeight: 500,
                                        }}
                                    >
                                        <Clock size={14} aria-hidden="true" />{' '}
                                        {new Date(trace.startTime).toLocaleTimeString()} •{' '}
                                        {trace.totalLatency}ms
                                        {trace.dataQuality?.tokenCount?.source === 'estimated' && (
                                            <span
                                                title={`Token count estimated by content length / ${trace.dataQuality.tokenCount.divisor ?? 4}; in-memory retention keeps newest ${trace.dataQuality.retention?.inMemoryLimit ?? 200} traces.`}
                                                style={{
                                                    padding: '0.1rem 0.35rem',
                                                    borderRadius: 4,
                                                    background: 'rgba(245,158,11,0.12)',
                                                    border: '1px solid rgba(245,158,11,0.2)',
                                                    color: 'var(--warning)',
                                                    fontSize: '0.62rem',
                                                    fontWeight: 800,
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                estimate
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        background: `${getStatusColor(trace.status)}15`,
                                        padding: '0.5rem 0.85rem',
                                        borderRadius: 20,
                                        width: 'fit-content',
                                        border: `1px solid ${getStatusColor(trace.status)}30`,
                                    }}
                                >
                                    <motion.div
                                        animate={
                                            trace.status === 'running'
                                                ? { opacity: [0.4, 1, 0.4] }
                                                : {}
                                        }
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1.5,
                                            ease: 'easeInOut',
                                        }}
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: getStatusColor(trace.status),
                                            boxShadow: `0 0 10px ${getStatusColor(trace.status)}`,
                                        }}
                                        aria-hidden="true"
                                    />
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            color: getStatusColor(trace.status),
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        {trace.status}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            color: 'var(--slate-300)',
                                        }}
                                    >
                                        <Cpu size={16} color="#64748b" aria-hidden="true" />{' '}
                                        {trace.steps.length}
                                    </div>
                                    {(() => {
                                        const diag = trace.metadata?.diagnostics as
                                            { activeIssueCount: number } | undefined;
                                        return diag?.activeIssueCount ? (
                                            <div
                                                title={t('traces.diagnostics')}
                                                style={{
                                                    background: 'rgba(239,68,68,0.12)',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: 8,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                    color: 'var(--error)',
                                                }}
                                            >
                                                <AlertTriangle
                                                    size={16}
                                                    color="#ef4444"
                                                    aria-hidden="true"
                                                />{' '}
                                                {diag.activeIssueCount}
                                            </div>
                                        ) : null;
                                    })()}
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.5rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                        }}
                                    >
                                        <span style={{ color: 'var(--slate-500)' }}>
                                            {t('traces.certainty_label')}
                                        </span>
                                        <span
                                            style={{
                                                color:
                                                    trace.semanticConfidence > 0.8
                                                        ? '#10b981'
                                                        : trace.semanticConfidence > 0.4
                                                          ? '#f59e0b'
                                                          : '#ef4444',
                                            }}
                                        >
                                            {Math.round(trace.semanticConfidence * 100)}%
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            height: 6,
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${trace.semanticConfidence * 100}%`,
                                                height: '100%',
                                                background:
                                                    trace.semanticConfidence > 0.8
                                                        ? '#10b981'
                                                        : trace.semanticConfidence > 0.4
                                                          ? '#f59e0b'
                                                          : '#ef4444',
                                                borderRadius: 3,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div
                                    style={{
                                        textAlign: 'right',
                                        display: 'flex',
                                        gap: 6,
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    <button
                                        style={{
                                            padding: '0.6rem',
                                            borderRadius: 10,
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            cursor: 'pointer',
                                        }}
                                        aria-label={t('traces.inspect_aria')}
                                    >
                                        <ZoomIn size={18} aria-hidden="true" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteTrace(trace.id);
                                        }}
                                        style={{
                                            padding: '0.6rem',
                                            borderRadius: 10,
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'var(--error)',
                                            cursor: 'pointer',
                                        }}
                                        aria-label={t('traces.delete_aria')}
                                    >
                                        <X size={18} aria-hidden="true" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isLoading && (
                        <div style={emptyStateFlex}>
                            <motion.div
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                            >
                                <Activity size={40} opacity={0.3} aria-hidden="true" />
                            </motion.div>
                            <span style={{ fontSize: '1rem', fontWeight: 600 }}>
                                {t('traces.loading')}
                            </span>
                        </div>
                    )}
                    {!isLoading && filteredTraces.length === 0 && (
                        <div style={emptyStateFlex}>
                            <Search size={40} opacity={0.3} aria-hidden="true" />
                            <span style={{ fontSize: '1rem', fontWeight: 600 }}>
                                {t('traces.empty')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <ModuleInfo moduleKey="traces" />
        </div>
    );
};

export default TracesPanel;
