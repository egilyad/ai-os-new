import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { keyService } from '../../kernel/instances';
import { useUiPreferences } from '../../stores/uiPreferencesStore';
import type { TranslationKey } from '../../i18n/translations';
import WelcomeStep from './WelcomeStep';
import AddConnectionStep from './AddConnectionStep';
import DoneStep from './DoneStep';

interface OnboardingWizardProps {
    t: (key: TranslationKey) => string;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ t }) => {
    const [step, setStep] = useState(0);
    const [selectedProvider, setSelectedProvider] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const { onboardingCompleted, setOnboardingCompleted } = useUiPreferences();

    const totalSteps = 3;

    const skip = () => {
        setOnboardingCompleted(true);
    };

    if (onboardingCompleted) return null;

    const handleSaveConnection = async () => {
        if (!selectedProvider) {
            setError(t('onboarding.error_select_provider'));
            return;
        }
        if (!apiKey.trim()) {
            setError(t('onboarding.error_enter_key'));
            return;
        }
        setSaving(true);
        setError('');
        try {
            await keyService.addKey({
                provider: selectedProvider,
                key: apiKey.trim(),
                label: `${selectedProvider} (onboarding)`,
                status: 'pending' as const,
            });
            setStep(2);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : t('onboarding.error_generic'));
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        if (step === 0) {
            setStep(1);
            return;
        }
        if (step === 1) {
            await handleSaveConnection();
            return;
        }
    };

    const handleBack = () => {
        if (step > 0) setStep((s) => s - 1);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9998,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{
                    width: '100%',
                    maxWidth: 440,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 16,
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid var(--border-color)',
                    }}
                >
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={`dot-${i}`}
                                style={{
                                    width: i === step ? 20 : 8,
                                    height: 6,
                                    borderRadius: 3,
                                    background: i <= step ? '#3b82f6' : 'rgba(255,255,255,0.15)',
                                    transition: 'all 0.25s',
                                }}
                            />
                        ))}
                    </div>
                    <button
                        onClick={skip}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        {t('onboarding.skip')} <ChevronRight size={14} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem 1.5rem 1.25rem' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {step === 0 && <WelcomeStep t={t} />}
                            {step === 1 && (
                                <AddConnectionStep
                                    t={t}
                                    selectedProvider={selectedProvider}
                                    setSelectedProvider={setSelectedProvider}
                                    apiKey={apiKey}
                                    setApiKey={setApiKey}
                                    error={error}
                                    setError={setError}
                                />
                            )}
                            {step === 2 && <DoneStep t={t} />}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {step !== 2 && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.875rem 1.5rem',
                            borderTop: '1px solid var(--border-color)',
                            gap: '0.75rem',
                        }}
                    >
                        {step > 0 ? (
                            <button
                                onClick={handleBack}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.55rem 1rem',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                }}
                            >
                                <ChevronLeft size={15} /> {t('onboarding.back')}
                            </button>
                        ) : (
                            <div />
                        )}

                        <button
                            onClick={handleNext}
                            disabled={saving}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.55rem 1.25rem',
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                border: 'none',
                                borderRadius: 8,
                                cursor: saving ? 'wait' : 'pointer',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                opacity: saving ? 0.7 : 1,
                            }}
                        >
                            {saving
                                ? t('onboarding.saving')
                                : step === 0
                                  ? t('onboarding.get_started')
                                  : t('onboarding.save_connect')}
                            <ChevronRight size={15} />
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};
