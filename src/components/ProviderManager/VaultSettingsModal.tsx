import React, { useEffect, useState } from 'react';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { AnimatePresence, motion } from 'framer-motion';
import { FocusScope } from '@react-aria/focus';
import { eventBus, EVENTS, keyService } from '../../kernel/instances';

/**
 * VaultSettingsModal — passphrase-UI (SPEC_01).
 *
 * Три режима:
 *  - create: vault ещё не создан — задать passphrase (>=8 символов, подтверждение);
 *  - unlock: vault создан и заблокирован — ввести passphrase;
 *  - ready: vault разблокирован — показать статус и кнопку «Lock».
 *
 * Компонент не монтируется автоматически; его следует подключить в панель
 * Провайдеров/Настроек (например, в ProviderManager) по кнопке.
 */
interface Props {
    onClose: () => void;
}

type Mode = 'create' | 'unlock' | 'ready';

const VaultSettingsModal: React.FC<Props> = ({ onClose }) => {
    const [mode, setMode] = useState<Mode>('create');
    const [passphrase, setPassphrase] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const clearError = useAutoClearError(setError as (v: string | null) => void, null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let mounted = true;
        const sync = () => {
            if (!mounted) return;
            if (!keyService.hasVault()) setMode('create');
            else if (keyService.isVaultLocked()) setMode('unlock');
            else setMode('ready');
        };
        sync();
        const unsubs = [
            eventBus.on(EVENTS.KEY_VAULT_CREATED, sync),
            eventBus.on(EVENTS.KEY_VAULT_UNLOCKED, sync),
            eventBus.on(EVENTS.KEY_VAULT_LOCKED, sync),
        ];
        return () => {
            mounted = false;
            unsubs.forEach((u) => u());
        };
    }, []);

    const handleCreate = async () => {
        if (passphrase.length < 8) {
            setError('Passphrase must be at least 8 characters');
            clearError();
            return;
        }
        if (passphrase !== confirm) {
            setError('Passphrases do not match');
            clearError();
            return;
        }
        setBusy(true);
        setError('');
        try {
            const ok = await keyService.createVault(passphrase);
            if (!ok) {
                setError('Failed to create vault');
                clearError();
            } else {
                setPassphrase('');
                setConfirm('');
            }
        } catch {
            setError('Failed to create vault');
            clearError();
        } finally {
            setBusy(false);
        }
    };

    const handleUnlock = async () => {
        setBusy(true);
        setError('');
        try {
            const ok = await keyService.unlockVaultWithPassphrase(passphrase);
            if (!ok) {
                setError('Incorrect passphrase');
                clearError();
            } else setPassphrase('');
        } catch {
            setError('Failed to unlock vault');
            clearError();
        } finally {
            setBusy(false);
        }
    };

    const handleLock = () => {
        keyService.lockVault();
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                onClick={onClose}
            >
                <motion.div
                    className="w-[420px] max-w-[90vw] rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <FocusScope contain restoreFocus autoFocus>
                        <h2 className="text-lg font-semibold text-zinc-100">
                            {mode === 'create'
                                ? 'Set vault passphrase'
                                : mode === 'unlock'
                                  ? 'Unlock vault'
                                  : 'Vault'}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-400">
                            {mode === 'create'
                                ? 'Your API keys will be encrypted locally. Remember this passphrase — it cannot be recovered.'
                                : mode === 'unlock'
                                  ? 'Enter your passphrase to decrypt your API keys.'
                                  : 'Your vault is unlocked. Keys are encrypted at rest.'}
                        </p>

                        {mode !== 'ready' && (
                            <div className="mt-4 space-y-3">
                                <input
                                    type="password"
                                    placeholder="Passphrase"
                                    value={passphrase}
                                    onChange={(e) => setPassphrase(e.target.value)}
                                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                                />
                                {mode === 'create' && (
                                    <input
                                        type="password"
                                        placeholder="Confirm passphrase"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                                    />
                                )}
                                {error && <div className="text-sm text-red-400">{error}</div>}
                                <button
                                    onClick={mode === 'create' ? handleCreate : handleUnlock}
                                    disabled={busy}
                                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                                >
                                    {busy ? 'Working…' : mode === 'create' ? 'Create vault' : 'Unlock'}
                                </button>
                            </div>
                        )}

                        {mode === 'ready' && (
                            <button
                                onClick={handleLock}
                                className="mt-4 w-full rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-600"
                            >
                                Lock vault
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="mt-4 w-full rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                        >
                            Close
                        </button>
                    </FocusScope>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VaultSettingsModal;
