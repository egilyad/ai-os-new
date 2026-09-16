import { scoreColor, barStyle, fillBar } from './obs-gaps-constants';

interface Props {
    eventScore: number;
    loggerScore: number;
    healthScore: number;
    tracingScore: number;
    lifecycleScore: number;
    withEvents: number;
    withLogger: number;
    withHealth: number;
    withTracing: number;
    withLifecycle: number;
    total: number;
}

const BARS = [
    { label: 'Events', key: 'eventScore' as const, color: '#a855f7' },
    { label: 'Logger', key: 'loggerScore' as const, color: 'var(--accent)' },
    { label: 'Health', key: 'healthScore' as const, color: 'var(--success)' },
    { label: 'Tracing', key: 'tracingScore' as const, color: '#06b6d4' },
    { label: 'Lifecycle', key: 'lifecycleScore' as const, color: 'var(--warning)' },
];

const CoverageBars: React.FC<Props> = (props) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            marginBottom: '1rem',
        }}
    >
        {BARS.map(({ label, key, color }) => {
            const score = props[key];
            const countKey = `with${label}` as keyof Props;
            const count = props[countKey] as number;
            return (
                <div key={label}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.7rem',
                            marginBottom: '0.15rem',
                        }}
                    >
                        <span style={{ color: 'var(--slate-400)', fontWeight: 600 }}>{label}</span>
                        <span style={{ color: scoreColor(score), fontWeight: 700 }}>
                            {score}% ({count}/{props.total})
                        </span>
                    </div>
                    <div style={barStyle}>
                        <div style={fillBar(score, color)} />
                    </div>
                </div>
            );
        })}
    </div>
);

export default CoverageBars;
