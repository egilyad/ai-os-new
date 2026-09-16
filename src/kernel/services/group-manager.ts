import { EVENTS } from '../events/event-names';
import type { KeyPassport, KeyGroup, IGroupManager } from '../contracts/group-manager';
import type { KeyService } from './key-management/key-service';
import type { ApiKey } from '../types/metrics-types';
import type { Result } from '../contracts/results';
import { ok, fail } from '../contracts/results';
import type { IEventBus } from '../types/interfaces';
import { rootLogger } from './logger-service';
const GM_LOGGER = rootLogger.child('GroupManager');
const KV_GROUPS = 'key_groups';
const DEFAULT_GROUP_ID = '__default__';
const DEFAULT_GROUP_NAME = 'Default';

interface GroupManagerDeps {
    keyService: KeyService;
    eventBus: IEventBus;
    storage: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
}

export class GroupManagerService implements IGroupManager {
    private deps: GroupManagerDeps;
    private groups: KeyGroup[] = [];
    private passports: Map<string, KeyPassport> = new Map();
    private loaded = false;
    private unsubs: Array<() => void> = [];
    private _initialized = false;

    get ready(): boolean {
        return this.loaded;
    }

    constructor(deps: GroupManagerDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        // HARD RULE: do NOT call getAllKeys() / syncExistingKeys() during init.
        // GroupManager init is a pure storage read of group/passport metadata.
        // Key-related operations are deliberately deferred to a later phase
        // (see bootstrap.ts: gm.syncExistingKeys() runs AFTER bootstrap phase
        // and AFTER the immutable snapshot is committed to KeyRegistry).
        const saved = await this.deps.storage.getKv<{
            groups: KeyGroup[];
            passports: [string, KeyPassport][];
        }>(KV_GROUPS);
        if (saved) {
            this.groups = saved.groups;
            this.passports = new Map(saved.passports);
        }
        // Auto-create default group if missing
        if (!this.groups.find((g) => g.id === DEFAULT_GROUP_ID)) {
            this.groups.push({
                id: DEFAULT_GROUP_ID,
                name: DEFAULT_GROUP_NAME,
                createdAt: Date.now(),
                keyIds: [],
            });
        }
        this.loaded = true;
        // Subscribe to key:state:changed for reactive passport sync
        this.unsubs.push(
            this.deps.eventBus.onSafe<{ id: string; state: string }>(
                EVENTS.KEY_STATE_CHANGED,
                (data) => {
                    const p = this.passports.get(data.id);
                    if (p && data.state) p.status = data.state;
                },
            ),
        );
        // STATE-M7: Clean up stale keyIds when a key is removed
        this.unsubs.push(
            this.deps.eventBus.onSafe<{ id: string }>(EVENTS.KEY_REMOVED, (data) => {
                for (const g of this.groups) {
                    const idx = g.keyIds.indexOf(data.id);
                    if (idx !== -1) {
                        g.keyIds = [...g.keyIds.slice(0, idx), ...g.keyIds.slice(idx + 1)];
                    }
                }
                this.passports.delete(data.id);
                this.allKeysCache = null;
                void this.persist().catch((err) =>
                    GM_LOGGER.error('GroupManager', 'persist failed on KEY_REMOVED', {
                        error: err,
                    }),
                );
            }),
        );
        // D-06: Invalidate cache on external key add — covers keys added via KeyService directly
        this.unsubs.push(
            this.deps.eventBus.onSafe<ApiKey>(EVENTS.KEY_ADDED, () => {
                this.allKeysCache = null;
            }),
        );
        // Re-sync passports when keys are (re)loaded — covers the case where
        // syncExistingKeys() ran before all keys were available in KeyRegistry.
        this.unsubs.push(
            this.deps.eventBus.onSafe<ApiKey[]>(EVENTS.KEYS_LOADED, () => {
                void this.syncExistingKeys();
            }),
        );
    }

    async destroy(): Promise<void> {
        this._initialized = false;
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        this.groups = [];
        this.passports.clear();
        await this.persist();
    }

    private async persist(): Promise<void> {
        await this.deps.storage.setKv(KV_GROUPS, {
            groups: this.groups,
            passports: Array.from(this.passports.entries()),
        });
    }

    getDefaultGroup(): KeyGroup {
        const g = this.groups.find((g) => g.id === DEFAULT_GROUP_ID);
        if (!g) throw new Error('Default group missing — init() not called');
        return g;
    }

    async createGroup(name: string, description?: string): Promise<string> {
        const existing = this.groups.find((g) => g.name === name);
        if (existing) return existing.id;
        const id = `grp_${name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_${Date.now()}`;
        this.groups.push({ id, name, description, createdAt: Date.now(), keyIds: [] });
        await this.persist();
        return id;
    }

