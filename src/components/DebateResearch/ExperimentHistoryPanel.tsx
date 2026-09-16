import { BarChart3, Trash2, Cpu } from 'lucide-react';
import type { RoutingExperimentRun } from '../../kernel/contracts/routing-experiments';

interface Props {
    history: RoutingExperimentRun[];
    results: RoutingExperimentRun['results'];
    onLoad: (run: RoutingExperimentRun) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

const ExperimentHistoryPanel: React.FC<Props> = ({
    history,
    results,
    onLoad,
    onDelete,
    onClose: _onClose,
}) => (
    <div
        style={{
            padding: '0.6rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            maxHeight: 180,
            overflowY: 'auto',
        }}
    >
        <div
            style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--slate-500)',
                marginBottom: '0.4rem',
            }}
        >
            Past Experiments
        </div>
        {history.map((h) => (
            <div
                key={h.id}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0.3rem 0.5rem',
                    borderRadius: 5,
                    marginBottom: 2,
                    cursor: 'pointer',
                    background: results === h.results ? 'rgba(245,158,11,0.08)' : 'transparent',
                }}
                onClick={() => onLoad(h)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onLoad(h);
                }}
                role="button"
                tabIndex={0}
            >
                <BarChart3 size={12} color="#f59e0b" />
                <span style={{ fontSize: '0.68rem', color: 'var(--slate-400)' }}>
                    {new Date(h.timestamp).toLocaleString()}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--slate-500)' }}>{h.totalRuns} runs</span>
                {h.realMode && <Cpu size={10} color="#a855f7" />}
                <span style={{ fontSize: '0.62rem', color: 'var(--slate-500)' }}>
                    ${h.estimatedCost.toFixed(2)}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(h.id);
                    }}
                    style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        padding: 2,
                    }}
                >
                    <Trash2 size={10} />
                </button>
            </div>
        ))}
    </div>
);

export default ExperimentHistoryPanel;
