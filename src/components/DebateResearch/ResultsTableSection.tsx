import { ArrowUp, ArrowDown } from 'lucide-react';
import type { RoutingExperimentResult } from '../../kernel/contracts/routing-experiments';

interface Props {
    sortedResults: RoutingExperimentResult[];
    thStyle: React.CSSProperties;
    tdStyle: React.CSSProperties;
    toggleSort: (col: string) => void;
    sortCol: string;
    sortDir: 'asc' | 'desc';
    running: boolean;
}

const COLUMNS = [
    { key: 'avgLatency', label: 'Latency' },
    { key: 'avgTokens', label: 'Tokens' },
    { key: 'errorRate', label: 'Error%' },
    { key: 'cost', label: 'Cost' },
    { key: 'repetition', label: 'Rep%' },
    { key: 'uniqueness', label: 'Unique%' },
] as const;

const ResultsTableSection: React.FC<Props> = ({
    sortedResults,
    thStyle,
    tdStyle,
    toggleSort,
    sortCol,
    sortDir,
    running,
}) => {
    if (sortedResults.length === 0) {
        return (
            <div style={{ flex: 1, overflow: 'auto', padding: '0.75rem 1.25rem' }}>
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-600)' }}>
                    {running
                        ? 'Running experiment cells...'
                        : 'Select providers, models, and strategies, then run.'}
                </div>
            </div>
        );
    }

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: '0.75rem 1.25rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ ...thStyle, textAlign: 'left' }}>Provider</th>
                        <th style={{ ...thStyle, textAlign: 'left' }}>Model</th>
                        <th style={{ ...thStyle, textAlign: 'left' }}>Strategy</th>
                        {COLUMNS.map((col) => (
                            <th key={col.key} onClick={() => toggleSort(col.key)} style={thStyle}>
                                {col.label}
                                {sortCol === col.key &&
                                    (sortDir === 'asc' ? (
                                        <ArrowUp
                                            size={9}
                                            style={{ marginLeft: 1, display: 'inline' }}
                                        />
                                    ) : (
                                        <ArrowDown
                                            size={9}
                                            style={{ marginLeft: 1, display: 'inline' }}
                                        />
                                    ))}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedResults.map((r, i) => (
                        <tr
                            key={`${r.provider}-${r.model}`}
                            style={{
                                background: i % 2 === 0 ? 'rgba(0,0,0,0.08)' : 'transparent',
                            }}
                        >
                            <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--warning)' }}>
                                {r.provider}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'left', color: '#60a5fa' }}>
                                {r.model}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'left', color: 'var(--slate-400)' }}>
                                {r.strategy}
                            </td>
                            <td style={tdStyle}>{r.avgLatency}ms</td>
                            <td style={tdStyle}>{r.avgTokens}</td>
                            <td
                                style={{
                                    ...tdStyle,
                                    color: r.errorRate > 0.2 ? '#ef4444' : '#10b981',
                                }}
                            >
                                {(r.errorRate * 100).toFixed(0)}%
                            </td>
                            <td style={tdStyle}>${r.cost.toFixed(3)}</td>
                            <td
                                style={{
                                    ...tdStyle,
                                    color: r.repetition > 0.3 ? '#ef4444' : '#10b981',
                                }}
                            >
                                {(r.repetition * 100).toFixed(0)}%
                            </td>
                            <td style={tdStyle}>{r.uniqueness}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ResultsTableSection;