    async deleteGroup(id: string): Promise<void> {
        if (id === DEFAULT_GROUP_ID) throw new Error('Cannot delete default group');
        const idx = this.groups.findIndex((g) => g.id === id);
        if (idx === -1) return;
        const group = this.groups[idx]!;
        this.groups.splice(idx, 1);
        // Move keys to default group
        const def = this.getDefaultGroup();
        for (const keyId of group.keyIds) {
            if (!def.keyIds.includes(keyId)) def.keyIds.push(keyId);
            const p = this.passports.get(keyId);
            if (p) p.groupId = DEFAULT_GROUP_ID;
        }
        await this.persist();
    }

    getGroups(): KeyGroup[] {
        return [...this.groups];
    }

    getGroup(id: string): KeyGroup | undefined {
        return this.groups.find((g) => g.id === id);
    }

    async renameGroup(id: string, name: string): Promise<void> {
        const g = this.groups.find((g) => g.id === id);
        if (!g) throw new Error(`Group ${id} not found`);
        g.name = name;
        // Update passports that reference this group
        for (const p of this.passports.values()) {
            if (p.groupId === id) p.groupName = name;
        }
        await this.persist();
    }

    async assignKeyToGroup(keyId: string, groupName: string): Promise<void> {
        // Auto-create group if needed
        const gid = await this.createGroup(groupName);
        const group = this.groups.find((g) => g.id === gid);
        if (!group) return;
        // Remove from previous group
        for (const g of this.groups) {
            const idx = g.keyIds.indexOf(keyId);
            if (idx >= 0) g.keyIds.splice(idx, 1);
        }
        if (!group.keyIds.includes(keyId)) group.keyIds.push(keyId);
        // Update passport
        const p = this.passports.get(keyId);
        if (p) {
            p.groupId = gid;
            p.groupName = groupName;
        }
        await this.persist();
        this.deps.eventBus.emit(EVENTS.GROUP_SYNC, { reassigned: 1 });
    }

    getKeysByGroup(groupId: string): string[] {
        const g = this.groups.find((g) => g.id === groupId);
        return g ? [...g.keyIds] : [];
    }

    getPassport(keyId: string): KeyPassport | undefined {
        return this.passports.get(keyId);
    }

    validatePassport(keyId: string): Result<KeyPassport, string> {
        const p = this.passports.get(keyId);
        if (!p) return fail(`No passport for key ${keyId}`);
        const group = this.groups.find((g) => g.id === p.groupId);
        if (!group) return fail(`Key ${keyId} belongs to missing group ${p.groupId}`);
        return ok(p);
    }

