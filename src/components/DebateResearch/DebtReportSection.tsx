import {
    ChevronDown,
    ChevronRight,
    FileWarning,
    CheckCircle2,
    Circle,
    Lightbulb,
} from 'lucide-react';
import type { ArchDebtItem } from '../../kernel/contracts/architecture-review';

interface DebtReportSectionProps {
    debtItems: ArchDebtItem[];
    open: boolean;
    onToggle: () => void;
    onNavigateFile: (path: string) => void;
    onCreateHypothesis: (source: string, title: string) => void;
}

const priorityColor = (p: string) => (p === 'P0' ? '#ef4444' : p === 'P1' ? '#f59e0b' : '#60a5fa');

const priorityBg = (p: string) =>
    p === 'P0'
        ? 'rgba(239,68,68,0.15)'
        : p === 'P1'
          ? 'rgba(245,158,11,0.15)'
          : 'rgba(59,130,246,0.1)';

const DebtReportSection: React.FC<DebtReportSectionProps> = ({
    debtItems,
    open,
    onToggle,
    onNavigateFile,
    onCreateHypothesis,
}) => (
    <div style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <div
            style={{
                marginBottom: '0.5rem',
                borderRadius: 10,
                border: '1px solid rgba(234,179,8,0.15)',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    padding: '0.55rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    cursor: 'pointer',
                    background: 'rgba(234,179,8,0.05)',
                }}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onToggle();
                }}
                role="button"
                tabIndex={0}
            >
                {open ? (
                    <ChevronDown size={12} color="#64748b" />
                ) : (
                    <ChevronRight size={12} color="#64748b" />
                )}
                <FileWarning size={14} color="#f59e0b" />
                <span
                    style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--warning)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                    }}
                >
                    Debt Report
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                    {debtItems.filter((d) => d.status === 'open').length} open
                </span>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                    {debtItems.filter((d) => d.status === 'resolved').length > 0 && (
                        <CheckCircle2 size={12} color="#10b981" />
                    )}
                    <Circle size={12} color="#f59e0b" />
                </span>
            </div>
            {open &&
                debtItems.map((d, i) => (
                    <div
                        key={d.id}
                        style={{
                            padding: '0.5rem 0.85rem',
                            borderTop: '1px solid rgba(255,255,255,0.03)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 7,
                        }}
                    >
                        <span
                            style={{
                                fontSize: '0.6rem',
                                color: 'var(--slate-600)',
                                marginTop: 2,
                                minWidth: 20,
                            }}
                        >
                            #{i + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    marginBottom: 2,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: 3,
                                        background: priorityBg(d.priority),
                                        color: priorityColor(d.priority),
                                    }}
                                >
                                    {d.priority}
                                </span>
                                <span
                                    style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        color: 'var(--slate-300)',
                                    }}
                                >
                                    {d.id}: {d.title}
                                </span>
                                {d.effort && (
                                    <span style={{ fontSize: '0.62rem', color: 'var(--slate-500)' }}>
                                        ({d.effort})
                                    </span>
                                )}
                                <button
                                    onClick={() =>
                                        onCreateHypothesis(
                                            'docs/DEBT_REPORT.md',
                                            `${d.id}: ${d.title}`,
                                        )
                                    }
                                    style={{
                                        marginLeft: 'auto',
                                        background: 'var(--purple-tint)',
                                        border: '1px solid rgba(139,92,246,0.2)',
                                        color: '#a855f7',
                                        cursor: 'pointer',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontSize: '0.62rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 3,
                                    }}
                                >
                                    <Lightbulb size={10} /> Hypothesis
                                </button>
                            </div>
                            {d.description && (
                                <div
                                    style={{
                                        fontSize: '0.68rem',
                                        color: 'var(--slate-400)',
                                        marginBottom: 3,
                                    }}
                                >
                                    {d.description}
                                </div>
                            )}
                            {d.files.length > 0 && (
                                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                    {d.files.map((f) => (
                                        <span
                                            key={f}
                                            onClick={() => onNavigateFile(f)}
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
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
        </div>
    </div>
);

export default DebtReportSection;
