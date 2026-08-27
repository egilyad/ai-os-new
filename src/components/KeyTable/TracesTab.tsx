import { motion } from 'framer-motion';
import { routerService } from '../../kernel/instances';
import type { RouterDecision } from '../../kernel/instances';
import type { ApiKey } from '../../types/metrics';
import DecisionCard from './DecisionCard';

interface Props {
    keyId: string;
    stats: ApiKey['stats']['extended'];
}

const TracesTab: React.FC<Props> = ({ keyId, stats }) => {
    const decisions = (() => {
        try {
            return routerService.getSelectionTrace(keyId) as RouterDecision[];
        } catch {
            return [];
        }
    })();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
            {decisions.length > 0 && (
                <div>
                    <div
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            marginBottom: '0.75rem',
                            color: 'var(--text-primary)',
                        }}
                    >
                        Router Trace ({decisions.length} decisions)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {decisions.map((d) => (
                            <DecisionCard key={d.requestId} decision={d} keyId={keyId} />
                        ))}
                    </div>
                </div>
            )}
            <div>
                <div
                    style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        marginBottom: '0.75rem',
                        color: 'var(--text-primary)',
                    }}
                >
                    Execution Traces {stats ? `(${(stats.traces || []).length})` : ''}
                </div>
                {stats ? (
                    <table
                        style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}
                    >
                        <thead>
                            <tr
                                style={{
                                    textAlign: 'left',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <th style={{ padding: '0.75rem' }}>Trace ID</th>
                                <th style={{ padding: '0.75rem' }}>Task</th>
                                <th style={{ padding: '0.75rem' }}>Region</th>
                                <th style={{ padding: '0.75rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats.traces || []).map((t) => (
                                <tr
                                    key={t.traceId}
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                                >
                                    <td
                                        style={{
                                            padding: '0.75rem',
                                            color: 'var(--accent)',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {t.traceId}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{t.taskType}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                                        {t.region}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {t.status === 'ok' ? 'success' : t.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div
                        style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}
                    >
                        No traces available
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TracesTab;