    async createKey(
        data: Omit<ApiKey, 'id' | 'stats'>,
        opts?: { source?: KeyPassport['source']; groupName?: string },
    ): Promise<Result<string, string>> {
        try {
            const groupName = opts?.groupName || data.group || DEFAULT_GROUP_NAME;
            const newKey = await this.deps.keyService.addKey({
                ...data,
                group: groupName,
            });
            if (!newKey) return fail('KeyService.addKey returned undefined');
            const keyId = newKey.id;
            // Create passport
            const gid = await this.createGroup(groupName);
            const group = this.groups.find((g) => g.id === gid);
            if (!group) return fail('Group not found after creation');
            if (!group.keyIds.includes(keyId)) group.keyIds.push(keyId);
            const passport: KeyPassport = {
                keyId,
                keyLabel: data.label,
                provider: data.provider,
                groupId: gid,
                groupName,
                account: data.account,
                accountId: data.accountId,
                status: data.status || 'active',
                createdAt: Date.now(),
                source: opts?.source || 'ui',
            };
            this.passports.set(keyId, passport);
            await this.persist();
            this.allKeysCache = null;
            return ok(keyId);
        } catch (e) {
            return fail(`Failed to create key: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    async updateKey(keyId: string, updates: Partial<ApiKey>): Promise<void> {
        const p = this.passports.get(keyId);
        if (!p) return; // no passport = not a managed key
        if (updates.group !== undefined && updates.group !== p.groupName) {
            await this.assignKeyToGroup(keyId, updates.group);
        }
        if (updates.status !== undefined && updates.status !== p.status) {
            p.status = updates.status;
        }
        this.deps.keyService.updateKey(keyId, updates);
        await this.persist();
        this.allKeysCache = null;
    }

    async deleteKey(keyId: string): Promise<void> {
        // Remove from all groups
        for (const g of this.groups) {
            const idx = g.keyIds.indexOf(keyId);
            if (idx >= 0) g.keyIds.splice(idx, 1);
        }
        this.passports.delete(keyId);
        this.allKeysCache = null;
        await this.persist();
        await this.deps.keyService.removeKey(keyId);
    }

    async syncKeyStatus(
        keyId: string,
        status: string,
        opts?: { reason?: string; latency?: number },
    ): Promise<void> {
        const p = this.passports.get(keyId);
        if (!p) return;
        const previousStatus = p.status;
        p.status = status;
        this.allKeysCache = null;
        await this.persist();
        this.deps.keyService.updateKeyStatus(keyId, status as ApiKey['status'], opts?.latency);
        this.deps.eventBus.emitOnce(EVENTS.KEY_STATE_CHANGED, `${keyId}:${p.provider}:${status}`, {
            id: keyId,
            provider: p.provider,
            state: status,
            previousState: previousStatus,
        });
    }

    private allKeysCache: ApiKey[] | null = null;

    getAllKeys(): ApiKey[] {
        if (this.allKeysCache) return this.allKeysCache;
        const keys = this.deps.keyService.getKeys();
        this.allKeysCache = keys.map((k) => {
            let p = this.passports.get(k.id);
            if (!p) {
                p = this.ensurePassport(k);
            }
            return {
                ...k,
                group: p.groupName,
                account: p.account,
                accountId: p.accountId,
                status: p.status as ApiKey['status'],
            };
        });
        return this.allKeysCache;
    }

    private ensurePassport(k: ApiKey): KeyPassport {
        const groupName = k.group || DEFAULT_GROUP_NAME;
        const g = this.groups.find((g) => g.name === groupName) || this.getDefaultGroup();
        if (!g.keyIds.includes(k.id)) g.keyIds.push(k.id);
        const p: KeyPassport = {
            keyId: k.id,
            keyLabel: k.label,
            provider: k.provider,
            groupId: g.id,
            groupName,
            account: k.account,
            accountId: k.accountId,
            status: k.status || 'active',
            createdAt: k.createdAt || Date.now(),
            source: 'migration',
        };
        this.passports.set(k.id, p);
        void this.persist().catch((err) =>
            GM_LOGGER.error('GroupManager', 'ensurePassport persist failed', { error: err }),
        );
        return p;
    }

    invalidateKeysCache(): void {
        this.allKeysCache = null;
    }

    getKeyById(keyId: string): ApiKey | undefined {
        const k = this.deps.keyService.getKey(keyId);
        if (!k) return undefined;
        let p = this.passports.get(keyId);
        if (!p) {
            p = this.ensurePassport(k);
        }
        return {
            ...k,
            group: p.groupName,
            account: p.account,
            accountId: p.accountId,
            status: p.status as ApiKey['status'],
        };
    }

    async syncExistingKeys(): Promise<{
        passportAdded: number;
        assigned: number;
        reassigned: number;
    }> {
        const keys = this.deps.keyService.getKeys();

        // Clean up orphan keyIds — keyIds that reference keys no longer in KeyService.
        // This can happen after race conditions or if a key was deleted while
        // group metadata was persisted separately.
        const allKeyIds = new Set(keys.map((k) => k.id));
        for (const g of this.groups) {
            const before = g.keyIds.length;
            g.keyIds = g.keyIds.filter((id) => allKeyIds.has(id));
            if (g.keyIds.length < before) {
                if (import.meta.env.DEV)
                    GM_LOGGER.debug('GroupManager', 'cleaned orphan keyIds', {
                        count: before - g.keyIds.length,
                        group: g.name,
                    });
            }
        }

        let passportAdded = 0;
        let assigned = 0;
        let reassigned = 0;

        // Collect existing non-default group names for account-based matching
        const accountGroupNames = new Set(
            this.groups.filter((g) => g.id !== DEFAULT_GROUP_ID).map((g) => g.name),
        );

        const resolveGroupName = (k: ApiKey): string => {
            // 1) Explicit group
            if (k.group) return k.group;
            // 2) Account name matches an existing group
            if (k.account && accountGroupNames.has(k.account)) return k.account;
            // 3) AccountId matches an existing group
            if (k.accountId && accountGroupNames.has(k.accountId)) return k.accountId;
            return DEFAULT_GROUP_NAME;
        };

        for (const k of keys) {
            if (!this.passports.has(k.id)) {
                const groupName = resolveGroupName(k);
                const gid = await this.createGroup(groupName);
                const group = this.groups.find((g) => g.id === gid);
                if (!group) continue;
                this.passports.set(k.id, {
                    keyId: k.id,
                    keyLabel: k.label,
                    provider: k.provider,
                    groupId: gid,
                    groupName,
                    account: k.account,
                    accountId: k.accountId,
                    status: k.status,
                    createdAt: k.createdAt || Date.now(),
                    source: 'migration',
                });
                if (!group.keyIds.includes(k.id)) group.keyIds.push(k.id);
                passportAdded++;
            } else {
                // Reassign keys stuck in Default when they have account match
                const p = this.passports.get(k.id)!;
                if (p.groupId === DEFAULT_GROUP_ID) {
                    const betterGroup = resolveGroupName(k);
                    if (betterGroup !== DEFAULT_GROUP_NAME) {
                        await this.assignKeyToGroup(k.id, betterGroup);
                        p.account = k.account;
                        p.accountId = k.accountId;
                        reassigned++;
                    }
                }
            }

            // Ensure every key is in at least one group
            const inGroup = this.groups.some((g) => g.keyIds.includes(k.id));
            if (!inGroup) {
                const def = this.getDefaultGroup();
                if (!def.keyIds.includes(k.id)) def.keyIds.push(k.id);
                assigned++;
            }
        }
        await this.persist();
        this.deps.eventBus.emit(EVENTS.GROUP_SYNC, { passportAdded, assigned, reassigned });
        return { passportAdded, assigned, reassigned };
    }
}
