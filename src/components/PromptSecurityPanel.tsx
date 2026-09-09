import React, { useState, useEffect, useCallback } from 'react';
import { promptSecurityService } from '../kernel/instances';
import { useTranslation } from '../i18n/useTranslation';
import { Shield, ShieldAlert, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react';
import type {
    SecurityScanEvent,
    SecurityScanConfig,
} from '../kernel/contracts/prompt-security-types';

const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.08)',
};

const SEVERITY_COLORS: Record<string, string> = {
    low: '#94a3b8',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
};

const CATEGORY_COLORS: Record<string, string> = {
    injection: '#f97316',
    pii: '#ef4444',
    extraction: '#a855f7',
    dangerous: '#dc2626',
    jailbreak: '#dc2626',
};

const PromptSecurityPanel: React.FC = () => {
    const { t } = useTranslation();
    const [testPrompt, setTestPrompt] = useState('');
    const [scanResult, setScanResult] = useState<ReturnType<
        typeof promptSecurityService.scan
    > | null>(null);
    const [history, setHistory] = useState<SecurityScanEvent[]>([]);
    const [config, setConfig] = useState<SecurityScanConfig>(promptSecurityService.getConfig());
    const [expandedFinding, setExpandedFinding] = useState<number | null>(null);

    const loadHistory = useCallback(async () => {
        setHistory(await promptSecurityService.getHistory());
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const handleScan = () => {
        if (!testPrompt.trim()) return;
        const result = promptSecurityService.scan(testPrompt.trim());
        setScanResult(result);
        promptSecurityService.addEvent({
            prompt: testPrompt.trim(),
            result,
            timestamp: Date.now(),
            blocked: !result.safe,
        });
        loadHistory();
    };

    const isDangerous = scanResult && !scanResult.safe;

    return (
        <div
            style={{
                padding: '2rem',
                maxWidth: 1000,
                margin: '0 auto',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShieldAlert size={28} style={{ color: '#a855f7' }} />
                <div>
                    <h2
                        style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-200)' }}
                    >
                        {t('security.title')}
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                        {t('security.subtitle')}
                    </p>
                </div>
            </div>

            <div style={card}>
                <h3
                    style={{
                        margin: '0 0 8px',
                        fontSize: '0.9rem',
                        color: 'var(--slate-400)',
                        fontWeight: 600,
                    }}
                >
                    {t('security.test_label')}
                </h3>
                <textarea
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    placeholder={t('security.test_placeholder')}
                    rows={4}
                    style={{
                        width: '100%',
                        padding: 10,
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--slate-200)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        fontFamily: 'monospace',
                        resize: 'vertical',
                    }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                        onClick={handleScan}
                        disabled={!testPrompt.trim()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 20px',
                            borderRadius: 8,
                            background: testPrompt.trim()
                                ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                                : 'rgba(255,255,255,0.05)',
                            border: 'none',
                            color: testPrompt.trim() ? '#fff' : '#64748b',
                            cursor: testPrompt.trim() ? 'pointer' : 'not-allowed',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                        }}
                    >
                        <Shield size={16} /> {t('security.scan')}
                    </button>
                </div>
            </div>

            {scanResult && (
                <div
                    style={{
                        ...card,
                        borderColor: isDangerous ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
                        background: isDangerous ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        {isDangerous ? (
                            <ShieldAlert size={20} style={{ color: 'var(--error)' }} />
                        ) : (
                            <ShieldCheck size={20} style={{ color: 'var(--success)' }} />
                        )}
                        <span
                            style={{
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: isDangerous ? '#ef4444' : '#22c55e',
                            }}
                        >
                            {scanResult.summary}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                            {t('security.score')}: {scanResult.score}/10
                        </span>
                    </div>
                    {scanResult.findings.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {scanResult.findings.map((f, i) => (
                                <div
                                    key={f.message}
                                    onClick={() =>
                                        setExpandedFinding(expandedFinding === i ? null : i)
                                    }
                                    style={{
                                        padding: '8px 12px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        borderLeft: `3px solid ${SEVERITY_COLORS[f.severity] || '#64748b'}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <AlertTriangle
                                            size={12}
                                            style={{ color: SEVERITY_COLORS[f.severity] }}
                                        />
                                        <span
                                            style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                color: 'var(--slate-200)',
                                            }}
                                        >
                                            {f.message}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '0.65rem',
                                                padding: '1px 6px',
                                                borderRadius: 8,
                                                background: `${CATEGORY_COLORS[f.category] || '#64748b'}20`,
                                                color: CATEGORY_COLORS[f.category] || '#64748b',
                                            }}
                                        >
                                            {f.category}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '0.65rem',
                                                padding: '1px 6px',
                                                borderRadius: 8,
                                                background: `${SEVERITY_COLORS[f.severity]}20`,
                                                color: SEVERITY_COLORS[f.severity],
                                                marginLeft: 'auto',
                                            }}
                                        >
                                            {f.severity}
                                        </span>
                                    </div>
                                    {expandedFinding === i && (
                                        <div
                                            style={{
                                                marginTop: 6,
                                                fontSize: '0.75rem',
                                                color: 'var(--slate-500)',
                                            }}
                                        >
                                            <div>
                                                <span style={{ color: 'var(--slate-400)' }}>Match: </span>
                                                <code
                                                    style={{
                                                        color: '#f87171',
                                                        background: 'rgba(0,0,0,0.2)',
                                                        padding: '1px 4px',
                                                        borderRadius: 4,
                                                    }}
                                                >
                                                    {f.match}
                                                </code>
                                            </div>
                                            {f.position && (
                                                <div style={{ marginTop: 2 }}>
                                                    <span style={{ color: 'var(--slate-400)' }}>
                                                        Position:{' '}
                                                    </span>
                                                    char {f.position.start}-{f.position.end}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={card}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: '0.9rem',
                                color: 'var(--slate-400)',
                                fontWeight: 600,
                            }}
                        >
                            {t('security.config')}
                        </h3>
                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '0.78rem',
                                color: 'var(--slate-500)',
                                cursor: 'pointer',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={config.enabled}
                                onChange={() => {
                                    const next = !config.enabled;
                                    promptSecurityService.updateConfig({ enabled: next });
                                    setConfig(promptSecurityService.getConfig());
                                }}
                                style={{ accentColor: '#a855f7' }}
                            />
                            {t('security.enabled')}
                        </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                            {t('security.block_score')}:
                        </span>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={config.blockOnScore}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                promptSecurityService.updateConfig({ blockOnScore: val });
                                setConfig(promptSecurityService.getConfig());
                            }}
                            style={{ flex: 1, accentColor: '#a855f7' }}
                        />
                        <span
                            style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: 'var(--slate-200)',
                                minWidth: 24,
                            }}
                        >
                            {config.blockOnScore}
                        </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>
                        {config.rules.filter((r) => r.enabled).length}/{config.rules.length}{' '}
                        {t('security.rules_active')}
                    </div>
                </div>

                <div style={card}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: '0.9rem',
                                color: 'var(--slate-400)',
                                fontWeight: 600,
                            }}
                        >
                            {t('security.history')} ({history.length})
                        </h3>
                        {history.length > 0 && (
                            <button
                                onClick={async () => {
                                    await promptSecurityService.clearHistory();
                                    loadHistory();
                                }}
                                style={{
                                    padding: 4,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--slate-500)',
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            maxHeight: 200,
                            overflowY: 'auto',
                        }}
                    >
                        {history.length === 0 && (
                            <div
                                style={{
                                    fontSize: '0.78rem',
                                    color: 'var(--slate-600)',
                                    textAlign: 'center',
                                    padding: '1rem',
                                }}
                            >
                                {t('security.no_history')}
                            </div>
                        )}
                        {history.slice(0, 20).map((event, i) => (
                            <div
                                key={event.timestamp ?? i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '4px 8px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: 6,
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-500)',
                                }}
                            >
                                {event.blocked ? (
                                    <ShieldAlert
                                        size={12}
                                        style={{ color: 'var(--error)', flexShrink: 0 }}
                                    />
                                ) : (
                                    <ShieldCheck
                                        size={12}
                                        style={{ color: 'var(--success)', flexShrink: 0 }}
                                    />
                                )}
                                <span
                                    style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {event.prompt}
                                </span>
                                <span style={{ color: 'var(--slate-600)', flexShrink: 0 }}>
                                    {event.result.score}/10
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptSecurityPanel;
