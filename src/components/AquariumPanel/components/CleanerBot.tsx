import { motion } from 'framer-motion';

interface CleanerBotProps {
  x: number;
  y: number;
  direction: number;
}

const CleanerBot: React.FC<CleanerBotProps> = ({ x, y, direction }) => {
  return (
    <motion.div 
      animate={{ left: `${x}%`, top: `${y}%`, rotateY: direction === 1 ? 0 : 180 }}
      transition={{ type: 'tween', ease: 'linear', duration: 0.05 }}
      style={{ position: 'absolute', zIndex: 12, display: 'flex', alignItems: 'center', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.5))', pointerEvents: 'none' }}
    >
      <div style={{ background: 'var(--slate-700)', borderRadius: '20px 20px 5px 5px', width: 40, height: 25, position: 'relative', border: '2px solid #475569' }}>
        <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ position: 'absolute', top: 5, left: 25, width: 6, height: 6, background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />
        <div style={{ position: 'absolute', top: -12, left: 10, width: 4, height: 12, background: 'var(--slate-600)', borderRadius: '2px 2px 0 0' }} />
        <div style={{ position: 'absolute', top: 10, left: 15, width: 8, height: 8, borderRadius: '50%', background: 'var(--slate-900)', border: '2px solid #64748b' }} />
        <motion.div animate={{ rotateZ: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', top: 12, right: -4, width: 4, height: 12, background: 'var(--slate-400)', borderRadius: 2, transformOrigin: 'center' }} />
      </div>
    </motion.div>
  );
};

export default CleanerBot;
