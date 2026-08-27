import { motion } from 'framer-motion';

interface Position {
    x: number;
    y: number;
}

interface Props {
    fromPos: Position;
    toPos: Position;
    color: string;
}

export const EyeLine: React.FC<Props> = ({ fromPos, toPos, color }) => {
    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 8,
            }}
        >
            <defs>
                <marker
                    id={`arrow-${color.replace('#', '')}`}
                    markerWidth={8}
                    markerHeight={6}
                    refX={8}
                    refY={3}
                    orient="auto"
                >
                    <path d="M0,0 L8,3 L0,6 Z" fill={color} />
                </marker>
            </defs>
            <motion.line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="4,4"
                markerEnd={`url(#arrow-${color.replace('#', '')})`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.15))' }}
            />
        </svg>
    );
};
