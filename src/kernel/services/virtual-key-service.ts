import type { IVirtualKeyService, VirtualKey } from '../contracts/virtual-key';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('VirtualKeyService');

// Display-only masking: prevents realKeyId from appearing in plaintext in logs/UI.
// NOT encrypted — this is NOT a security boundary. Do not rely on this for confidentiality.
function maskId(id: string): string {
    return btoa(id);
}
function unmaskId(encoded: string): string {
    try {
        return atob(encoded);
    } catch {
        return encoded;
    }
}

export interface VirtualKeyServiceDeps {
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    eventBus: {
        emit: (event: string, data?: unknown) => void;
        on: (event: string, cb: (data: unknown) => void) => () => void;
        onSafe: <T>(event: string, handler: (data: T) => void) => () => void;
    };
    keyService: {
        getKeys: () => Array<{ id: string; provider: string }>;
        getKey: (id: string) => { id: string; provider: string } | undefined;
    };
}

export class VirtualKeyService implements IVirtualKeyService {
    private cache = new Map<string, VirtualKey>();
    private loaded = false;
    private deps: VirtualKeyServiceDeps;
    private persistTimer: ReturnType<typeof setTimeout> | null = null;
    private unsubs: Array<() => void> = [];

    constructor(deps: VirtualKeyServiceDeps) {
        this.deps = deps;
    }

    private async flush(): Promise<void> {
        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
            this.persistTimer = null;
        }
        await this.doPersist();
    }

    async destroy(): Promise<void> {
        await this.flush();
        this.cache.clear();
        this.loaded = false;
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
    }

    async init(): Promise<void> {
        if (this.loaded) return;
        try {
            const stored = await this.deps.database.getKv<
                {
                    id: string;
                    realKeyId: string;
                    provider: string;
                    agentId?: string;
                    label: string;
                    createdAt: number;
                    lastUsedAt?: number;
                    active: boolean;
                }[]
            >('virtual_keys');
            if (stored) {
                for (const k of stored) {
                    this.cache.set(k.id, {
                        ...k,
                        realKeyId: unmaskId(k.realKeyId),
                    });
                }
            }
            this.loaded = true;
        } catch (e) {
            LOGGER.warn('VirtualKeyService', 'DB not ready, using memory only', {
                error: String(e),
            });
        }

        try {
            this.unsubs.push(
                this.deps.eventBus.onSafe<{ id: string }>(EVENTS.KEY_REMOVED, (data) => {
                    this.cleanupRealKey(data.id);
                }),
            );
        } catch (e) {
            LOGGER.warn('VirtualKeyService', 'Failed to subscribe to KEY_REMOVED', {
                error: String(e),
            });
        }
    }

    cleanupRealKey(realKeyId: string): void {
        for (const [vkId, vk] of this.cache) {
            if (vk.realKeyId === realKeyId) {
                this.cache.delete(vkId);
                this.deps.eventBus.emit(EVENTS.VIRTUAL_KEY_REVOKED, { virtualKeyId: vkId });
            }
        }
        this.debouncedPersist();
    }

    async create(realKeyId: string, label: string, agentId?: string): Promise<VirtualKey> {
        await this.init();
        const id = `vk_${crypto.randomUUID().slice(0, 12)}`;
        const vk: VirtualKey = {
            id,
            realKeyId,
            label,
            provider: '',
            agentId,
            createdAt: Date.now(),
            active: true,
        };
        const keyData = this.getRealKey(realKeyId);
        if (!keyData)
            throw new Error(`Cannot create virtual key: real key "${realKeyId}" not found`);
        vk.provider = keyData.provider;
        this.cache.set(id, vk);
        await this.persistNow();
        this.deps.eventBus.emit(EVENTS.VIRTUAL_KEY_CREATED, { virtualKey: vk });
        LOGGER.info('VirtualKeyService', `Virtual key created: ${label} -> ${keyData.provider}`);
        return { ...vk };
    }

    lookup(id: string): VirtualKey | undefined {
        const vk = this.cache.get(id);
        if (vk && vk.active) {
            return { ...vk };
        }
        return undefined;
    }

    resolve(id: string): VirtualKey | undefined {
        const vk = this.cache.get(id);
        if (vk && vk.active) {
            const updated = { ...vk, lastUsedAt: Date.now() };
            this.cache.set(id, updated);
            this.debouncedPersist();
            this.deps.eventBus.emit(EVENTS.VIRTUAL_KEY_RESOLVED, { virtualKeyId: id });
            return { ...updated };
        }
        return undefined;
    }

    async revoke(id: string): Promise<void> {
        const vk = this.cache.get(id);
        if (vk) {
            this.cache.set(id, { ...vk, active: false });
            await this.persistNow();
            this.deps.eventBus.emit(EVENTS.VIRTUAL_KEY_REVOKED, { virtualKeyId: id });
            LOGGER.info('VirtualKeyService', `Virtual key revoked: ${vk.label}`);
        }
    }

    list(): VirtualKey[] {
        return Array.from(this.cache.values()).sort((a, b) => b.createdAt - a.createdAt);
    }

    listActive(): VirtualKey[] {
        return this.list().filter((k) => k.active);
    }

    private getRealKey(realKeyId: string): { provider: string } | undefined {
        try {
            const key = this.deps.keyService.getKey(realKeyId);
            return key ? { provider: key.provider } : undefined;
        } catch (e) {
            LOGGER.warn('VirtualKeyService', 'Failed to get real key', { realKeyId, error: e });
            return undefined;
        }
    }

    private debouncedPersist() {
        if (this.persistTimer) clearTimeout(this.persistTimer);
        this.persistTimer = setTimeout(() => {
            this.persistTimer = null;
            this.doPersist();
        }, 2000);
    }

    private async persistNow() {
        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
            this.persistTimer = null;
        }
        await this.doPersist();
    }

    private async doPersist() {
        try {
            const obfuscated = this.list().map((vk) => ({
                ...vk,
                realKeyId: maskId(vk.realKeyId),
            }));
            await this.deps.database.setKv('virtual_keys', obfuscated);
        } catch (e) {
            LOGGER.warn('VirtualKeyService', 'Failed to persist virtual keys', {
                error: String(e),
            });
        }
    }
}
