import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n/useTranslation';
import { FocusScope } from '@react-aria/focus';
import { X, Loader2, Mail } from 'lucide-react';
import type { ApiKey } from '../../types/metrics';
import ProviderManagerView from './ProviderManagerView';
import type { TabId } from './ProviderManagerView';
import { useKeyStore } from '../../stores/useKeyStore';
import { eventBus, EVENTS, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('ProviderManagerContainer');
import { safeJsonParse } from '../../kernel/utils/safe-json';
import { groupManager } from '../../kernel/instances';

const TABS: TabId[] = ['installed', 'browse', 'routing', 'pools', 'intel'];

const ProviderManagerContainer: React.FC = () => {
    const { t } = useTranslation();
    const keys = useKeyStore((s) => s.keys);
    const checkingIds = useKeyStore((s) => s.checkingIds);
    const removeKey = useKeyStore((s) => s.removeKey);
    const checkHealth = useKeyStore((s) => s.checkHealth);
    const checkAllHealth = useKeyStore((s) => s.checkAllHealth);
    const toggleKeyStatus = useKeyStore((s) => s.toggleKeyStatus);
    const enableAllKeys = useKeyStore((s) => s.enableAllKeys);
    const disableAllKeys = useKeyStore((s) => s.disableAllKeys);
    const exportKeys = useKeyStore((s) => s.exportKeys);
    const importKeys = useKeyStore((s) => s.importKeys);
    const updateKey = useKeyStore((s) => s.updateKey);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [addAccountGroup, setAddAccountGroup] = useState('');
    const [addAccountEmail, setAddAccountEmail] = useState('');
    const [addingAccount, setAddingAccount] = useState(false);
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [addModalProvider, setAddModalProvider] = useState<string | undefined>(undefined);
    const [selectedProfile, setSelectedProfile] = useState<ApiKey | null>(null);
    const [initialProfileTab, setInitialProfileTab] = useState<'overview' | 'sandbox'>('overview');
    const [activeTab, setActiveTab] = useState<TabId>('installed');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { totalTokens, totalCost, activeCount, errorCount } = useMemo(() => {
        let tt = 0,
            tc = 0,
            ac = 0,
            ec = 0;
        for (const k of keys) {
            tt += k.stats?.totalTokens || 0;
            tc += k.stats?.extended?.estimatedCost || 0;
            if (k.status === 'active') ac++;
            if (k.status === 'error') ec++;
        }
        return { totalTokens: tt, totalCost: tc, activeCount: ac, errorCount: ec };
    }, [keys]);
    const anyChecking = checkingIds.size > 0;

    const handleCheckHealth = useCallback(
        (id: string) => {
            checkHealth(id);
        },
        [checkHealth],
    );
    const handleCheckAllHealth = useCallback(() => {
        checkAllHealth();
    }, [checkAllHealth]);

    const handleExport = useCallback(async () => {
        setExporting(true);
        try {
            const data = await exportKeys();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `providers-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: 'Providers exported successfully',
                type: 'success',
            });
        } finally {
            setExporting(false);
        }
    }, [exportKeys]);

    const handleImport = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setImporting(true);
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const raw = event.target?.result as string;
                    if (!raw?.trim()) throw new Error('File is empty');
                    let parsed: unknown;
                    try {
                        parsed = safeJsonParse(raw);
                    } catch {
                        throw new Error(
                            'Invalid JSON format. Expected a valid JSON array of provider objects.',
                        );
                    }
                    if (!Array.isArray(parsed))
                        throw new Error('Invalid structure: expected a JSON array.');
                    if (parsed.length === 0) throw new Error('File contains no providers.');
                    const missingFields = parsed.filter((item: unknown) => {
                        const p = item as Record<string, unknown>;
                        return !p.provider || !p.label;
                    });
                    if (missingFields.length > 0) {
                        throw new Error(
                            `${missingFields.length} entr${missingFields.length === 1 ? 'y' : 'ies'} missing required fields (provider, label)`,
                        );
                    }
                    const count = await importKeys(raw);
                    // Only show success if keys were actually imported; vault-locked case already shows an error from importKeys
                    if (count > 0) {
                        eventBus.emit(EVENTS.NOTIFICATION, {
                            message: `Successfully imported ${count} provider(s)`,
                            type: 'success',
                        });
                    }
                } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Unknown error';
                    LOGGER.warn('ProviderManagerContainer', 'Failed to import providers', {
                        error: e,
                    });
                    eventBus.emit(EVENTS.NOTIFICATION, {
                        message: `Import failed: ${msg}`,
                        type: 'error',
                    });
                } finally {
                    setImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };
            reader.readAsText(file);
        },
        [importKeys],
    );

    const handleTabKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const idx = TABS.indexOf(activeTab);
            let nextIdx: number;
            if (e.key === 'ArrowRight') nextIdx = (idx + 1) % TABS.length;
            else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + TABS.length) % TABS.length;
            else if (e.key === 'Home') nextIdx = 0;
            else if (e.key === 'End') nextIdx = TABS.length - 1;
            else return;
            e.preventDefault();
            setActiveTab(TABS[nextIdx]!);
        },
        [activeTab],
    );

    const handleSelectProfile = useCallback((key: ApiKey, tab: 'overview' | 'sandbox') => {
        setSelectedProfile(key);
        setInitialProfileTab(tab);
    }, []);

    const handleClearProfile = useCallback(() => {
        setSelectedProfile(null);
    }, []);

    const handleSetShowAddModal = useCallback((show: boolean, provider?: string) => {
        setShowAddModal(show);
        setAddModalProvider(provider);
    }, []);

    const handleAddAccount = useCallback(async () => {
        const email = addAccountEmail.trim();
        if (!email) return;
        setAddingAccount(true);
        try {
            const providers = ['gemini', 'groq', 'nvidia', 'openrouter'];
            const labels = providers.map((p) => `${p}-${email.split('@')[0]}`);
            let added = 0;
            for (let i = 0; i < providers.length; i++) {
                const result = await groupManager.createKey(
                    {
                        provider: providers[i]!,
                        label: labels[i]!,
                        key: '',
                        status: 'pending',
                        group: addAccountGroup.trim() || undefined,
                        account: email,
                    },
                    { source: 'ui' },
                );
                if (result.ok) added++;
            }
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Account ${email} added with ${added}/${providers.length} provider slots`,
                type: added > 0 ? 'success' : 'error',
            });
            setShowAddAccount(false);
            setAddAccountEmail('');
        } finally {
            setAddingAccount(false);
        }
    }, [addAccountEmail, addAccountGroup]);

    const handleReorderKey = useCallback(
        (keyId: string, targetIndex: number) => {
            const currentKeys = keys;
            const fromIdx = currentKeys.findIndex((k) => k.id === keyId);
            if (fromIdx === -1) return;
            const reordered = [...currentKeys];
            const [moved] = reordered.splice(fromIdx, 1);
            reordered.splice(targetIndex, 0, moved!);
            reordered.forEach((k, i) => {
                if (k.priority !== i) updateKey(k.id, { priority: i });
            });
        },
        [keys, updateKey],
    );

    return (
        <>
            <AnimatePresence>
                {showAddAccount && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.5)',
                        }}
                        onClick={() => setShowAddAccount(false)}
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('provider_manager.aria.add_account')}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setShowAddAccount(false);
                        }}
                    >
                        <FocusScope contain restoreFocus autoFocus>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    background: 'var(--slate-800)',
                                    borderRadius: 16,
                                    padding: '1.5rem',
                                    width: 400,
                                    maxWidth: '90vw',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '1rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        <Mail size={18} color="#3b82f6" />
                                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                            Add Account
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowAddAccount(false)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--slate-500)',
                                            cursor: 'pointer',
                                        }}
                                        aria-label={t('common.aria.close')}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <p
                                    style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--slate-400)',
                                        marginBottom: '1rem',
                                    }}
                                >
                                    Creates 4 provider slots (Gemini, Groq, NVIDIA, OpenRouter) for
                                    this account. Fill in API keys later.
                                </p>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                    }}
                                >
                                    <div>
                                        <label
                                            style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--slate-400)',
                                                display: 'block',
                                                marginBottom: '0.3rem',
                                            }}
                                            htmlFor="acc-email"
                                        >
                                            Account email
                                        </label>
                                        <input
                                            id="acc-email"
                                            type="email"
                                            value={addAccountEmail}
                                            onChange={(e) => setAddAccountEmail(e.target.value)}
                                            placeholder="alice@gmail.com"
                                            style={{
                                                width: '100%',
                                                padding: '0.6rem 0.8rem',
                                                borderRadius: 8,
                                                background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                color: 'var(--slate-200)',
                                                fontSize: '0.85rem',
                                            }}
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label
                                            style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--slate-400)',
                                                display: 'block',
                                                marginBottom: '0.3rem',
                                            }}
                                            htmlFor="acc-group"
                                        >
                                            Group (optional)
                                        </label>
                                        <input
                                            id="acc-group"
                                            type="text"
                                            value={addAccountGroup}
                                            onChange={(e) => setAddAccountGroup(e.target.value)}
                                            placeholder="e.g. FirmA, Work, Personal"
                                            style={{
                                                width: '100%',
                                                padding: '0.6rem 0.8rem',
                                                borderRadius: 8,
                                                background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                color: 'var(--slate-200)',
                                                fontSize: '0.85rem',
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.75rem',
                                            marginTop: '0.5rem',
                                        }}
                                    >
                                        <button
                                            onClick={() => setShowAddAccount(false)}
                                            className="btn-secondary"
                                            style={{ flex: 1 }}
                                            disabled={addingAccount}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddAccount}
                                            className="btn-primary"
                                            style={{
                                                flex: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                            }}
                                            disabled={addingAccount || !addAccountEmail.trim()}
                                        >
                                            {addingAccount ? (
                                                <Loader2 size={16} className="spinning" />
                                            ) : (
                                                <Mail size={16} />
                                            )}
                                            {addingAccount ? 'Creating…' : 'Add Account'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </FocusScope>
                    </motion.div>
                )}
            </AnimatePresence>
            <ProviderManagerView
                keys={keys}
                checkingIds={checkingIds}
                activeTab={activeTab}
                showAddModal={showAddModal}
                addModalProvider={addModalProvider}
                selectedProfile={selectedProfile}
                initialProfileTab={initialProfileTab}
                fileInputRef={fileInputRef}
                totalTokens={totalTokens}
                totalCost={totalCost}
                activeCount={activeCount}
                errorCount={errorCount}
                anyChecking={anyChecking}
                importing={importing}
                exporting={exporting}
                onSetActiveTab={setActiveTab}
                onSetShowAddModal={handleSetShowAddModal}
                onSelectProfile={handleSelectProfile}
                onClearProfile={handleClearProfile}
                onCheckHealth={handleCheckHealth}
                onCheckAllHealth={handleCheckAllHealth}
                onAddAccount={() => setShowAddAccount(true)}
                onExport={handleExport}
                onImport={handleImport}
                onTabKeyDown={handleTabKeyDown}
                onToggleStatus={toggleKeyStatus}
                onEnableAll={enableAllKeys}
                onDisableAll={disableAllKeys}
                onRemoveKey={removeKey}
                onReorderKey={handleReorderKey}
            />
        </>
    );
};

export default ProviderManagerContainer;
