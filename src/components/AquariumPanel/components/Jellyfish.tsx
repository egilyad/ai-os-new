import { motion } from 'framer-motion';
import type { Jellyfish as JellyfishState } from '../types';

interface JellyfishProps {
    jellyfish: JellyfishState;
}

const Jellyfish: React.FC<JellyfishProps> = ({ jellyfish: j }) => {
    return (
        <motion.div
            initial={{ y: '120%', left: `${j.x}%`, opacity: 0 }}
            animate={{ y: '-30%', opacity: [0, 0.4, 0.4, 0] }}
            transition={{
                y: { duration: j.speed, repeat: Infinity, ease: 'linear', delay: j.delay },
                opacity: { duration: j.speed, repeat: Infinity, ease: 'linear', delay: j.delay },
            }}
            style={{
                position: 'absolute',
                width: j.size,
                height: j.size,
                zIndex: 2,
                filter: 'blur(1.5px)',
                pointerEvents: 'none',
            }}
        >
            <motion.div
                animate={{ scaleY: [0.9, 1.1, 0.9] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    width: '100%',
                    height: '40%',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '50% 50% 20% 20%',
                    borderTop: '2px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 -5px 15px rgba(255,255,255,0.1)',
                }}
            />
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    width: '70%',
                    margin: '0 auto',
                }}
            >
                {j.tentacles.map((t, i) => (
                    <motion.div
                        key={`t-${i}`}
                        animate={{ height: [t.minHeight, t.maxHeight, t.minHeight] }}
                        transition={{ duration: t.duration, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ width: 2, background: 'var(--border-default)', borderRadius: 2 }}
                    />
                ))}
            </div>
        </motion.div>
    );
};

export default Jellyfish;
