import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePolling } from './Common/usePolling';
import { RefreshCw, RotateCcw, Clock, AlertTriangle, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { rotationService } from '../kernel/instances';
import { keyService } from '../kernel/instances';
import type { ApiKey } from '../kernel/types/metrics-types';
import type { RotationEvent } from '../kernel/types/metrics-types';
import { useTranslation } from '../i18n/useTranslation';
import { useAutoClearError } from '../hooks/useAutoClearError';
import { errorContainer, dismissBtnRed, textMutedXs, input } from '../styles/common';
import { Button } from './Common';

const RotationsPanel: React.FC = () => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [rotating, setRotating] = useState<string | null>(null);
    const [ttlInputs, setTtlInputs] = useState<Record<string, string>>({});
    const [expandedKey, setExpandedKey] = useState<string | null>(null);
    const [rotationHistory, setRotationHistory] = useState<Record<string, RotationEvent[]>>({});
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);
    const { t } = useTranslation();
    const clearError = useAutoClearError(setError);

    const loadKeys = useCallback(() => {
        try {
            const allKeys = keyService.getKeys();
            if (isMountedRef.current) {
                setKeys(allKeys);
                setError(null);
            }
        } catch {
            if (isMountedRef.current) setError(t('rotations.error_load'));
        }
        if (isMountedRef.current) setLoading(false);
    }, [t]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    usePolling(loadKeys, 60000);

    const handleSetTTL = (keyId: string) => {
        const val = parseInt(ttlInputs[keyId] || '', 10);
        if (isNaN(val) || val <= 0) {
            setError(t('rotations.error_ttl_invalid'));
            clearError();
            return;
        }
        try {
            rotationService.setKeyTTL(keyId, val, true);
            setTtlInputs((prev) => ({ ...prev, [keyId]: '' }));
            loadKeys();
        } catch {
            setError(t('rotations.error_ttl_set'));
            clearError();
        }
    };

    const handleCancelRotation = (keyId: string) => {
        try {
            rotationService.cancelRotation(keyId);
            loadKeys();
        } catch {
            setError(t('rotations.error_cancel'));
            clearError();
        }
    };

    const handleRotateNow = async (keyId: string) => {
        setRotating(keyId);
        try {
            await rotationService.rotateNow(keyId);
            loadKeys();
        } catch {
            setError(t('rotations.error_rotate'));
            clearError();
        } finally {
            if (isMountedRef.current) setRotating(null);
        }
    };

    const toggleHistory = (keyId: string) => {
        if (expandedKey === keyId) {
            setExpandedKey(null);
            return;
        }
        setExpandedKey(keyId);
        try {
            const history = rotationService.getRotationHistory(keyId);
            if (isMountedRef.current) setRotationHistory((prev) => ({ ...prev, [keyId]: history }));
        } catch {
            if (isMountedRef.current) setRotationHistory((prev) => ({ ...prev, [keyId]: [] }));
        }
    };

    const formatTime = (ms: number) => {
        if (ms <= 0) return t('rotations.expired');
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    };

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--slate-400)',
                }}
            >
                <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                    <Loader2 size={20} /> {t('common.loading')}
                </motion.div>
            </div>
        );
    }

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
                        <RefreshCw size={28} color="#3b82f6" /> {t('rotations.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('rotations.subtitle')}
                    </p>
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

            {keys.length === 0 ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        color: 'var(--slate-500)',
                        fontSize: '0.9rem',
                        fontStyle: 'italic',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: 16,
                    }}
                >
                    <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--slate-400)' }}>
                        {t('rotations.empty')}
                    </div>
                    <div>{t('rotations.empty_desc')}</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {keys.map((key) => {
                        const status = rotationService.getTTLStatus(key.id);
                        const isExpanded = expandedKey === key.id;
                        const history = rotationHistory[key.id] || [];
                        return (
                            <div
                                key={key.id}
                                style={{
                                    padding: '1rem 1.25rem',
                                    borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    background: 'rgba(0,0,0,0.15)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: 6,
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                background: 'rgba(59, 130, 246, 0.15)',
                                                color: '#60a5fa',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {key.provider}
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                color: 'var(--slate-100)',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            {key.label}
                                        </div>
                                        <div
                                            style={{
                                                padding: '0.15rem 0.4rem',
                                                borderRadius: 4,
                                                fontSize: '0.65rem',
                                                background: status.active
                                                    ? 'rgba(16,185,129,0.15)'
                                                    : 'rgba(100,116,139,0.15)',
                                                color: status.active ? '#10b981' : '#64748b',
                                            }}
                                        >
                                            {status.active
                                                ? t('rotations.active')
                                                : t('rotations.inactive')}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.4rem',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {status.active && (
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--warning)',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <Clock
                                                    size={12}
                                                    style={{ display: 'inline', marginRight: 4 }}
                                                />
                                                {formatTime(status.remainingMs)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.3rem',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <input
                                            type="number"
                                            value={ttlInputs[key.id] || ''}
                                            onChange={(e) =>
                                                setTtlInputs((prev) => ({
                                                    ...prev,
                                                    [key.id]: e.target.value,
                                                }))
                                            }
                                            placeholder={t('rotations.ttl_placeholder')}
                                            style={{
                                                ...input,
                                                width: 80,
                                                padding: '0.3rem 0.5rem',
                                                fontSize: '0.75rem',
                                            }}
                                            min={1}
                                        />
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleSetTTL(key.id)}
                                        >
                                            {t('rotations.set_ttl')}
                                        </Button>
                                    </div>
                                    {status.active && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCancelRotation(key.id)}
                                        >
                                            {t('rotations.cancel')}
                                        </Button>
                                    )}
                                    <Button
                                        variant="warning"
                                        size="sm"
                                        onClick={() => handleRotateNow(key.id)}
                                        disabled={rotating === key.id}
                                    >
                                        {rotating === key.id ? (
                                            <Loader2 size={14} />
                                        ) : (
                                            <RotateCcw size={14} />
                                        )}
                                        {t('rotations.rotate_now')}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleHistory(key.id)}
                                    >
                                        {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                                        {t('rotations.history')} ({key.rotationHistory?.length || 0}
                                        )
                                    </Button>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            style={{
                                                marginTop: '0.75rem',
                                                padding: '0.75rem',
                                                borderRadius: 8,
                                                background: 'rgba(0,0,0,0.2)',
                                            }}
                                        >
                                            {history.length === 0 ? (
                                                <div style={textMutedXs}>
                                                    {t('rotations.no_history')}
                                                </div>
                                            ) : (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.4rem',
                                                        maxHeight: 200,
                                                        overflowY: 'auto',
                                                    }}
                                                >
                                                    {history.map((evt) => (
                                                        <div
                                                            key={evt.id}
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                padding: '0.3rem 0',
                                                                borderBottom:
                                                                    '1px solid rgba(255,255,255,0.03)',
                                                            }}
                                                        >
                                                            <span style={{ color: 'var(--slate-400)' }}>
                                                                {new Date(
                                                                    evt.timestamp,
                                                                ).toLocaleString()}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    padding: '0.1rem 0.3rem',
                                                                    borderRadius: 3,
                                                                    fontSize: '0.65rem',
                                                                    background:
                                                                        evt.result === 'success'
                                                                            ? 'rgba(16,185,129,0.15)'
                                                                            : 'rgba(239,68,68,0.15)',
                                                                    color:
                                                                        evt.result === 'success'
                                                                            ? '#10b981'
                                                                            : '#ef4444',
                                                                }}
                                                            >
                                                                {evt.type}
                                                            </span>
                                                            <span style={{ color: 'var(--slate-500)' }}>
                                                                {evt.fromStatus} → {evt.toStatus}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            <div
                style={{
                    fontSize: '0.75rem',
                    color: 'var(--slate-500)',
                    padding: '0.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                {t('rotations.footer', { count: keys.filter((k) => k.rotationConfig).length })}
            </div>
        </div>
    );
};

export default RotationsPanel;
