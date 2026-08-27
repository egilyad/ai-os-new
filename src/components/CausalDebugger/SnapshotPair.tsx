import { preBlockMono } from '../../styles/common';
import { CARD } from './causal-debugger-constants';

interface Props {
    label: string;
    color: string;
    data: Record<string, unknown> | undefined;
}

const SnapshotPair: React.FC<Props> = ({ label, color, data }) => (
    <div style={CARD}>
        <div
            style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
            }}
        >
            {label}
        </div>
        <pre style={preBlockMono}>{JSON.stringify(data, null, 2).slice(0, 2000)}</pre>
    </div>
);

export default SnapshotPair;
