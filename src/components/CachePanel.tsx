import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Database,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Loader2,
    Search,
    X,
    HardDrive,
    Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cacheService } from '../kernel/instances';
import { eventBus, EVENTS } from '../kernel/instances';
import { useTranslation } from '../i18n/useTranslation';
import { useAutoClearError } from '../hooks/useAutoClearError';
import { useConfirm } from '../hooks/useConfirm';
import {
    errorContainer,
    dismissBtnRed,
    textMutedXs,
    textSecondaryXs,
    textWhiteXs,
    flexBetween,
} from '../styles/common';
import { PanelLoading } from './PanelStates';

interface CacheStats {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
}

const CachePanel: React.FC = () => {
    const [stats, setStats] = useState<CacheStats>({ size: 0, hits: 0, misses: 0, hitRate: 0 });
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modelFilter, setModelFilter] = useState('');
    const { t } = useTranslation();
    const { confirm, ConfirmDialog } = useConfirm();
    const isMountedRef = useRef(true);
    const clearError = useAutoClearError(setError);

    const [cacheConfig, setCacheConfig] = useState<{
        level: string;
        ttl: number;
        maxEntries: number;
        persistence: string;
    } | null>(null);

    const loadStats = useCallback(() => {
        try {
            const s = cacheService.getStats();
            if (isMountedRef.current) {
                setStats(s);
                setCacheConfig(
                    (cacheService as unknown as Record<string, () => unknown>).getConfig!() as {
                        level: string;
                        ttl: number;
                        maxEntries: number;
                        persistence: string;
                    },
                );
                setError(null);
            }
        } catch {
            if (isMountedRef.current) {
                setError(t('cache.error_load'));
                clearError();
            }
        }
        if (isMountedRef.current) setLoading(false);
    }, [clearError, t]);

    useEffect(() => {
        isMountedRef.current = true;
        loadStats();
        return () => {
            isMountedRef.current = false;
        };
    }, [loadStats]);

    const handleClear = async () => {
        if (
            !(await confirm({
                title: 'Clear Cache',
                message: 'Are you sure you want to clear the entire cache?',
                variant: 'danger',
            }))
        )
            return;
        setClearing(true);
        try {
            if (modelFilter.trim()) {
                cacheService.invalidate(modelFilter.trim());
            } else {
                cacheService.invalidate();
            }
            loadStats();
            eventBus.emit(EVENTS.NOTIFICATION, { message: t('cache.cleared'), type: 'success' });
        } catch {
            if (isMountedRef.current) {
                setError(t('cache.error_clear'));
                clearError();
            }
        } finally {
            if (isMountedRef.current) setClearing(false);
        }
    };

    const handleRefresh = () => {
        loadStats();
        eventBus.emit(EVENTS.NOTIFICATION, { message: t('cache.refreshed'), type: 'info' });
    };

    if (loading) {
        return <PanelLoading />;
    }

    const safeStats = stats ?? { size: 0, hits: 0, misses: 0, hitRate: 0 };

    const statCards = [
        {
            label: t('cache.size'),
            value: safeStats.size,
            color: 'var(--accent)',
            icon: <HardDrive size={18} />,
            suffix: t('cache.entries'),
        },
        {
            label: t('cache.hits'),
            value: safeStats.hits,
            color: 'var(--success)',
            icon: <Database size={18} />,
            suffix: '',
        },
        {
            label: t('cache.misses'),
            value: safeStats.misses,
            color: 'var(--warning)',
            icon: <Search size={18} />,
            suffix: '',
        },
        {
            label: t('cache.hit_rate'),
            value: `${(safeStats.hitRate * 100).toFixed(1)}%`,
            color:
                safeStats.hitRate > 0.5
                    ? '#10b981'
                    : safeStats.hitRate > 0.2
                      ? '#f59e0b'
                      : '#ef4444',
            icon: <Zap size={18} />,
            suffix: '',
        },
    ];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '1rem',
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
                        <Database size={28} color="#3b82f6" /> {t('cache.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('cache.subtitle')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.3rem',
                            background: 'rgba(0,0,0,0.3)',
                            padding: '0.3rem',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.05)',
                            alignItems: 'center',
                        }}
                    >
                        <input
                            type="text"
                            placeholder={t('cache.model_placeholder')}
                            value={modelFilter}
                            onChange={(e) => setModelFilter(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--slate-200)',
                                padding: '0.4rem 0.5rem',
                                fontSize: '0.8rem',
                                outline: 'none',
                                width: 140,
                            }}
                        />
                    </div>
                    <button
                        onClick={handleClear}
                        disabled={clearing}
                        style={{
                            padding: '0.5rem 0.9rem',
                            borderRadius: 8,
                            border: 'none',
                            background: 'var(--error)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {clearing ? <Loader2 size={16} /> : <Trash2 size={16} />}
                        {clearing
                            ? t('cache.clearing')
                            : modelFilter.trim()
                              ? t('cache.invalidate_model')
                              : t('cache.clear_all')}
                    </button>
                    <button
                        onClick={handleRefresh}
                        style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={errorContainer}
                    >
                        <AlertTriangle size={18} /> {error}
                        <button onClick={() => setError(null)} style={dismissBtnRed}>
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        style={{
                            padding: '1.25rem',
                            borderRadius: 16,
                            border: `1px solid ${stat.color}20`,
                            background: `linear-gradient(145deg, ${stat.color}05 0%, rgba(0,0,0,0.2) 100%)`,
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <div style={flexBetween}>
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'var(--slate-400)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                {stat.label}
                            </div>
                            <div style={{ color: stat.color }}>{stat.icon}</div>
                        </div>
                        <div
                            style={{
                                fontSize: '2rem',
                                fontWeight: 800,
                                color: 'var(--slate-50)',
                                marginTop: '0.5rem',
                            }}
                        >
                            {stat.value}
                            {stat.suffix && (
                                <span
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 400,
                                        color: 'var(--slate-400)',
                                        marginLeft: 4,
                                    }}
                                >
                                    {stat.suffix}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{
                    padding: '1.5rem',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)',
                }}
            >
                <h3
                    style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--slate-100)',
                        margin: '0 0 1rem',
                    }}
                >
                    {t('cache.config_title')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <div style={textSecondaryXs}>{t('cache.level')}</div>
                        <div style={textWhiteXs}>{cacheConfig?.level ?? 'Kernel CacheService'}</div>
                    </div>
                    <div>
                        <div style={textSecondaryXs}>{t('cache.ttl')}</div>
                        <div style={textWhiteXs}>
                            {cacheConfig
                                ? `${(cacheConfig.ttl / 1000).toFixed(0)}s (${Math.round(cacheConfig.ttl / 60000)} min)`
                                : '300s (5 min)'}
                        </div>
                    </div>
                    <div>
                        <div style={textSecondaryXs}>{t('cache.max_entries')}</div>
                        <div style={textWhiteXs}>{cacheConfig?.maxEntries ?? 500}</div>
                    </div>
                    <div>
                        <div style={textSecondaryXs}>{t('cache.persist')}</div>
                        <div style={textWhiteXs}>
                            {cacheConfig?.persistence ?? 'IndexedDB (2s debounce)'}
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 8,
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.15)',
                    }}
                >
                    <div style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 500 }}>
                        {t('cache.tip')}
                    </div>
                </div>
            </div>

            <div style={textMutedXs}>{t('cache.entries_count', { count: safeStats.size })}</div>

            <ConfirmDialog />
        </div>
    );
};

export default CachePanel;
