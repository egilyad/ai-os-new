import type { SecretRef, SecretStore, SecretStoreConfig } from '../contracts/secret-store';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('LocalSecretStore');

const INDEX_KEY = 'external_secret_index';

/**
 * P-CRIT-2: working `local` backend for ExternalSecretsService, persisted
 * in the app keyValue store. Values rest plaintext at rest — consistent
 * with the project's local-first posture (see KeyVault docs) — but the
 * pipeline (init/activate/get/set/delete/list/health + config persist)
 * is real end-to-end, so the Settings UI no longer silently no-ops.
 * Encryption-at-rest arrives with the KeyVault wiring (follow-up).
 */
export class LocalSecretStore implements SecretStore {
    readonly type = 'local' as const;
    readonly label = 'Local Vault';

    constructor(
        private db: {
            getKv: <T>(id: string) => Promise<T | null>;
            setKv: <T>(id: string, value: T) => Promise<void>;
        },
    ) {}

    private keyFor(path: string): string {
        return `external_secret:${path}`;
    }

    async init(_config: SecretStoreConfig): Promise<boolean> {
        return true;
    }

    async get(ref: SecretRef): Promise<string | null> {
        const v = await this.db.getKv<string>(this.keyFor(ref.path));
        return typeof v === 'string' ? v : null;
    }

    async set(ref: SecretRef, value: string): Promise<boolean> {
        await this.db.setKv(this.keyFor(ref.path), value);
        const index = (await this.db.getKv<string[]>(INDEX_KEY)) ?? [];
        if (!index.includes(ref.path)) {
            index.push(ref.path);
            await this.db.setKv(INDEX_KEY, index);
        }
        return true;
    }

    async delete(ref: SecretRef): Promise<boolean> {
        await this.db.setKv(this.keyFor(ref.path), null);
        const index = (await this.db.getKv<string[]>(INDEX_KEY)) ?? [];
        await this.db.setKv(
            INDEX_KEY,
            index.filter((p) => p !== ref.path),
        );
        return true;
    }

    async list(prefix = ''): Promise<string[]> {
        const index = (await this.db.getKv<string[]>(INDEX_KEY)) ?? [];
        return index.filter((p) => p.startsWith(prefix));
    }

    async health(): Promise<boolean> {
        try {
            await this.db.getKv<string>(INDEX_KEY);
            return true;
        } catch (e) {
            LOGGER.warn('LocalSecretStore', 'health check failed', { error: e });
            return false;
        }
    }
}
