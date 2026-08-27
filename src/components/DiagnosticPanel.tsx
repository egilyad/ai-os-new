import React, { useState, useCallback } from 'react';
import { usePolling } from './Common/usePolling';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Crosshair,
    MessageCircle,
    RefreshCw,
    Search,
    Shield,
    Zap,
    Loader2,
    Clock,
    Globe,
} from 'lucide-react';
import { diagnosticService, kernel } from '../kernel/instances';
import { rootLogger } from '../kernel/instances';
import { useTranslation } from '../i18n/useTranslation';
import ModuleInfo from './ModuleInfo';
import { getStatusColor } from './Common/status-vocabulary';
import type { SystemDiagnostic, DiagnosticRunRecord, CognitiveIssue } from '../kernel/instances';
import type { SystemState } from '../types/metrics';

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
    critical: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
    high: { bg: 'rgba(249,115,22,0.12)', text: '#f97316' },
    medium: { bg: 'rgba(234,179,8,0.12)', text: '#eab308' },
    low: { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
};

const CARD: React.CSSProperties = {
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 12,
    padding: '1rem',
    backdropFilter: 'blur(12px)',
};

const DiagnosticPanel: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- i18n reserved for future use
    const { t: _t } = useTranslation();
    const [diagnostic, setDiagnostic] = useState<SystemDiagnostic | null>(null);
    const [history, setHistory] = useState<DiagnosticRunRecord[]>([]);
    const [issues, setIssues] = useState<CognitiveIssue[]>([]);
    const [running, setRunning] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [sessionIssues, setSessionIssues] = useState<CognitiveIssue[]>([]);

    const [kernelState, setKernelState] = useState<SystemState>(() => kernel.getState());

    const refresh = useCallback(() => {
        try {
            setDiagnostic(diagnosticService.getSystemDiagnostic());
            setIssues(diagnosticService.getAllActiveIssues());
            setHistory(diagnosticService.getDiagnosticHistory(20));
            setKernelState(kernel.getState());
        } catch (e) {
            rootLogger.error('DiagnosticPanel', 'Refresh failed', { error: e });
        }
    }, []);

    usePolling(refresh, 15000);

    const handleRunDiagnostic = async () => {
        setRunning(true);
        try {
            await diagnosticService.runDiagnostic('system');
            refresh();
        } finally {
            setRunning(false);
        }
    };

    const handleLookupSession = () => {
        if (!sessionId.trim()) return;
        try {
            const diag = diagnosticService.getSessionDiagnostic(sessionId.trim());
            if (diag) {
                setSessionIssues(diag.issues);
            }
        } catch (e) {
            rootLogger.warn('DiagnosticPanel', 'Session lookup failed', {
                sessionId: sessionId.trim(),
                error: e,
            });
        }
    };

    const healthColor = getStatusColor(diagnostic?.health || 'error');

    return (
        <div
            style={{
                padding: 20,
                maxWidth: 1400,
                margin: '0 auto',
                height: '100%',
                overflowY: 'auto',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Crosshair size={22} color="#10b981" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>System Diagnostics</h2>
            </div>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                System-wide health diagnostics, active issues, and diagnostic history
            </p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                <div style={{ ...CARD, borderLeft: `3px solid ${healthColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Shield size={16} color={healthColor} />
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--slate-500)',
                            }}
                        >
                            System Health
                        </span>
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: healthColor }}>
                        {diagnostic?.health || '—'}
                    </div>
                    {diagnostic && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                            Score: {(diagnostic.score * 100).toFixed(0)}%
                        </div>
                    )}
                </div>

                <div style={CARD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Activity size={16} color="#3b82f6" />
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--slate-500)',
                            }}
                        >
                            Counts
                        </span>
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 4,
                            fontSize: '0.75rem',
                        }}
                    >
                        <span style={{ color: 'var(--slate-500)' }}>Sessions</span>
                        <span style={{ color: 'var(--slate-300)' }}>{diagnostic?.sessionCount ?? 0}</span>
                        <span style={{ color: 'var(--slate-500)' }}>Providers</span>
                        <span style={{ color: 'var(--slate-300)' }}>{diagnostic?.providerCount ?? 0}</span>
                        <span style={{ color: 'var(--slate-500)' }}>Active Issues</span>
                        <span
                            style={{
                                color:
                                    (diagnostic?.activeIssueCount ?? 0) > 0 ? '#ef4444' : '#22c55e',
                            }}
                        >
                            {diagnostic?.activeIssueCount ?? 0}
                        </span>
                    </div>
                </div>

                <div style={CARD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Zap size={16} color="#f59e0b" />
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--slate-500)',
                            }}
                        >
                            Actions
                        </span>
                    </div>
                    <button
                        onClick={handleRunDiagnostic}
                        disabled={running}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: 'rgba(16,185,129,0.2)',
                            color: 'var(--success)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            width: '100%',
                            justifyContent: 'center',
                            opacity: running ? 0.5 : 1,
                        }}
                    >
                        {running ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}{' '}
                        Run Diagnostic
                    </button>
                </div>

                <div style={CARD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <MessageCircle size={16} color="#a855f7" />
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--slate-500)',
                            }}
                        >
                            Session Lookup
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <input
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            placeholder="Session ID..."
                            style={{
                                flex: 1,
                                padding: '0.4rem 0.6rem',
                                borderRadius: 6,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(148,163,184,0.15)',
                                color: 'var(--slate-200)',
                                fontSize: '0.75rem',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleLookupSession}
                            style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: 6,
                                border: 'none',
                                cursor: 'pointer',
                                background: 'rgba(168,85,247,0.2)',
                                color: '#a855f7',
                            }}
                        >
                            <Search size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Kernel State Cross-Reference: provider health from router metrics */}
            {Object.keys(kernelState.providers).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Globe size={14} color="#3b82f6" />
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--slate-500)',
                            }}
                        >
                            Router Provider Health (kernel state)
                        </span>
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: 8,
                        }}
                    >
                        {Object.values(kernelState.providers).map((p) => {
                            const color =
                                p.status === 'healthy'
                                    ? '#22c55e'
                                    : p.status === 'degraded'
                                      ? '#f59e0b'
                                      : '#ef4444';
                            return (
                                <div
                                    key={p.id}
                                    style={{
                                        ...CARD,
                                        borderLeft: `3px solid ${color}`,
                                        padding: '0.6rem 0.75rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 4,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                fontSize: '0.8rem',
                                                color: 'var(--slate-200)',
                                            }}
                                        >
                                            {p.id}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '0.6rem',
                                                fontWeight: 700,
                                                color,
                                                background: `${color}18`,
                                                padding: '0.1rem 0.4rem',
                                                borderRadius: 4,
                                            }}
                                        >
                                            {p.status}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 12,
                                            fontSize: '0.65rem',
                                            color: 'var(--slate-400)',
                                        }}
                                    >
                                        <span>TTFT: {p.avgTTFT.toFixed(0)}ms</span>
                                        <span>TPS: {p.avgTPS.toFixed(1)}</span>
                                        <span>Rel: {(p.reliability * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', marginTop: 6 }}>
                        From router EWMA metrics (kernel state) — may differ from diagnostic scan
                        results
                    </div>
                </div>
            )}

            {issues.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <AlertTriangle size={14} color="#ef4444" />
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--error)',
                            }}
                        >
                            Active Issues ({issues.length})
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {issues.map((issue, _i) => {
                            const sc = (SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.medium)!;
                            return (
                                <div
                                    key={`${issue.severity}-${issue.message?.substring(0, 20)}`}
                                    style={{
                                        ...CARD,
                                        borderLeft: `3px solid ${sc.text}`,
                                        padding: '0.6rem 0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <span style={{ ...BADGE, background: sc.bg, color: sc.text }}>
                                        {issue.severity}
                                    </span>
                                    <span
                                        style={{
                                            ...BADGE,
                                            background: 'var(--purple-tint)',
                                            color: 'var(--purple-muted)',
                                        }}
                                    >
                                        {issue.type}
                                    </span>
                                    <span
                                        style={{ fontSize: '0.75rem', color: 'var(--slate-300)', flex: 1 }}
                                    >
                                        {issue.message}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                                        {new Date(issue.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {issues.length === 0 && (
                <div
                    style={{
                        ...CARD,
                        marginBottom: 20,
                        textAlign: 'center',
                        padding: 24,
                        borderColor: 'rgba(34,197,94,0.2)',
                    }}
                >
                    <CheckCircle2 size={24} color="#22c55e" style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                        All systems operational
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        No active issues detected
                    </div>
                </div>
            )}

            {sessionIssues.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <MessageCircle size={14} color="#a855f7" />
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--slate-500)',
                            }}
                        >
                            Session Issues ({sessionId.slice(0, 12)})
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {sessionIssues.map((issue, _i) => {
                            const sc = (SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.medium)!;
                            return (
                                <div
                                    key={`${issue.severity}-${issue.message?.substring(0, 20)}`}
                                    style={{
                                        ...CARD,
                                        borderLeft: `3px solid ${sc.text}`,
                                        padding: '0.6rem 0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <span style={{ ...BADGE, background: sc.bg, color: sc.text }}>
                                        {issue.severity}
                                    </span>
                                    <span
                                        style={{
                                            ...BADGE,
                                            background: 'var(--purple-tint)',
                                            color: 'var(--purple-muted)',
                                        }}
                                    >
                                        {issue.type}
                                    </span>
                                    <span
                                        style={{ fontSize: '0.75rem', color: 'var(--slate-300)', flex: 1 }}
                                    >
                                        {issue.message}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {history.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Clock size={14} color="#64748b" />
                        <span
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: 'var(--slate-500)',
                            }}
                        >
                            Diagnostic History
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {history.map((r, _i) => (
                            <div
                                key={r.id}
                                style={{
                                    ...CARD,
                                    padding: '0.5rem 0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: '0.75rem',
                                }}
                            >
                                <span style={{ color: 'var(--slate-500)', width: 80 }}>
                                    {new Date(r.timestamp).toLocaleTimeString()}
                                </span>
                                <span
                                    style={{
                                        ...BADGE,
                                        background: `${getStatusColor(r.health || 'error')}1f`,
                                        color: getStatusColor(r.health || 'error'),
                                    }}
                                >
                                    {r.health}
                                </span>
                                <span style={{ color: 'var(--slate-400)' }}>
                                    Score: {(r.score * 100).toFixed(0)}%
                                </span>
                                <span style={{ color: 'var(--slate-500)' }}>{r.issueCount} issues</span>
                                <span style={{ color: 'var(--slate-600)', fontSize: '0.65rem' }}>
                                    {r.scope}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ModuleInfo
                moduleKey="diagnostics"
                relatedModules={['health', 'debate_runtime', 'pressure_map']}
            />
        </div>
    );
};

const BADGE: React.CSSProperties = {
    padding: '0.15rem 0.4rem',
    borderRadius: 4,
    fontSize: '0.6rem',
    fontWeight: 600,
};

export default DiagnosticPanel;
