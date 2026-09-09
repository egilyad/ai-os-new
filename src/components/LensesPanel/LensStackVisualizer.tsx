import React from 'react';
import { Layers, X, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Lens } from '../../kernel/types/lens-types';
import type { ValidationResult } from '../../kernel/contracts/lens-engine';

interface LensStackVisualizerProps {
    stack: Lens[];
    validation?: ValidationResult;
    onRemove?: (lensId: string) => void;
    emptyText?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
    analytical: '#8b5cf6',
    ethical: '#10b981',
    temporal: '#06b6d4',
    domain: '#f59e0b',
    risk: '#ef4444',
    stakeholder: '#ec4899',
};

const LensStackVisualizer: React.FC<LensStackVisualizerProps> = ({
    stack,
    validation,
    onRemove,
    emptyText,
}) => {
    const { t } = useTranslation();

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '0.5rem',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0 0.25rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    color: 'var(--slate-500)',
                }}
            >
                <Layers size={12} />
                <span>{t('lenses.stack')}</span>
                <span style={{ opacity: 0.7 }}>({stack.length}/5)</span>
            </div>

            {stack.length === 0 ? (
                <div
                    style={{
                        padding: '0.75rem',
                        borderRadius: 6,
                        border: '1px dashed rgba(255,255,255,0.1)',
                        color: 'var(--slate-600)',
                        fontSize: '0.75rem',
                        textAlign: 'center',
                    }}
                >
                    {emptyText || t('lenses.stack_empty')}
                </div>
            ) : (
                stack.map((lens, idx) => {
                    const color = CATEGORY_COLORS[lens.category] ?? '#8b5cf6';
                    return (
                        <div
                            key={lens.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '0.4rem 0.6rem',
                                borderRadius: 6,
                                background: 'rgba(0,0,0,0.25)',
                                borderLeft: `3px solid ${color}`,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color,
                                    minWidth: 16,
                                    textAlign: 'center',
                                }}
                            >
                                {idx + 1}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: '0.78rem',
                                        fontWeight: 600,
                                        color: 'var(--slate-200)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {lens.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {lens.description}
                                </div>
                            </div>
                            {onRemove && (
                                <button
                                    onClick={() => onRemove(lens.id)}
                                    title={t('lenses.remove')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--slate-500)',
                                        cursor: 'pointer',
                                        padding: 2,
                                        borderRadius: 4,
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    );
                })
            )}

            {validation && validation.errors.length > 0 && (
                <div
                    style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: 6,
                        background: 'var(--error-tint)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 6,
                    }}
                >
                    <AlertTriangle
                        size={12}
                        color="#f87171"
                        style={{ marginTop: 1, flexShrink: 0 }}
                    />
                    <div style={{ fontSize: '0.7rem', color: '#fca5a5', lineHeight: 1.4 }}>
                        {validation.errors.map((e) => (
                            <div key={e}>{e}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LensStackVisualizer;
