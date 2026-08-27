/**
 * SessionBindingsPanel — Displays session-to-API-key affinity bindings.
 *
 * Shows a live-updating table of which API keys are bound to which sessions,
 * including provider name, key status (ready/limited/degraded/broken),
 * pending eviction flags, and binding age. Used for monitoring key
 * utilization and debugging session affinity issues.
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useNow } from '../hooks/useNow';
import { usePolling } from './Common/usePolling';
import { sessionAffinityStore, keyStateStore } from '../kernel/instances';
import type { SessionBinding } from '../kernel/contracts/session-affinity';
import { Link, RefreshCw } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
    ready: '#22c55e',
    limited: '#f59e0b',
    degraded: '#f97316',
    broken: '#ef4444',
    unknown: '#64748b',
};

const ENRICHED_HEADERS = ['session', 'key', 'provider', 'status', 'eviction', 'age'] as const;

interface EnrichedBinding extends SessionBinding {
    keyStatus: string;
}

const SessionBindingsPanel: React.FC = () => {
    const { t } = useTranslation();
    const now = useNow(30_000);
    const [bindings, setBindings] = useState<EnrichedBinding[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const raw = sessionAffinityStore.getAllBindings();
        const enriched: EnrichedBinding[] = raw.map((b) => {
            const state = keyStateStore?.get(b.keyId);
            return { ...b, keyStatus: state?.status ?? 'unknown' };
        });
        setBindings(enriched);
    }, [refreshKey]);

    const handleRefresh = () => setRefreshKey((k) => k + 1);
    usePolling(handleRefresh, 15000);

    const formatAge = (ts: number): string => {
        const sec = Math.floor((now - ts) / 1000);
        if (sec < 60) return `${sec}s`;
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min}m`;
        return `${Math.floor(min / 60)}h ${min % 60}m`;
    };

    const maskKey = (id: string): string =>
        id.length > 16 ? `${id.slice(0, 12)}…${id.slice(-6)}` : id;

    return (
        <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.25rem',
                }}
            >
                <Link size={28} color="#8b5cf6" aria-hidden="true" />
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                        {t('session_bindings.title')}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                        {t('session_bindings.subtitle')}
                    </p>
                </div>
                <div
                    style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                    }}
                >
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {bindings.length} {t('session_bindings.count_suffix')}
                    </span>
                    <button
                        onClick={handleRefresh}
                        title={t('session_bindings.refresh')}
                        style={{
                            background: 'none',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            padding: '0.35rem 0.6rem',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <RefreshCw size={14} />
                        <span style={{ fontSize: '0.8rem' }}>{t('session_bindings.refresh')}</span>
                    </button>
                </div>
            </div>

            {bindings.length === 0 ? (
                <div
                    style={{
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        border: '1px dashed var(--border)',
                        borderRadius: 8,
                    }}
                >
                    <Link size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0 }}>{t('session_bindings.empty')}</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table
                        style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}
                    >
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                {ENRICHED_HEADERS.map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            textAlign: 'left',
                                            whiteSpace: 'nowrap',
                                            color: 'var(--text-muted)',
                                            fontWeight: 500,
                                        }}
                                    >
                                        {t(`session_bindings.col_${h}`)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bindings.map((b) => (
                                <tr
                                    key={`${b.sessionId}::${b.participantId ?? ''}`}
                                    style={{ borderBottom: '1px solid var(--border)' }}
                                >
                                    <td
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                        }}
                                    >
                                        {maskKey(b.sessionId)}
                                    </td>
                                    <td
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                        }}
                                    >
                                        {maskKey(b.keyId)}
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem' }}>{b.provider}</td>
                                    <td style={{ padding: '0.5rem 0.75rem' }}>
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                padding: '0.15rem 0.45rem',
                                                borderRadius: 4,
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: `${STATUS_COLORS[b.keyStatus] ?? '#64748b'}22`,
                                                color: STATUS_COLORS[b.keyStatus] ?? '#64748b',
                                            }}
                                        >
                                            {b.keyStatus}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.5rem 0.75rem' }}>
                                        {b.pendingEviction ? (
                                            <span style={{ color: '#f97316', fontSize: '0.75rem' }}>
                                                {t('session_bindings.pending')}
                                            </span>
                                        ) : (
                                            <span
                                                style={{
                                                    color: 'var(--text-muted)',
                                                    fontSize: '0.75rem',
                                                }}
                                            >
                                                {t('session_bindings.stable')}
                                            </span>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        {formatAge(b.boundAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SessionBindingsPanel;
