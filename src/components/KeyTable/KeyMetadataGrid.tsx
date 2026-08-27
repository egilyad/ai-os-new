import React, { useState, useRef, useEffect } from 'react';
import { Hash, Check, Copy } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { ApiKey } from '../../types/metrics';

interface Props {
    apiKey: ApiKey;
    stats: NonNullable<ApiKey['stats']['extended']>;
}

const KeyMetadataGrid: React.FC<Props> = ({ apiKey, stats }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const now = Date.now();

    useEffect(
        () => () => {
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        },
        [],
    );

    const handleCopyKey = async () => {
        try {
            if (apiKey.key) {
                await navigator.clipboard.writeText(apiKey.key);
                setCopied(true);
                if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
                copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
            }
        } catch {
            /* silently fail */
        }
    };

    return (
        <div
            style={{
                padding: '1.25rem',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                }}
            >
                <Hash size={14} color="#64748b" aria-hidden="true" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    {t('overview.key_metadata')}
                </span>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                }}
            >
                <div style={{ color: 'var(--text-muted)' }}>{t('overview.meta_id')}</div>
                <div style={{ fontWeight: 600 }}>{apiKey.id}</div>
                <div style={{ color: 'var(--text-muted)' }}>{t('overview.meta_provider')}</div>
                <div style={{ fontWeight: 600 }}>{apiKey.provider}</div>
                <div style={{ color: 'var(--text-muted)' }}>{t('overview.meta_key')}</div>
                <div
                    style={{
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    {apiKey.key && apiKey.key.length > 12
                        ? `${apiKey.key.slice(0, 4)}...${apiKey.key.slice(-4)}`
                        : '****'}
                    <button
                        onClick={handleCopyKey}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 2,
                        }}
                        aria-label={t('common.aria.copy')}
                        title={t('overview.copy_to_clipboard')}
                    >
                        {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>{t('overview.meta_sla_mode')}</div>
                <div style={{ fontWeight: 600 }}>
                    {stats.activeSLA || t('overview.sla_balanced')}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>{t('overview.meta_state')}</div>
                <div
                    style={{
                        fontWeight: 600,
                        color: stats.state === 'HEALTHY' ? '#10b981' : '#ef4444',
                    }}
                >
                    {stats.state}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>{t('overview.meta_stability')}</div>
                <div style={{ fontWeight: 600 }}>{stats.stabilityForecast || '--'}</div>
                <div style={{ color: 'var(--text-muted)' }}>{t('overview.meta_group')}</div>
                <div style={{ fontWeight: 600 }}>{apiKey.group || '\u2014'}</div>
                <div style={{ color: 'var(--text-muted)' }}>{t('overview.meta_account')}</div>
                <div style={{ fontWeight: 600 }}>
                    {apiKey.account || apiKey.accountId || '\u2014'}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>{t('overview.meta_fingerprint')}</div>
                <div style={{ fontWeight: 600, fontSize: '0.65rem', fontFamily: 'monospace' }}>
                    {(stats.fingerprint || '--').slice(0, 16)}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>{t('overview.meta_tags')}</div>
                <div style={{ fontWeight: 600 }}>
                    {(apiKey.tags || []).join(', ') || t('overview.meta_none')}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>{t('overview.meta_history')}</div>
                <div style={{ fontWeight: 600 }}>
                    {t('overview.meta_history_count', { count: (apiKey.history || []).length })}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>{t('overview.meta_expires')}</div>
                <div
                    style={{
                        fontWeight: 600,
                        color:
                            apiKey.expiresAt && apiKey.expiresAt < now
                                ? '#ef4444'
                                : apiKey.expiresAt && apiKey.expiresAt < now + 7 * 86400000
                                  ? '#f59e0b'
                                  : 'inherit',
                    }}
                >
                    {apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : '\u2014'}
                    {apiKey.expiresAt && apiKey.expiresAt < now
                        ? ' (expired)'
                        : apiKey.expiresAt && apiKey.expiresAt < now + 7 * 86400000
                          ? ' (expiring soon)'
                          : ''}
                </div>
            </div>
        </div>
    );
};

export default KeyMetadataGrid;
