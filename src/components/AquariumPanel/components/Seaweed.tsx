import { motion } from 'framer-motion';
import type { Seaweed as SeaweedState } from '../types';

interface SeaweedProps {
  seaweed: SeaweedState;
}

const Seaweed: React.FC<SeaweedProps> = ({ seaweed: s }) => {
  return (
    <motion.div
      style={{ 
        position: 'absolute', bottom: 0, left: `${s.left}%`, width: s.width, height: s.height,
        background: 'linear-gradient(to top, rgba(16,185,129,0.4), rgba(16,185,129,0.1))',
        borderRadius: '50% 50% 0 0', transformOrigin: 'bottom center', zIndex: 3, filter: 'blur(2px)', pointerEvents: 'none' 
      }}
      animate={{ rotateZ: [s.minRotate, s.maxRotate, s.minRotate] }}
      transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
    />
  );
};

export default Seaweed;
