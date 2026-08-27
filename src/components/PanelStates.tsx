import { motion } from 'framer-motion';
import { Loader2, Inbox } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const PanelLoading: React.FC<{ label?: string; full?: boolean }> = ({ label, full = true }) => {
  const { t } = useTranslation();
  const height = full ? '100%' : '12rem';
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height,
        color: 'var(--slate-400)',
        fontSize: '0.85rem',
      }}
    >
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ display: 'flex' }}
        >
          <Loader2 size={20} aria-hidden />
        </motion.div>
        <span>{label ?? t('common.loading')}</span>
      </motion.div>
    </div>
  );
};

export interface PanelEmptyAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface PanelEmptyProps {
  icon?: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>;
  title?: string;
  message: string;
  action?: PanelEmptyAction;
  full?: boolean;
}

export const PanelEmpty: React.FC<PanelEmptyProps> = ({ icon: Icon = Inbox, title, message, action, full = true }) => {
  const height = full ? '100%' : '12rem';
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height,
        padding: '2rem',
        color: 'var(--slate-400)',
        textAlign: 'center',
        gap: '0.75rem',
      }}
    >
      <Icon size={36} color="#475569" />
      {title && (
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--slate-300)' }}>{title}</div>
      )}
      <div style={{ fontSize: '0.85rem', maxWidth: 420 }}>{message}</div>
      {action && (
        <button
          onClick={action.onClick}
          className={action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'}
          style={{ marginTop: '0.5rem' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
