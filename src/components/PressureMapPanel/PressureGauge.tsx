import { pLevelColor } from './pressure-map-constants';

interface Props {
    score: number;
}

const PressureGauge: React.FC<Props> = ({ score }) => {
    const level =
        score >= 0.8 ? 'critical' : score >= 0.6 ? 'high' : score >= 0.35 ? 'normal' : 'low';
    const c = pLevelColor(level);
    const r = 36;
    const circ = 2 * Math.PI * r;
    const offset = circ - score * circ;
    return (
        <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
            <circle
                cx={40}
                cy={40}
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={6}
            />
            <circle
                cx={40}
                cy={40}
                r={r}
                fill="none"
                stroke={c.text}
                strokeWidth={6}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
        </svg>
    );
};

export default PressureGauge;
