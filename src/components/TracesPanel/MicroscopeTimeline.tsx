import { Brain, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CognitiveTrace } from '../../kernel/instances';

const ClockSvg = ({ size, color }: { size: number; color: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

interface Props {
    trace: CognitiveTrace;
    selectedStepId: string | null;
    onSelectStep: (id: string) => void;
    onKeyDown: (e: React.KeyboardEvent, stepId: string) => void;
}

const MicroscopeTimeline: React.FC<Props> = ({
    trace,
    selectedStepId,
    onSelectStep,
    onKeyDown,
}) => (
    <div
        style={{
            borderRight: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(0,0,0,0.1)',
        }}
    >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div
                style={{
                    fontSize: '0.7rem',
                    color: 'var(--slate-500)',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                }}
            >
                TRACE ID
            </div>
            <div
                style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    color: 'var(--slate-50)',
                }}
            >
                {trace.traceId}
            </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {trace.steps.map((step, idx) => (
                    <div
                        key={step.id}
                        onClick={() => onSelectStep(step.id)}
                        onKeyDown={(e) => onKeyDown(e, step.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Step ${idx + 1}: ${step.label}, type ${step.type}, ${step.status === 'done' ? 'completed' : 'in progress'}`}
                        style={{
                            padding: '1rem',
                            borderRadius: 12,
                            cursor: 'pointer',
                            background:
                                selectedStepId === step.id
                                    ? 'rgba(59,130,246,0.15)'
                                    : 'transparent',
                            border: `1px solid ${selectedStepId === step.id ? 'rgba(59,130,246,0.5)' : 'transparent'}`,
                            transition: 'all 0.2s',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {selectedStepId === step.id && (
                            <motion.div
                                layoutId="step-indicator"
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 3,
                                    background: 'var(--accent)',
                                }}
                            />
                        )}
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background:
                                        step.status === 'done'
                                            ? 'rgba(16,185,129,0.1)'
                                            : 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {step.status === 'done' ? (
                                    <CheckCircle2 size={14} color="#10b981" />
                                ) : (
                                    <ClockSvg size={14} color="#64748b" />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: selectedStepId === step.id ? '#f8fafc' : '#e2e8f0',
                                    }}
                                >
                                    {step.label}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: selectedStepId === step.id ? '#93c5fd' : '#94a3b8',
                                    }}
                                >
                                    {step.duration}ms • {step.type}
                                </div>
                            </div>
                            {step.decision && (
                                <Brain
                                    size={14}
                                    color={selectedStepId === step.id ? '#60a5fa' : '#3b82f6'}
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div
            style={{
                padding: '1.25rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(59,130,246,0.03)',
            }}
        >
            <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}
            >
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Semantic Confidence</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)' }}>
                    {Math.round(trace.semanticConfidence * 100)}%
                </span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <div
                    style={{
                        height: '100%',
                        width: `${trace.semanticConfidence * 100}%`,
                        background: 'var(--success)',
                        borderRadius: 2,
                        transition: 'width 0.5s ease-out',
                    }}
                />
            </div>
        </div>
    </div>
);

export default MicroscopeTimeline;
