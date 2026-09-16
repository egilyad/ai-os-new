import { motion } from 'framer-motion';
import type { Bubble as BubbleState } from '../types';

interface BubbleProps {
  bubble: BubbleState;
}

const Bubble: React.FC<BubbleProps> = ({ bubble: b }) => {
  return (
    <motion.div 
      initial={{ y: b.type === 'data' ? `${b.y}%` : '110%', left: `${b.x}%`, opacity: 0 }}
      animate={{ y: '-10%', opacity: b.type === 'data' ? [0, 0.8, 0] : [0, 0.4, 0.4, 0], scale: b.type === 'data' ? [0.5, 1.5, 0.8] : 1 }}
      transition={{ duration: b.duration, repeat: b.type === 'data' ? 0 : Infinity, ease: 'linear', delay: b.delay }}
      style={{ 
        position: 'absolute', width: b.size, height: b.size, borderRadius: '50%',
        background: b.type === 'data' ? '#3b82f6' : 'rgba(255,255,255,0.4)',
        border: `1px solid ${b.type === 'data' ? '#60a5fa' : 'rgba(255,255,255,0.2)'}`,
        filter: b.type === 'data' ? 'blur(1px) drop-shadow(0 0 5px #3b82f6)' : 'blur(0.5px)', zIndex: 2 
      }}
    />
  );
};

export default Bubble;
