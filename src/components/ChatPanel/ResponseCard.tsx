import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
    Loader2,
    AlertCircle,
    CheckCircle2,
    Activity,
    ChevronRight,
    Package,
    GitFork,
    Zap,
    RefreshCw,
    ThumbsUp,
    ThumbsDown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChatResponse } from '../../types/chat';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ContextMenu } from '../Common/ContextMenu';
import {
    errorCard,
    flexCenterGap3,
    flexCenterGap6px,
    flexCenterSmGap,
    flexCol,
    iconBtnMuted,
} from '../../styles/common';
import { useTranslation } from '../../i18n/useTranslation';
import { getProviderColor } from './chat-panel-utils';

interface ResponseCardProps {
    res: ChatResponse;
    entryId: string;
    displayMode?: 'standard' | 'technical';
    onFork?: (entryId: string) => void;
    onRegenerate?: (entryId: string) => void;
}

const ResponseCard: React.FC<ResponseCardProps> = memo(
    ({ res, entryId, displayMode = 'standard', onFork, onRegenerate }) => {
        const { t } = useTranslation();
        const [copied, setCopied] = useState(false);
        const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
        const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
        const color = getProviderColor(res?.provider);
        const isStreaming = res.status === 'loading' || res.status === 'streaming';
        const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        useEffect(() => {
            return () => {
                if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
            };
        }, []);

        const handleCopy = useCallback(() => {
            if (!res) return;
            navigator.clipboard
                .writeText(res.content)
                .then(() => {
                    setCopied(true);
                    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
                    copyTimeoutRef.current = setTimeout(() => {
                        setCopied(false);
                        copyTimeoutRef.current = null;
                    }, 2000);
                })
                .catch(() => {
                    // clipboard write failed — no false "Copied!" shown
                });
        }, [res]);

        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setCtxMenu({ x: e.clientX, y: e.clientY });
                }}
                style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: `1px solid rgba(255,255,255,0.07)`,
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 12,
                    padding: '1.2rem',
                    marginTop: '0.75rem',
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: displayMode === 'technical' ? '0.75rem' : '0.5rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                            style={{
                                padding: 6,
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.03)',
                            }}
                        >
                            <ProviderIcon provider={res.provider} size={16} />
                        </div>
                        <div style={flexCol}>
                            <div style={flexCenterGap6px}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color }}>
                                    {res.provider}
                                </span>
                                {isStreaming && (
                                    <Loader2
                                        size={12}
                                        color={color}
                                        style={{ animation: 'spin 1s linear infinite' }}
                                    />
                                )}
                                {res.status === 'error' && (
                                    <AlertCircle size={12} color="#ef4444" />
                                )}
                                {res.status === 'streaming' && (
                                    <span
                                        style={{
                                            fontSize: '0.6rem',
                                            color,
                                            background: `${color}20`,
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {t('chat.live')}
                                    </span>
                                )}
                            </div>
                            {displayMode === 'technical' && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                    {res.model}
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={flexCenterGap3}>
                        {displayMode === 'technical' && res.latency > 0 && (
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                }}
                            >
                                {res.latency}
                                {t('chat.latency_ms')}
                            </span>
                        )}
                        {res.status === 'done' && (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button
                                    onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                                    title={t('chat.helpful')}
                                    aria-label={t('chat.helpful_aria')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: feedback === 'up' ? '#10b981' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: 4,
                                    }}
                                >
                                    <ThumbsUp size={13} aria-hidden="true" />
                                </button>
                                <button
                                    onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                                    title={t('chat.not_helpful')}
                                    aria-label={t('chat.not_helpful_aria')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color:
                                            feedback === 'down' ? '#ef4444' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: 4,
                                    }}
                                >
                                    <ThumbsDown size={13} aria-hidden="true" />
                                </button>
                                {displayMode === 'technical' && (
                                    <button
                                        onClick={() => onFork?.(entryId)}
                                        title={t('chat.fork_title')}
                                        aria-label={t('chat.fork_aria')}
                                        style={iconBtnMuted}
                                    >
                                        <GitFork size={14} aria-hidden="true" />
                                    </button>
                                )}
                                <button
                                    onClick={handleCopy}
                                    title={t('chat.copy_title')}
                                    aria-label={t('chat.copy_aria')}
                                    style={iconBtnMuted}
                                >
                                    {copied ? (
                                        <CheckCircle2 size={14} color="#10b981" />
                                    ) : (
                                        <Package size={14} />
                                    )}
                                </button>
                                {onRegenerate && (
                                    <button
                                        onClick={() => onRegenerate?.(entryId)}
                                        title={t('chat.regenerate_title')}
                                        aria-label={t('chat.regenerate_aria')}
                                        style={iconBtnMuted}
                                    >
                                        <RefreshCw size={14} aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {res.status === 'loading' && !res.content && (
                    <div style={{ display: 'flex', gap: 4, padding: '0.5rem 0' }}>
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={`dot-${i}`}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: color,
                                }}
                            />
                        ))}
                    </div>
                )}

                {(res.status === 'streaming' ||
                    (res.status === 'loading' && res.content) ||
                    res.status === 'done') &&
                    res.content && (
                        <>
                            <MarkdownRenderer content={res.content} isStreaming={isStreaming} />
                            {isStreaming && (
                                <motion.span
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    style={{
                                        display: 'inline-block',
                                        width: 8,
                                        height: 16,
                                        background: color,
                                        marginLeft: 2,
                                        borderRadius: 1,
                                        verticalAlign: 'middle',
                                    }}
                                />
                            )}
                            {displayMode === 'technical' && isStreaming && (
                                <div
                                    style={{
                                        marginTop: '0.5rem',
                                        display: 'flex',
                                        gap: '1rem',
                                        alignItems: 'center',
                                        fontSize: '0.65rem',
                                        color: 'var(--text-muted)',
                                        opacity: 0.6,
                                    }}
                                >
                                    <span style={flexCenterSmGap}>
                                        <Activity size={10} color="#a855f7" /> ~
                                        {Math.round((res.content?.length || 0) / 4)}{' '}
                                        {t('chat.tokens_label')}
                                    </span>
                                    <span style={flexCenterSmGap}>
                                        <ChevronRight size={10} />{' '}
                                        {res.tps != null ? res.tps.toFixed(1) : '\u2014'}{' '}
                                        {t('chat.tokens_per_sec')}
                                    </span>
                                </div>
                            )}
                            {displayMode === 'technical' && res.status === 'done' && (
                                <div
                                    style={{
                                        marginTop: '1rem',
                                        paddingTop: '0.8rem',
                                        borderTop: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        gap: '1.5rem',
                                        alignItems: 'center',
                                        fontSize: '0.7rem',
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    <span style={flexCenterSmGap}>
                                        <Zap size={12} color={color} /> {res.ttft ?? res.latency}
                                        {t('chat.latency_ms')} {t('chat.ttft_label')}
                                    </span>
                                    <span style={flexCenterSmGap}>
                                        <Activity size={12} color="#a855f7" /> ~
                                        {Math.round((res.content?.length || 0) / 4)}{' '}
                                        {t('chat.tokens_label')}
                                    </span>
                                    <span style={flexCenterSmGap}>
                                        <ChevronRight size={12} /> {res.tps?.toFixed(1) || '\u2014'}{' '}
                                        {t('chat.tokens_per_sec')}
                                    </span>
                                </div>
                            )}
                        </>
                    )}

                {res.status === 'error' && (
                    <div style={errorCard}>
                        {res.error}
                        {onRegenerate && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <button
                                    onClick={() => onRegenerate?.(entryId)}
                                    style={{
                                        padding: '0.3rem 0.75rem',
                                        borderRadius: 6,
                                        background: 'var(--border-subtle)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        color: '#fca5a5',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                    }}
                                >
                                    {t('common.retry')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {ctxMenu && (
                    <ContextMenu
                        x={ctxMenu.x}
                        y={ctxMenu.y}
                        onClose={() => setCtxMenu(null)}
                        actions={[
                            {
                                id: 'copy',
                                label: t('chat.copy_title'),
                                icon: <Package size={14} />,
                                onClick: handleCopy,
                            },
                            {
                                id: 'fork',
                                label: t('chat.fork_title'),
                                icon: <GitFork size={14} />,
                                onClick: () => onFork?.(entryId),
                                disabled: !onFork,
                            },
                            {
                                id: 'regenerate',
                                label: t('chat.regenerate_title'),
                                icon: <RefreshCw size={14} />,
                                onClick: () => onRegenerate?.(entryId),
                                disabled: !onRegenerate,
                                divider: true,
                            },
                        ]}
                    />
                )}
            </motion.div>
        );
    },
);

export default ResponseCard;
