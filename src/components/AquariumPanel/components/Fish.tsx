import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FishState } from '../types';
import ProviderAquariumShape from './ProviderAquariumShape';

interface FishProps {
  fish: FishState;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  providerData?: {
    status?: string;
    reputationScore?: number;
    successCount?: number;
    errorCount?: number;
    avgLatency?: number;
    model?: string;
  };
}

const Fish: React.FC<FishProps> = ({ fish: f, isSelected, onSelect, t, providerData }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isDead = f.status !== 'active';
  const totalRequests = (providerData?.successCount || 0) + (providerData?.errorCount || 0);
  const successRate = totalRequests > 0 ? Math.round(((providerData?.successCount || 0) / totalRequests) * 100) : 0;

  return (
    <motion.div
      animate={{ left: `${f.x}%`, top: `${f.y}%`, scale: isSelected ? 1.4 : 1, rotateY: f.direction === 1 ? 0 : 180, rotateZ: isDead ? 180 : 0 }}
      transition={{ type: 'spring', stiffness: 40, damping: 15 }}
      onClick={() => onSelect(isSelected ? null : f.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(isSelected ? null : f.id); } }}
      style={{ position: 'absolute', cursor: 'pointer', zIndex: isSelected ? 100 : 10, transformOrigin: 'center', opacity: isDead ? 0.6 : 1, filter: isDead ? 'grayscale(0.8)' : 'none' }}
      role="button" tabIndex={0} aria-label={`${f.provider}: ${f.status === 'active' ? t('common.active') : t('common.not_available')}, ${Math.round(f.energy)}%`}
    >
      <motion.div animate={f.isPulsing ? { scale: [1, 1.3, 1], filter: [`drop-shadow(0 0 10px ${f.color})`, `drop-shadow(0 0 30px ${f.color})`, `drop-shadow(0 0 10px ${f.color})`] } : {}} style={{ position: 'relative' }}>
        <motion.div animate={isDead ? {} : { rotateZ: [-5, 5, -5] }} transition={{ duration: f.wagDuration, repeat: Infinity, ease: 'easeInOut' }}>
          <ProviderAquariumShape provider={f.provider} size={42 * f.scale} color={f.color} energy={f.energy} />
        </motion.div>
        {f.isPulsing && (
          <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3, opacity: 0 }}
            style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${f.color}`, pointerEvents: 'none' }} />
        )}
        <div className="aquarium-fish-label" style={{ background: isSelected ? f.color : 'rgba(0,0,0,0.6)', border: `1px solid ${f.color}44`, boxShadow: isSelected ? `0 0 15px ${f.color}66` : 'none' }}>
          {f.provider}
        </div>
        <div className="aquarium-energy-bar-bg" title={t('aquarium.energy_tooltip', { value: Math.round(f.energy) })}>
          <div className="aquarium-energy-bar-fill" style={{ width: `${f.energy}%`, background: f.color }} />
        </div>
        <AnimatePresence>
          {isHovered && !isSelected && providerData && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                marginBottom: 8, padding: '8px 12px', borderRadius: 10,
                background: 'rgba(15,23,42,0.95)', border: `1px solid ${f.color}44`,
                boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${f.color}22`,
                pointerEvents: 'none', zIndex: 200, whiteSpace: 'nowrap',
                fontSize: '0.65rem', color: 'var(--slate-200)', lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.75rem', color: f.color, marginBottom: 4 }}>
                {f.provider}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
                <span style={{ color: 'var(--slate-500)' }}>Status:</span>
                <span style={{ color: f.status === 'active' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                  {f.status === 'active' ? 'Online' : 'Offline'}
                </span>
                <span style={{ color: 'var(--slate-500)' }}>Health:</span>
                <span style={{ color: successRate > 90 ? '#10b981' : successRate > 70 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
                  {successRate}%
                </span>
                <span style={{ color: 'var(--slate-500)' }}>Latency:</span>
                <span>{Math.round(providerData.avgLatency || 0)}ms</span>
                <span style={{ color: 'var(--slate-500)' }}>Requests:</span>
                <span>{totalRequests.toLocaleString()}</span>
                {providerData.model && (
                  <>
                    <span style={{ color: 'var(--slate-500)' }}>Model:</span>
                    <span style={{ color: 'var(--slate-400)' }}>{providerData.model.split('/').pop()}</span>
                  </>
                )}
              </div>
              {providerData.errorCount ? (
                <div style={{ marginTop: 4, color: 'var(--error)', fontSize: '0.6rem' }}>
                  {providerData.errorCount} error{providerData.errorCount !== 1 ? 's' : ''}
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {f.lastWords && (
            <motion.div initial={{ opacity: 0, scale: 0.5, y: 10 }} animate={{ opacity: 1, scale: 1, y: Math.max(-60, -(f.y * 0.6)) }} exit={{ opacity: 0, scale: 0.5 }}
              className="aquarium-speech-bubble" style={{ border: `1px solid ${f.color}` }}>
              {f.lastWords}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default Fish;
