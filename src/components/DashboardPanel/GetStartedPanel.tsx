import React from 'react';
import { Key, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n/useTranslation';

interface GetStartedPanelProps {
    show: boolean;
    onNavigate: (page: string) => void;
}

const GetStartedPanel: React.FC<GetStartedPanelProps> = ({ show, onNavigate }) => {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    style={{
                        display: 'flex',
                        gap: '1.5rem',
                        padding: '1.5rem',
                        borderRadius: 16,
                        border: '1px solid rgba(59,130,246,0.4)',
                        background:
                            'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%)',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 14,
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
                        }}
                    >
                        <MessageSquare size={26} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                color: 'var(--slate-50)',
                                marginBottom: '0.25rem',
                            }}
                        >
                            {t('onboarding.dashboard_get_started_title')}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', lineHeight: 1.5 }}>
                            {t('onboarding.dashboard_get_started_body')}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                        <button
                            onClick={() => onNavigate('chat')}
                            style={{
                                padding: '0.6rem 1.1rem',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: 10,
                                cursor: 'pointer',
                                color: 'var(--slate-200)',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            {t('onboarding.dashboard_explore')}
                        </button>
                        <button
                            onClick={() => onNavigate('keys')}
                            style={{
                                padding: '0.6rem 1.1rem',
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                                color: 'white',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Key size={15} />
                            {t('onboarding.dashboard_add_key')}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GetStartedPanel;
