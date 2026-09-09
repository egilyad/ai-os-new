import { motion } from 'framer-motion';
import type { Food } from '../types';

interface FoodParticleProps {
  food: Food;
}

const FoodParticle: React.FC<FoodParticleProps> = ({ food: f }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0 }} 
      animate={{ opacity: 1, scale: 1, y: `${f.y}%` }}
      style={{ 
        position: 'absolute', left: `${f.x}%`, top: 0, width: f.size, height: f.size, 
        background: 'var(--warning)', borderRadius: '50%', boxShadow: '0 0 10px #f59e0b', zIndex: 5 
      }} 
    />
  );
};

export default FoodParticle;
