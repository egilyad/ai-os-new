import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusScope } from '@react-aria/focus';
import { eventBus, EVENTS } from '../../kernel/instances';
import { keyService, adapterRegistry } from '../../kernel/instances';
import { useKeyStore } from '../../stores/useKeyStore';
import { useTranslation } from '../../i18n/useTranslation';
import { PROVIDER_META } from './add-key-constants';
import { useBulkImport } from './useBulkImport';
import StepSidebar from './StepSidebar';
import ModalHeader from './ModalHeader';
import ProviderSelectionStep from './ProviderSelectionStep';
import KeyDetailsForm from './KeyDetailsForm';
import DefaultModelStep from './DefaultModelStep';
import BulkImportStep from './BulkImportStep';
import StepDots from './StepDots';

interface Props {
    onClose: () => void;
    defaultProvider?: string;
}

const AddKeyModal: React.FC<Props> = ({ onClose, defaultProvider }) => {
    const addKey = useKeyStore((s) => s.addKey);
    const keys = useKeyStore((s) => s.keys);
    const { t } = useTranslation();
    const [step, setStep] = useState<1 | 2 | 3>(defaultProvider ? 2 : 1);
    const [provider, setProvider] = useState(defaultProvider || 'OpenRouter');
    const [label, setLabel] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [group, setGroup] = useState('');
    const [account, setAccount] = useState('');
    const [accountId, setAccountId] = useState<string>('');
    const [bulkMode, setBulkMode] = useState(false);
    const [saving, setSaving] = useState(false);

    const {
        bulkInput,
        setBulkInput,
        loading,
        error,
        setError,
        bulkReport,
        bulkProgress,
        runBulkImport,
        reset: resetBulk,
    } = useBulkImport();

    const isMountedRef = useRef(true);

    const providers = useMemo(() => {
        const fromRegistry = adapterRegistry.getAllProviders();
        const all = new Set(fromRegistry);
        Object.keys(PROVIDER_META).forEach((k) => all.add(k));
        return Array.from(all).map((id) => ({
            id,
            name: PROVIDER_META[id]?.name || id,
            desc: PROVIDER_META[id]?.desc || '',
            docsUrl: PROVIDER_META[id]?.docsUrl || null,
        }));
    }, []);

    const generateAlias = useCallback(
        (prov: string) => {
            const providerName = providers.find((p) => p.id === prov)?.name || prov;
            const existingCount = keys.filter((k) => k.provider === prov).length;
            return `${providerName.toLowerCase().replace(/\s+/g, '-')}-${String(existingCount + 1).padStart(2, '0')}`;
        },
        [providers, keys],
    );

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (defaultProvider && !label)
            queueMicrotask(() => setLabel(generateAlias(defaultProvider)));
    }, [defaultProvider, label, generateAlias]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (
                e.key === 'Escape' &&
                !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
            )
                onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleProviderChange = (newProvider: string) => {
        setProvider(newProvider);
        setStep(2);
        setError('');
        setBulkMode(false);
        resetBulk();
        setLabel(generateAlias(newProvider));
    };

    const handleKeyChange = (value: string) => {
        setApiKey(value);
        if (value.trim()) {
            const detected = keyService.detectProvider(value);
            if (detected && isMountedRef.current) {
                const match = providers.find((p) => p.id.toLowerCase() === detected.toLowerCase());
                if ((match?.id ?? detected) !== provider && match) {
                    setProvider(match.id);
                    setLabel(generateAlias(match.id));
                }
            }
        }
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
            setError('');
            setBulkMode(false);
            resetBulk();
            return;
        }
        if (step === 2) {
            if (bulkMode) {
                setBulkMode(false);
                resetBulk();
                return;
            }
            setStep(1);
            setError('');
            return;
        }
        if (step === 1) {
            onClose();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!label.trim() || !apiKey.trim()) {
            setError(t('add_key.error_required'));
            return;
        }
        setSaving(true);
        setError('');
        try {
            const isValid = await keyService.verifyKey(provider, apiKey);
            if (!isMountedRef.current) return;
            if (!isValid) throw new Error(t('add_key.error_invalid_format'));
            setAccountId(keyService.extractAccountId(provider, apiKey.trim()));
            const adapter = adapterRegistry.getAdapter(provider);
            let models: string[] = [];
            if (adapter) {
                try {
                    models = await adapter.getAvailableModels(apiKey.trim());
                } catch {
                    /* non-critical */
                }
            }
            if (!isMountedRef.current) return;
            setAvailableModels(models);
            setStep(3);
        } catch (err: unknown) {
            if (!isMountedRef.current) return;
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to validate API key. Please try again.',
            );
        } finally {
            if (isMountedRef.current) setSaving(false);
        }
    };

    const handleFinalize = (selectedModel?: string) => {
        addKey({
            provider,
            label: label.trim(),
            key: apiKey.trim(),
            status: 'pending',
            group: group.trim() || undefined,
            account: account.trim() || undefined,
            accountId,
            model: selectedModel || undefined,
            availableModels: availableModels.length > 0 ? availableModels : undefined,
        });
        eventBus.emit(EVENTS.NOTIFICATION, {
            message: `${provider} key added — ${availableModels.length > 0 ? availableModels.length + ' models available' : 'health check pending'}${selectedModel ? ', default: ' + selectedModel : ''}`,
            type: 'success',
        });
        onClose();
    };

    const checkDuplicateKey = useCallback(
        async (keyValue: string): Promise<string | null> => {
            try {
                const fp = await keyService.fingerprintKey(keyValue);
                for (const k of keys) {
                    if ((await keyService.fingerprintKey(k.key)) === fp) return k.label;
                }
            } catch {
                /* non-blocking */
            }
            return null;
        },
        [keys],
    );

    const handleSaveAndClose = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!label.trim() || !apiKey.trim()) {
            setError(t('add_key.error_required'));
            return;
        }
        const dup = await checkDuplicateKey(apiKey.trim());
        if (dup) {
            setError(t('add_key.error_duplicate').replace('{0}', dup));
            return;
        }
        handleFinalize();
    };

    const handleSkipModel = () => handleFinalize();

    const handleBulkImport = () => runBulkImport(account, group);

    const currentProvider = providers.find((p) => p.id === provider);
    const docsUrl = currentProvider?.docsUrl;

    const handleDocsClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (docsUrl) window.open(docsUrl, '_blank', 'noopener,noreferrer');
        else {
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: 'No official documentation link available for this provider.',
                type: 'info',
            });
        }
    };

    const getTitle = () => {
        if (step === 1) return t('add_key.title_provider');
        if (step === 3) return 'Select Default Model';
        if (step === 2 && bulkMode) return t('add_key.title_bulk');
        return t('add_key.title_configure').replace('{0}', provider);
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="modal-overlay"
                role="dialog"
                aria-modal="true"
                aria-label={t('add_key.dialog_aria')}
            >
                <FocusScope contain restoreFocus autoFocus>
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        onClick={(e) => e.stopPropagation()}
                        className="modal-panel"
                    >
                        <StepSidebar step={step} t={t} />

                        <div className="modal-body">
                            <ModalHeader
                                title={getTitle()}
                                onClose={onClose}
                                closeAria={t('add_key.close_aria')}
                            />

                            <div className="modal-content">
                                {step === 1 ? (
                                    <ProviderSelectionStep
                                        providers={providers}
                                        provider={provider}
                                        onSelect={handleProviderChange}
                                    />
                                ) : step === 3 ? (
                                    <DefaultModelStep
                                        provider={provider}
                                        availableModels={availableModels}
                                        onSelect={handleFinalize}
                                        onSkip={handleSkipModel}
                                    />
                                ) : bulkMode ? (
                                    <BulkImportStep
                                        bulkInput={bulkInput}
                                        setBulkInput={setBulkInput}
                                        error={error}
                                        loading={loading}
                                        bulkReport={bulkReport}
                                        bulkProgress={bulkProgress}
                                        onBack={handleBack}
                                        onImport={handleBulkImport}
                                        onClose={onClose}
                                    />
                                ) : (
                                    <KeyDetailsForm
                                        label={label}
                                        setLabel={setLabel}
                                        group={group}
                                        setGroup={setGroup}
                                        account={account}
                                        setAccount={setAccount}
                                        apiKey={apiKey}
                                        setApiKey={handleKeyChange}
                                        showKey={showKey}
                                        setShowKey={setShowKey}
                                        error={error}
                                        loading={loading || saving}
                                        onBack={handleBack}
                                        onSubmit={handleSubmit}
                                        onSaveClose={handleSaveAndClose}
                                        onBulkMode={() => {
                                            setBulkMode(true);
                                            setError('');
                                        }}
                                        docsUrl={docsUrl}
                                        onDocsClick={handleDocsClick}
                                    />
                                )}
                            </div>

                            <StepDots step={step} />
                        </div>
                    </motion.div>
                </FocusScope>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddKeyModal;
