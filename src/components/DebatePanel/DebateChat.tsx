import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Brain, AlertTriangle, Check, X, Clock } from 'lucide-react';
import type { DebateArgument } from '../../kernel/instances';
import { flexCenterGap6px, textMutedSm } from '../../styles/common';
import { FactCheckBadge } from './FactCheckBadge';
import { MarkdownRenderer } from '../ChatPanel/MarkdownRenderer';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';

interface AgentErrorEntry {
    agentId: string;
    error: string;
    timestamp: number;
    isTimeout?: boolean;
}

interface DebateChatProps {
    arguments: DebateArgument[];
    status?: string;
    isActive?: boolean;
    t: (key: string, params?: Record<string, string | number>) => string;
    agentLabel?: (agentId: string) => string;
    streamingArgIds?: Set<string>;
    agentErrors?: AgentErrorEntry[];
}

const DebateChat: React.FC<DebateChatProps> = ({
    arguments: args,
    t,
    streamingArgIds,
    agentErrors,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastArgId = args.length > 0 ? args[args.length - 1]!.id : undefined;
    // D-H-19: Also scroll when content of the last arg changes (during streaming)
    const lastArgContentLen = args.length > 0 ? args[args.length - 1]!.content.length : 0;
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lastArgId, lastArgContentLen]);
    const errors = agentErrors ?? [];
    const hasErrors = errors.length > 0;
    const allFailed = hasErrors && args.length === 0;
    return (
        <div
            ref={scrollRef}
            style={{
                flex: 1,
                overflowY: 'auto',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
            }}
        >
            <AnimatePresence>
                {allFailed && (
                    <motion.div
                        key="all-failed-banner"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            padding: '1.5rem 2rem',
                            borderRadius: 16,
                            background:
                                'linear-gradient(145deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.05) 100%)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            textAlign: 'center',
                        }}
                    >
                        <AlertTriangle
                            size={32}
                            color="#ef4444"
                            style={{ marginBottom: '0.75rem' }}
                        />
                        <div
                            style={{
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                color: 'var(--error)',
                                marginBottom: '0.5rem',
                            }}
                        >
                            {t('debate.all_agents_failed')}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                            {t('debate.agent_errors', { count: errors.length })}
                        </div>
                    </motion.div>
                )}
                {args.map((arg, _i) => {
                    const isStreaming = streamingArgIds?.has(arg.id);
                    const isUser = arg.source === 'human' || arg.agentId === 'User (Human-in-loop)';
                    const isPro = arg.position === 'pro';
                    const isCon = arg.position === 'con';
                    const positionColor = isPro ? '#3b82f6' : isCon ? '#ef4444' : '#94a3b8';
                    const positionLabel = isPro ? 'PRO' : isCon ? 'CON' : 'NEU';
                    const color = isUser ? '#10b981' : positionColor;
                    const identity = resolveAgentIdentity(arg.agentId);

                    const bg = isUser
                        ? 'linear-gradient(145deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)'
                        : `linear-gradient(145deg, rgba(${isPro ? '59,130,246' : isCon ? '239,68,68' : '148,163,184'}, 0.15) 0%, rgba(0,0,0,0.2) 100%)`;

                    return (
                        <motion.div
                            key={`${arg.id}-${arg.round}`}
                            layout
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            transition={{
                                type: 'spring',
                                damping: 25,
                                stiffness: 300,
                                layout: { type: 'spring', damping: 25, stiffness: 300 },
                            }}
                            style={{
                                alignSelf: isUser ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                display: 'flex',
                                flexDirection: isUser ? 'row-reverse' : 'row',
                                gap: '1.25rem',
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 14,
                                    background: color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    boxShadow:
                                        '0 4px 15px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                                }}
                            >
                                {isUser ? (
                                    <Target size={22} color="white" />
                                ) : identity.avatar.url ? (
                                    <img
                                        src={identity.avatar.url}
                                        alt={identity.displayName}
                                        width={30}
                                        height={30}
                                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <span style={{ fontSize: 22, lineHeight: 1 }}>
                                        {identity.avatar.emoji}
                                    </span>
                                )}
                            </div>
                            <div
                                className="debate-arg-col"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isUser ? 'flex-end' : 'flex-start',
                                }}
                            >
                                <div
                                    className="debate-arg-header"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '0.35rem',
                                    }}
                                >
                                    <span
                                        className="debate-agent-name"
                                        style={{ fontWeight: 700, fontSize: '0.85rem', color }}
                                    >
                                        {identity.displayName}
                                    </span>
                                    <span className="debate-badge" style={flexCenterGap6px}>
                                        {arg.provider && (
                                            <span style={textMutedSm}>
                                                {arg.provider}/{arg.model}
                                            </span>
                                        )}
                                        {!isUser && arg.position && (
                                            <span
                                                style={{
                                                    padding: '1px 6px',
                                                    borderRadius: 4,
                                                    fontSize: '0.6rem',
                                                    fontWeight: 800,
                                                    background: isPro
                                                        ? 'rgba(59,130,246,0.2)'
                                                        : isCon
                                                          ? 'rgba(239,68,68,0.2)'
                                                          : 'rgba(148,163,184,0.2)',
                                                    color: positionColor,
                                                    textTransform: 'uppercase',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 3,
                                                }}
                                            >
                                                {isPro && <Check size={10} aria-hidden="true" />}
                                                {isCon && <X size={10} aria-hidden="true" />}
                                                {positionLabel}
                                            </span>
                                        )}
                                        Round {arg.round} &bull;{' '}
                                        {new Date(arg.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        background: bg,
                                        border: `1px solid ${color}40`,
                                        borderRadius: '20px',
                                        borderTopLeftRadius: isUser ? '20px' : '4px',
                                        borderTopRightRadius: isUser ? '4px' : '20px',
                                        fontSize: '1rem',
                                        lineHeight: 1.6,
                                        color: 'var(--slate-200)',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                                        backdropFilter: 'blur(10px)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {!isUser && (
                                        <div
                                            style={{
                                                width: 4,
                                                flexShrink: 0,
                                                background: positionColor,
                                                opacity: 0.7,
                                            }}
                                        />
                                    )}
                                    <div
                                        style={{
                                            padding: '1.25rem 1.5rem',
                                            flex: 1,
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        <MarkdownRenderer content={arg.content} />
                                        {isStreaming && (
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    width: 8,
                                                    height: 16,
                                                    background: color,
                                                    marginLeft: 2,
                                                    animation: 'blink 1s step-end infinite',
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="debate-arg-conf-row"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginTop: '0.35rem',
                                    }}
                                >
                                    <span
                                        className="debate-confidence"
                                        style={{
                                            padding: '2px 10px',
                                            borderRadius: 10,
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            background: `${color}15`,
                                            color,
                                            border: `1px solid ${color}30`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <Brain size={12} /> {t('confidence')}{' '}
                                        {Math.round((arg.confidence ?? 0) * 100)}%
                                    </span>
                                    {!isUser && <FactCheckBadge argumentId={arg.id} />}
                                    {arg.source === 'fallback' && (
                                        <span
                                            style={{
                                                padding: '2px 8px',
                                                borderRadius: 6,
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                background: 'rgba(239,68,68,0.15)',
                                                color: 'var(--error)',
                                                border: '1px solid rgba(239,68,68,0.3)',
                                            }}
                                        >
                                            <AlertTriangle
                                                size={10}
                                                style={{ verticalAlign: 'middle', marginRight: 4 }}
                                            />
                                            {t('fallback')}: {arg.fallbackReason || 'unknown'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                {streamingArgIds && streamingArgIds.size > 0 && (
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring' }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem 1.5rem',
                            color: 'var(--purple-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            alignSelf: 'flex-start',
                        }}
                    >
                        <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'var(--purple-muted)',
                            }}
                        />
                        {t('synthesizing')}
                    </motion.div>
                )}
                {hasErrors && !allFailed && (
                    <motion.div
                        key="errors-section"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            background: 'rgba(239,68,68,0.05)',
                            borderRadius: 16,
                            border: '1px solid rgba(239,68,68,0.2)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                padding: '0.75rem 1.25rem',
                                background: 'var(--error-tint)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: 'var(--error)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            <AlertTriangle size={14} />
                            {t('debate.errors_tab', { count: errors.length })}
                        </div>
                        <div
                            style={{
                                padding: '0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                            }}
                        >
                            {errors.map((err, i) => (
                                <motion.div
                                    key={`err-${err.agentId}-${i}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 10,
                                        background: 'rgba(239,68,68,0.08)',
                                        border: '1px solid rgba(239,68,68,0.15)',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            background: err.isTimeout
                                                ? 'rgba(245,158,11,0.2)'
                                                : 'rgba(239,68,68,0.2)',
                                        }}
                                    >
                                        {err.isTimeout ? (
                                            <Clock size={16} color="#f59e0b" />
                                        ) : (
                                            <AlertTriangle size={16} color="#ef4444" />
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                fontSize: '0.85rem',
                                                color: 'var(--slate-200)',
                                                marginBottom: '0.25rem',
                                            }}
                                        >
                                            {resolveAgentIdentity(err.agentId).displayName}
                                            <span
                                                style={{
                                                    marginLeft: '0.5rem',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                    textTransform: 'uppercase',
                                                    background: err.isTimeout
                                                        ? 'rgba(245,158,11,0.2)'
                                                        : 'rgba(239,68,68,0.2)',
                                                    color: err.isTimeout ? '#f59e0b' : '#ef4444',
                                                    verticalAlign: 'middle',
                                                }}
                                            >
                                                {err.isTimeout
                                                    ? t('debate.agent_timeout_label')
                                                    : t('debate.agent_error_label')}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--slate-400)',
                                                fontFamily: 'monospace',
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {err.error}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DebateChat;
