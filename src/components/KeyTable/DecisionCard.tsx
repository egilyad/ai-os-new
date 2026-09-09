import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RouterDecision, PipelineStep } from '../../kernel/instances';
import DecisionExpandedView from './DecisionExpandedView';

const STEP_ICONS: Record<PipelineStep['status'], string> = {
    passed: '\u2713',
    blocked: '\u2717',
    retried: '\u21BB',
    cached: '\u2B50',
    fallback: '\u2192',
};
const STEP_COLORS: Record<PipelineStep['status'], string> = {
    passed: '#22c55e',
    blocked: '#ef4444',
    retried: '#f59e0b',
    cached: '#a855f7',
    fallback: '#3b82f6',
};

interface Props {
    decision: RouterDecision;
    keyId: string;
}

const DecisionCard: React.FC<Props> = memo(({ decision: d, keyId }) => {
    const [expanded, setExpanded] = useState(false);
    const skipEntry = d.skipped.find((s) => s.keyId === keyId);
    const finalState = skipEntry
        ? {
              label:
                  skipEntry.stage === 'status'
                      ? 'Skipped'
                      : skipEntry.stage === 'policy'
                        ? 'Blocked'
                        : skipEntry.stage === 'quota'
                          ? 'Quota'
                          : skipEntry.stage === 'budget'
                            ? 'Budget'
                            : 'Skipped',
              color: 'var(--warning)',
              reason: skipEntry.reason,
          }
        : { label: 'Scored', color: 'var(--accent)', reason: 'Scored in routing decision' };

    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden',
            }}
        >
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            color: 'var(--accent)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {d.requestId}
                    </span>
                    <span
                        style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: `${finalState.color}20`,
                            color: finalState.color,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {finalState.label}
                    </span>
                    <span
                        style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {d.strategy}
                    </span>
                    {d.selected && (
                        <span
                            style={{ fontSize: '0.7rem', color: 'var(--success)', whiteSpace: 'nowrap' }}
                        >
                            {d.selected}
                        </span>
                    )}
                    {d.steps.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                            {d.steps.map((s, i) => (
                                <span
                                    key={`${s.name}-${s.provider ?? s.detail ?? i}`}
                                    title={s.detail}
                                    style={{
                                        fontSize: '0.6rem',
                                        padding: '0.1rem 0.3rem',
                                        borderRadius: '3px',
                                        background: `${STEP_COLORS[s.status]}20`,
                                        color: STEP_COLORS[s.status],
                                    }}
                                >
                                    {STEP_ICONS[s.status]} {s.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <span
                    style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}
                >
                    {new Date(d.timestamp).toLocaleTimeString()}
                </span>
                <span
                    style={{
                        marginLeft: '0.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.75rem',
                        transition: 'transform 0.2s',
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                >
                    {'\u25BC'}
                </span>
            </div>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <DecisionExpandedView decision={d} keyId={keyId} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default DecisionCard;
