import type { ConsistencyReport } from '../../kernel/contracts/truth-consistency';
import { SMALL_BUTTON } from './causal-debugger-constants';

interface Props {
    report: ConsistencyReport | null;
    onCheck: () => void;
}

const statusStyle = (status: string): React.CSSProperties => ({
    padding: '0.1rem 0.35rem',
    borderRadius: 4,
    background:
        status === 'OK'
            ? 'rgba(34,197,94,0.1)'
            : status === 'DRIFT'
              ? 'rgba(245,158,11,0.1)'
              : 'rgba(239,68,68,0.1)',
    color: status === 'OK' ? '#22c55e' : status === 'DRIFT' ? '#f59e0b' : '#ef4444',
    fontWeight: 600,
});

const severityColor = (severity: string): string =>
    severity === 'critical' ? '#ef4444' : severity === 'major' ? '#f59e0b' : '#94a3b8';

const ConsistencyCheckSection: React.FC<Props> = ({ report, onCheck }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button
            onClick={onCheck}
            style={{
                ...SMALL_BUTTON,
                border: '1px solid rgba(99,102,241,0.3)',
                background: 'rgba(99,102,241,0.08)',
                color: '#818cf8',
            }}
        >
            Check Consistency
        </button>
        {report && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.65rem' }}>
                <span style={statusStyle(report.status)}>{report.status}</span>
                <span style={{ color: 'var(--slate-500)' }}>
                    drift{' '}
                    {report.driftScore > 0.01 ? (report.driftScore * 100).toFixed(0) + '%' : '0%'}
                </span>
                <span style={{ color: 'var(--slate-500)' }}>
                    {report.mismatches.length} mismatch{report.mismatches.length !== 1 ? 'es' : ''}
                </span>
                {report.mismatches.length > 0 && (
                    <span style={{ color: 'var(--slate-400)' }}>
                        ({report.mismatches.filter((m) => m.severity === 'critical').length}{' '}
                        critical, {report.mismatches.filter((m) => m.severity === 'major').length}{' '}
                        major)
                    </span>
                )}
            </div>
        )}
        {report && report.mismatches.length > 0 && (
            <div
                style={{
                    fontSize: '0.6rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    marginTop: 4,
                }}
            >
                {report.mismatches.slice(0, 5).map((m) => (
                    <div
                        key={`${m.provider}-${m.field}`}
                        style={{ color: severityColor(m.severity) }}
                    >
                        {m.provider}.{m.field}: kernel={String(m.kernelValue).slice(0, 30)} proj=
                        {String(m.projectionValue).slice(0, 30)} [{m.severity}]
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default ConsistencyCheckSection;
