import { ChevronDown, ChevronRight, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { ArchFinding } from '../../kernel/contracts/architecture-review';
import { typeColor } from './arch-review-utils';
import FindingItem from './FindingItem';

interface FindingCategoryProps {
    type: string;
    items: ArchFinding[];
    expanded: boolean;
    onToggle: () => void;
    onNavigateFile: (path: string) => void;
    onCreateHypothesis: (source: string, title: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
    error: <AlertCircle size={14} color="#ef4444" />,
    warning: <AlertTriangle size={14} color="#f59e0b" />,
    info: <Info size={14} color="#60a5fa" />,
};

const FindingCategory: React.FC<FindingCategoryProps> = ({
    type,
    items,
    expanded,
    onToggle,
    onNavigateFile,
    onCreateHypothesis,
}) => {
    if (items.length === 0) return null;
    return (
        <div
            style={{
                marginBottom: '0.6rem',
                borderRadius: 10,
                border: `1px solid ${typeColor(type)}15`,
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
                    background: `${typeColor(type)}06`,
                }}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onToggle();
                }}
                role="button"
                tabIndex={0}
            >
                {expanded ? (
                    <ChevronDown size={12} color="#64748b" />
                ) : (
                    <ChevronRight size={12} color="#64748b" />
                )}
                {ICON_MAP[type] || null}
                <span
                    style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: typeColor(type),
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                    }}
                >
                    {type}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                    {items.length} findings
                </span>
            </div>
            {expanded &&
                items.map((f, i) => (
                    <FindingItem
                        key={f.file ?? f.message}
                        finding={f}
                        index={i}
                        onNavigateFile={onNavigateFile}
                        onCreateHypothesis={onCreateHypothesis}
                    />
                ))}
        </div>
    );
};

export default FindingCategory;
