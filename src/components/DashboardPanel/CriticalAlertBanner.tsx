import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n/useTranslation';
import { flex1 } from '../../styles/common';

interface CriticalAlertBannerProps {
    show: boolean;
    providerErrors: number;
    violations: number;
    fallbackEnabled: boolean;
    onNavigate: (page: string) => void;
}

const CriticalAlertBanner: React.FC<CriticalAlertBannerProps> = ({
    show,
    providerErrors,
    violations,
    fallbackEnabled,
    onNavigate,
}) => {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center',
                        padding: '1.25rem 1.5rem',
                        borderRadius: 16,
                        border: '1px solid rgba(239,68,68,0.3)',
                        background:
                            'linear-gradient(90deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.02) 100%)',
                        overflow: 'hidden',
                    }}
                    role="alert"
                    aria-live="polite"
                >
                    <ShieldAlert size={24} color="#ef4444" aria-hidden="true" />
                    <div style={flex1}>
                        <div
                            style={{
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                color: '#fca5a5',
                                marginBottom: '0.2rem',
                            }}
                        >
                            {t('dashboard.system_attention_required')}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#fecaca', opacity: 0.8 }}>
                            {t('dashboard.alert_provider_errors', {
                                errors: providerErrors,
                                violations,
                                fallback: fallbackEnabled
                                    ? t('common.active')
                                    : t('common.disabled'),
                            })}
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate('events')}
                        style={{
                            padding: '0.6rem 1rem',
                            borderRadius: 10,
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'var(--error-tint)',
                            color: '#fca5a5',
                            cursor: 'pointer',
                            fontWeight: 700,
                        }}
                        aria-label={t('dashboard.review_logs_aria')}
                    >
                        {t('dashboard.review_logs')}
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CriticalAlertBanner;
