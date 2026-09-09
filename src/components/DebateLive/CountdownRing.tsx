import { motion } from 'framer-motion';

interface Props {
    secondsTotal: number;
    secondsLeft: number;
    isActive: boolean;
}

export const CountdownRing: React.FC<Props> = ({ secondsLeft, secondsTotal, isActive }) => {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const progress = secondsTotal > 0 ? secondsLeft / secondsTotal : 0;
    const offset = circumference * (1 - progress);
    const color = secondsLeft > 20 ? '#10b981' : secondsLeft > 10 ? '#f59e0b' : '#ef4444';

    if (!isActive) return null;

    return (
        <svg
            width={80}
            height={80}
            style={{ position: 'absolute', top: -12, left: -12, pointerEvents: 'none' }}
        >
            <circle
                cx={40}
                cy={40}
                r={radius}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={3}
                fill="none"
            />
            <motion.circle
                cx={40}
                cy={40}
                r={radius}
                stroke={color}
                strokeWidth={3}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                animate={secondsLeft < 10 ? { opacity: [1, 0.4, 1] } : {}}
                transition={secondsLeft < 10 ? { duration: 0.5, repeat: Infinity } : {}}
            />
            <text
                x={40}
                y={46}
                textAnchor="middle"
                fill={color}
                fontSize={secondsLeft < 10 ? 16 : 14}
                fontWeight={700}
                style={{ transition: 'all 0.3s' }}
            >
                {Math.max(0, Math.ceil(secondsLeft))}
            </text>
        </svg>
    );
};
