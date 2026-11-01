import { useCallback, useState } from 'react';
import { keyService } from '../kernel/instances';

/**
 * useVault — реактивный доступ к vault (SPEC_01) для UI.
 * Обновляет локальное состояние после операций create/unlock/lock.
 */
export function useVault() {
    const [hasVault, setHasVault] = useState<boolean>(() => {
        try {
            return keyService.hasVault();
        } catch {
            return false;
        }
    });
    const [isLocked, setIsLocked] = useState<boolean>(() => {
        try {
            return keyService.isVaultLocked();
        } catch {
            return true;
        }
    });

    const refresh = useCallback(() => {
        try {
            setHasVault(keyService.hasVault());
            setIsLocked(keyService.isVaultLocked());
        } catch {
            /* service not ready */
        }
    }, []);

    const createVault = useCallback(
        async (passphrase: string) => {
            const ok = await keyService.createVault(passphrase);
            refresh();
            return ok;
        },
        [refresh],
    );

    const unlock = useCallback(
        async (passphrase: string) => {
            const ok = await keyService.unlockVaultWithPassphrase(passphrase);
            refresh();
            return ok;
        },
        [refresh],
    );

    const lock = useCallback(() => {
        keyService.lockVault();
        refresh();
    }, [refresh]);

    return { hasVault, isLocked, refresh, createVault, unlock, lock };
}
