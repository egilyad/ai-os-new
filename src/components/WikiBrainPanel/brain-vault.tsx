import React, { useCallback, useEffect, useState } from 'react';
import { tokens } from '../../styles/tokens';
import { getBrain } from './use-wiki-brain';

const label: React.CSSProperties = {
    fontSize: 12,
    color: tokens.slate[500],
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 6,
};

const buttonStyle: React.CSSProperties = {
    background: tokens.accent,
    color: tokens.slate[950],
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginRight: 8,
};

interface VaultState {
    name: string | null;
    attached: boolean;
    message?: string;
}

export default function BrainVault() {
    const [vault, setVault] = useState<VaultState>({ name: null, attached: false });
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const v = getBrain().vault;
            setVault({ name: v.getVaultName(), attached: v.isAttached() });
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const attach = async () => {
        setBusy(true);
        try {
            const result = await getBrain().vault.attachVault();
            setVault({ name: result.name, attached: result.attached });
        } catch (e) {
            setVault((v) => ({ ...v, message: e instanceof Error ? e.message : String(e) }));
        } finally {
            setBusy(false);
        }
    };

    const detach = async () => {
        await getBrain().vault.detachVault();
        setVault({ name: null, attached: false });
    };

    const run = async (op: 'export' | 'import') => {
        setBusy(true);
        try {
            const result = op === 'export'
                ? await getBrain().vault.exportToVault()
                : await getBrain().vault.importFromVault();
            setVault((v) => ({ ...v, message: `${op}: +${result.exported} экспорт, +${result.imported} импорт, ${result.skipped} пропущено` }));
        } catch (e) {
            setVault((v) => ({ ...v, message: e instanceof Error ? e.message : String(e) }));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <div style={label}>Obsidian Vault</div>
            <div style={{ fontSize: 13, color: tokens.slate[300], marginBottom: 12 }}>
                Статус: {vault.attached ? `подключён (${vault.name})` : 'не подключён'}
            </div>
            <div>
                {vault.attached ? (
                    <button style={buttonStyle} disabled={busy} onClick={() => void detach()}>
                        Отключить
                    </button>
                ) : (
                    <button style={buttonStyle} disabled={busy} onClick={() => void attach()}>
                        Подключить папку
                    </button>
                )}
                <button style={buttonStyle} disabled={busy || !vault.attached} onClick={() => void run('export')}>
                    Экспорт
                </button>
                <button style={buttonStyle} disabled={busy || !vault.attached} onClick={() => void run('import')}>
                    Импорт
                </button>
            </div>
            {vault.message && <div style={{ color: tokens.slate[400], fontSize: 13, marginTop: 8 }}>{vault.message}</div>}
            <div style={{ fontSize: 12, color: tokens.slate[500], marginTop: 12 }}>
                Синхронизация с Obsidian: файлы raw/*.md → источники; страницы → wiki/
            </div>
        </div>
    );
}
