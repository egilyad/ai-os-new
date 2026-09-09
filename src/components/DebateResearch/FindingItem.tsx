import React from 'react';
import { FileCode, ArrowRight, Lightbulb } from 'lucide-react';
import type { ArchFinding } from '../../kernel/contracts/architecture-review';

interface FindingItemProps {
    finding: ArchFinding;
    index: number;
    onNavigateFile: (path: string) => void;
    onCreateHypothesis: (source: string, title: string) => void;
}

const FindingItem: React.FC<FindingItemProps> = ({
    finding: f,
    index,
    onNavigateFile,
    onCreateHypothesis,
}) => (
    <div
        style={{
            padding: '0.5rem 0.85rem',
            borderTop: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 7,
        }}
    >
        <span style={{ fontSize: '0.6rem', color: 'var(--slate-600)', marginTop: 2, minWidth: 20 }}>
            #{index + 1}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <span
                    style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: 'var(--slate-400)',
                        padding: '0.1rem 0.35rem',
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.04)',
                    }}
                >
                    {f.category}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-300)' }}>{f.message}</span>
            </div>
            {f.file && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FileCode size={10} color="#60a5fa" />
                    <span
                        onClick={() => onNavigateFile(f.file!)}
                        style={{
                            fontSize: '0.68rem',
                            color: '#60a5fa',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            borderBottom: '1px dashed rgba(59,130,246,0.2)',
                        }}
                    >
                        {f.file}
                    </span>
                    {f.value && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)', marginLeft: 'auto' }}>
                            {f.value}
                        </span>
                    )}
                    <button
                        onClick={() => onCreateHypothesis(f.file!, f.message)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#a855f7',
                            cursor: 'pointer',
                            padding: '1px 4px',
                            borderRadius: 3,
                            fontSize: '0.62rem',
                            opacity: 0.6,
                        }}
                    >
                        <Lightbulb size={10} />
                    </button>
                </div>
            )}
            {f.items && f.items.length > 1 && f.category !== 'Duplicate' && (
                <div
                    style={{
                        marginTop: 3,
                        padding: '0.3rem 0.5rem',
                        borderRadius: 5,
                        background: 'rgba(239,68,68,0.05)',
                    }}
                >
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}
                    >
                        {f.items.map((item, idx) => (
                            <React.Fragment key={item}>
                                <span
                                    onClick={() => onNavigateFile(item)}
                                    style={{
                                        fontSize: '0.62rem',
                                        color: 'var(--slate-400)',
                                        fontFamily: 'monospace',
                                        cursor: 'pointer',
                                        borderBottom: '1px dashed rgba(148,163,184,0.2)',
                                    }}
                                >
                                    {item.split('/').pop()}
                                </span>
                                {idx < f.items!.length - 1 && (
                                    <ArrowRight size={10} color="#ef444460" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
            {f.items && f.items.length === 2 && f.category === 'Duplicate' && (
                <div style={{ marginTop: 3, display: 'flex', gap: 4 }}>
                    {f.items.map((item) => (
                        <span
                            key={item}
                            onClick={() => onNavigateFile(item)}
                            style={{
                                fontSize: '0.62rem',
                                color: '#60a5fa',
                                fontFamily: 'monospace',
                                padding: '0.1rem 0.35rem',
                                borderRadius: 3,
                                background: 'rgba(59,130,246,0.06)',
                                cursor: 'pointer',
                                borderBottom: '1px dashed rgba(59,130,246,0.2)',
                            }}
                        >
                            {item.split('/').pop()}
                        </span>
                    ))}
                </div>
            )}
        </div>
    </div>
);

export default FindingItem;
