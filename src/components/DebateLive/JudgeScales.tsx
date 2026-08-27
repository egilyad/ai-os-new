import { motion } from 'framer-motion';

interface Props {
    proWeight: number;
    conWeight: number;
    neutralWeight?: number;
}

export const JudgeScales: React.FC<Props> = ({ proWeight, conWeight, neutralWeight = 0 }) => {
    const total = Math.max(proWeight + conWeight + neutralWeight, 0.01);
    const tilt = ((conWeight - proWeight) / total) * 30;

    return (
        <svg width={100} height={90} viewBox="0 0 100 90" style={{ display: 'block' }}>
            <rect x={42} y={75} width={16} height={8} rx={2} fill="#8b5cf6" />
            <circle cx={50} cy={75} r={4} fill="#8b5cf6" />
            <motion.g
                animate={{ rotate: tilt }}
                transition={{ type: 'spring', stiffness: 80, damping: 12, mass: 1.5 }}
                style={{ transformOrigin: '50px 20px' }}
            >
                <line
                    x1={25}
                    y1={20}
                    x2={75}
                    y2={20}
                    stroke="#fbbf24"
                    strokeWidth={3}
                    strokeLinecap="round"
                />
                <line x1={50} y1={20} x2={50} y2={28} stroke="#fbbf24" strokeWidth={2} />
                <path d="M10 35 L18 50 L2 50 Z" fill="#a78bfa" opacity={0.9} />
                <text x={10} y={46} textAnchor="middle" fill="white" fontSize={9} fontWeight={700}>
                    {proWeight.toFixed(1)}
                </text>
                <path d="M90 35 L82 50 L98 50 Z" fill="#f472b6" opacity={0.9} />
                <text x={90} y={46} textAnchor="middle" fill="white" fontSize={9} fontWeight={700}>
                    {conWeight.toFixed(1)}
                </text>
            </motion.g>
            <circle cx={50} cy={20} r={4} fill="#fbbf24">
                <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
            </circle>
        </svg>
    );
};
