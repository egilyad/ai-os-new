import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { useUiPreferences } from '../../stores/uiPreferencesStore';
import type { TranslationKey } from '../../i18n/translations';

interface Props {
    t: (key: TranslationKey) => string;
}

const DoneStep: React.FC<Props> = ({ t }) => {
    const navigate = useNavigate();
    const { setOnboardingCompleted } = useUiPreferences();
    return (
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
                }}
            >
                <Check size={32} color="white" />
            </motion.div>
            <h2
                style={{
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    margin: '0 0 0.5rem',
                    color: 'var(--text-primary)',
                }}
            >
                {t('onboarding.done_title')}
            </h2>
            <p
                style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    margin: '0 0 1.5rem',
                    lineHeight: 1.6,
                }}
            >
                {t('onboarding.done_subtitle')}
            </p>
            <button
                onClick={() => {
                    setOnboardingCompleted(true);
                    navigate('/chat');
                }}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: 'none',
                    borderRadius: 10,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
                }}
            >
                {t('onboarding.start_chatting')} <ChevronRight size={18} />
            </button>
        </div>
    );
};

export default DoneStep;
