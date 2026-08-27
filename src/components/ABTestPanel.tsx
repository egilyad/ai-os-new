/**
 * Cognitive-aux / research panel (Experimental).
 * A/B test harness — research-grade, not production surface (P1.21).
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { runABTest, getABTestHistory } from '../kernel/services/ab-test-service';
import { keyService, rootLogger } from '../kernel/instances';
const LOGGER = rootLogger.child('ABTestPanel');
import { useTranslation } from '../i18n/useTranslation';
import {
    GitCompare,
    Play,
    Loader2,
    Clock,
    DollarSign,
    FileText,
    BarChart3,
    History,
} from 'lucide-react';
import type {
    ABTestResult,
    ABTestHistory as ABTestHistoryEntry,
} from '../kernel/contracts/ab-test-types';

const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.08)',
};

const ABTestPanel: React.FC = () => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [providerA, setProviderA] = useState('');
    const [modelA, setModelA] = useState('');
    const [providerB, setProviderB] = useState('');
    const [modelB, setModelB] = useState('');
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<ABTestResult | null>(null);
    const [history, setHistory] = useState<ABTestHistoryEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [viewTab, setViewTab] = useState<'test' | 'history'>('test');

    const allKeys = useMemo(() => keyService.getKeys(), []);
    const providers = useMemo(() => [...new Set(allKeys.map((k) => k.provider))], [allKeys]);
    const modelsForA = useMemo(() => {
        if (!providerA) return [];
        return [
            ...new Set(
                allKeys
                    .filter((k) => k.provider === providerA)
                    .map((k) => k.model || '')
                    .filter(Boolean),
            ),
        ];
    }, [allKeys, providerA]);
    const modelsForB = useMemo(() => {
        if (!providerB) return [];
        return [
            ...new Set(
                allKeys
                    .filter((k) => k.provider === providerB)
                    .map((k) => k.model || '')
                    .filter(Boolean),
            ),
        ];
    }, [allKeys, providerB]);

    const loadHistory = useCallback(async () => {
        setHistory(await getABTestHistory());
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const handleRun = async () => {
        if (!prompt.trim() || !providerA || !modelA || !providerB || !modelB || running) return;
        setRunning(true);
        setResult(null);
        try {
            const res = await runABTest({
                prompt: prompt.trim(),
                providerA,
                modelA,
                providerB,
                modelB,
            });
            setResult(res);
            loadHistory();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'AB test failed');
            LOGGER.warn('AB test failed', String(e));
        } finally {
            setRunning(false);
        }
    };

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
            {error && (
                <div
                    role="alert"
                    aria-live="polite"
                    style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#fca5a5',
                        fontSize: '0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#fca5a5',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            fontSize: '0.9rem',
                        }}
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            )}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <GitCompare size={28} style={{ color: 'var(--purple)' }} />
                    <div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--slate-200)',
                            }}
                        >
                            {t('ab_test.title')}
                        </h2>
                        <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                            {t('ab_test.subtitle')}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => setViewTab('test')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            background:
                                viewTab === 'test'
                                    ? 'rgba(139,92,246,0.2)'
                                    : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${viewTab === 'test' ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
                            color: viewTab === 'test' ? '#a78bfa' : '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                        }}
                    >
                        <GitCompare size={14} style={{ marginRight: 4 }} /> {t('ab_test.test')}
                    </button>
                    <button
                        onClick={() => setViewTab('history')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            background:
                                viewTab === 'history'
                                    ? 'rgba(139,92,246,0.2)'
                                    : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${viewTab === 'history' ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
                            color: viewTab === 'history' ? '#a78bfa' : '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                        }}
                    >
                        <History size={14} style={{ marginRight: 4 }} /> {t('ab_test.history')} (
                        {history.length})
                    </button>
                </div>
            </div>

            {viewTab === 'test' && (
                <>
                    <div style={card}>
                        <h3
                            style={{
                                margin: '0 0 8px',
                                fontSize: '0.9rem',
                                color: 'var(--slate-400)',
                                fontWeight: 600,
                            }}
                        >
                            <FileText size={14} style={{ marginRight: 6 }} /> {t('ab_test.prompt')}
                        </h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('ab_test.prompt_placeholder')}
                            rows={3}
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
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={card}>
                            <h3
                                style={{
                                    margin: '0 0 8px',
                                    fontSize: '0.85rem',
                                    color: 'var(--purple-muted)',
                                    fontWeight: 600,
                                }}
                            >
                                {t('ab_test.provider_a')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <select
                                    value={providerA}
                                    onChange={(e) => {
                                        setProviderA(e.target.value);
                                        setModelA('');
                                    }}
                                    style={{
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                    }}
                                >
                                    <option value="">{t('ab_test.select_provider')}</option>
                                    {providers.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={modelA}
                                    onChange={(e) => setModelA(e.target.value)}
                                    disabled={!providerA}
                                    style={{
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                    }}
                                >
                                    <option value="">{t('ab_test.select_model')}</option>
                                    {modelsForA.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={card}>
                            <h3
                                style={{
                                    margin: '0 0 8px',
                                    fontSize: '0.85rem',
                                    color: 'var(--warning)',
                                    fontWeight: 600,
                                }}
                            >
                                {t('ab_test.provider_b')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <select
                                    value={providerB}
                                    onChange={(e) => {
                                        setProviderB(e.target.value);
                                        setModelB('');
                                    }}
                                    style={{
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                    }}
                                >
                                    <option value="">{t('ab_test.select_provider')}</option>
                                    {providers.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={modelB}
                                    onChange={(e) => setModelB(e.target.value)}
                                    disabled={!providerB}
                                    style={{
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                    }}
                                >
                                    <option value="">{t('ab_test.select_model')}</option>
                                    {modelsForB.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleRun}
                        disabled={
                            running ||
                            !prompt.trim() ||
                            !providerA ||
                            !modelA ||
                            !providerB ||
                            !modelB
                        }
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '10px 24px',
                            borderRadius: 8,
                            background:
                                running ||
                                !prompt.trim() ||
                                !providerA ||
                                !modelA ||
                                !providerB ||
                                !modelB
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            border: 'none',
                            color:
                                running ||
                                !prompt.trim() ||
                                !providerA ||
                                !modelA ||
                                !providerB ||
                                !modelB
                                    ? '#64748b'
                                    : '#fff',
                            cursor:
                                running ||
                                !prompt.trim() ||
                                !providerA ||
                                !modelA ||
                                !providerB ||
                                !modelB
                                    ? 'not-allowed'
                                    : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            alignSelf: 'flex-start',
                        }}
                    >
                        {running ? <Loader2 size={18} /> : <Play size={18} />}
                        {running ? t('ab_test.running') : t('ab_test.run')}
                    </button>

                    {result && (
                        <div style={card}>
                            <h3
                                style={{
                                    margin: '0 0 12px',
                                    fontSize: '0.9rem',
                                    color: 'var(--slate-200)',
                                    fontWeight: 700,
                                }}
                            >
                                <BarChart3 size={16} style={{ marginRight: 6 }} />{' '}
                                {t('ab_test.results')}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <ResultRow
                                    label={t('ab_test.latency')}
                                    aVal={`${result.responseA.latency}`}
                                    bVal={`${result.responseB.latency}`}
                                    winner={result.comparison.latencyWinner}
                                    unit="ms"
                                />
                                <ResultRow
                                    label={t('ab_test.cost')}
                                    aVal={`${result.responseA.cost.toFixed(6)}`}
                                    bVal={`${result.responseB.cost.toFixed(6)}`}
                                    winner={result.comparison.costWinner}
                                />
                                <ResultRow
                                    label={t('ab_test.tokens')}
                                    aVal={`${result.responseA.tokens}`}
                                    bVal={`${result.responseB.tokens}`}
                                    winner="tie"
                                />
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '120px 1fr 1fr',
                                        gap: 8,
                                        padding: '6px 8px',
                                        fontSize: '0.8rem',
                                        color: 'var(--slate-400)',
                                    }}
                                >
                                    <span style={{ fontWeight: 600, color: 'var(--slate-500)' }}>
                                        {t('ab_test.similarity')}
                                    </span>
                                    <span
                                        style={{
                                            gridColumn: '2 / -1',
                                            color:
                                                result.comparison.contentSimilarity > 0.7
                                                    ? '#22c55e'
                                                    : result.comparison.contentSimilarity > 0.4
                                                      ? '#f59e0b'
                                                      : '#f87171',
                                        }}
                                    >
                                        {(result.comparison.contentSimilarity * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 12,
                                    marginTop: 12,
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            color: 'var(--purple-muted)',
                                            marginBottom: 4,
                                        }}
                                    >
                                        {result.responseA.provider}/{result.responseA.model}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-500)',
                                            maxHeight: 200,
                                            overflowY: 'auto',
                                            padding: 8,
                                            background: 'rgba(0,0,0,0.2)',
                                            borderRadius: 6,
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {result.responseA.content || (
                                            <span style={{ color: '#f87171' }}>
                                                {result.responseA.error}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            color: 'var(--warning)',
                                            marginBottom: 4,
                                        }}
                                    >
                                        {result.responseB.provider}/{result.responseB.model}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-500)',
                                            maxHeight: 200,
                                            overflowY: 'auto',
                                            padding: 8,
                                            background: 'rgba(0,0,0,0.2)',
                                            borderRadius: 6,
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {result.responseB.content || (
                                            <span style={{ color: '#f87171' }}>
                                                {result.responseB.error}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {viewTab === 'history' && (
                <div style={card}>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: '0.9rem',
                            color: 'var(--slate-400)',
                            fontWeight: 600,
                        }}
                    >
                        <History size={14} style={{ marginRight: 6 }} /> {t('ab_test.history')}
                    </h3>
                    {history.length === 0 && (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '2rem',
                                fontSize: '0.85rem',
                                color: 'var(--slate-600)',
                            }}
                        >
                            {t('ab_test.no_history')}
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            maxHeight: 400,
                            overflowY: 'auto',
                        }}
                    >
                        {history.map((h) => (
                            <div
                                key={h.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 120px 80px 80px',
                                    gap: 8,
                                    padding: '6px 8px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: 6,
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-500)',
                                }}
                            >
                                <span
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {h.prompt}
                                </span>
                                <span>
                                    {h.providerA}/{h.providerB}
                                </span>
                                <span title={`${t('ab_test.latency')}: ${h.latencyWinner}`}>
                                    <Clock size={12} style={{ marginRight: 2 }} />
                                    {h.latencyWinner}
                                </span>
                                <span title={`${t('ab_test.cost')}: ${h.costWinner}`}>
                                    <DollarSign size={12} style={{ marginRight: 2 }} />
                                    {h.costWinner}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ResultRow: React.FC<{
    label: string;
    aVal: string;
    bVal: string;
    winner: string;
    unit?: string;
}> = ({ label, aVal, bVal, winner, unit }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 1fr',
            gap: 8,
            padding: '6px 8px',
            fontSize: '0.8rem',
            color: 'var(--slate-400)',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 6,
        }}
    >
        <span style={{ fontWeight: 600, color: 'var(--slate-500)' }}>{label}</span>
        <span
            style={{
                color: winner === 'A' ? '#22c55e' : winner === 'B' ? '#f87171' : '#94a3b8',
            }}
        >
            {aVal}
            {unit}
            {winner === 'A' && ' ✓'}
        </span>
        <span
            style={{
                color: winner === 'B' ? '#22c55e' : winner === 'A' ? '#f87171' : '#94a3b8',
            }}
        >
            {bVal}
            {unit}
            {winner === 'B' && ' ✓'}
        </span>
    </div>
);

export default ABTestPanel;
