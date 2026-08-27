import { motion } from 'framer-motion';
import { useDebateLiveStore } from '../../stores/debateLiveStore';
import type { TopologyNode } from '../../kernel/contracts/debate-runtime';
import { JudgeScales } from './JudgeScales';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';

interface Props {
    judge: TopologyNode;
    sessionId: string;
    phase: string;
}

export const JudgeCenter: React.FC<Props> = ({ judge, phase }) => {
    const isEvaluating = phase === 'consensus' || phase === 'summarizing';
    const judgeWeights = useDebateLiveStore((s) => s.judgeWeights);

    return (
        <motion.div
            animate={{
                scale: isEvaluating ? 1.1 : 1,
                boxShadow: isEvaluating
                    ? '0 0 30px rgba(251,191,36,0.5), 0 0 60px rgba(251,191,36,0.2)'
                    : '0 0 10px rgba(255,255,255,0.1)',
            }}
            transition={{ type: 'spring', damping: 15, stiffness: 150 }}
            style={{
                width: 80,
                height: 100,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                border: '1px solid rgba(251,191,36,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                left: '50%',
                top: '50%',
                marginLeft: -40,
                marginTop: -50,
                zIndex: 5,
                cursor: 'default',
                gap: 4,
            }}
        >
            <JudgeScales
                proWeight={judgeWeights.pro}
                conWeight={judgeWeights.con}
                neutralWeight={judgeWeights.neutral}
            />
            <span
                style={{
                    color: 'var(--warning)',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    textAlign: 'center',
                    lineHeight: 1.2,
                }}
            >
                {resolveAgentIdentity(judge.id).displayName}
            </span>
        </motion.div>
    );
};
