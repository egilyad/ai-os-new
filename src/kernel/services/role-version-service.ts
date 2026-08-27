import { genId } from '../../utils/gen-id';
import type { Role } from '../types/role-types';
import type { ILocalStorageAdapter } from '../contracts/storage-adapter';
import { rootLogger } from './logger-service';
import { safeJsonParse } from '../../kernel/utils/safe-json';

const LOGGER = rootLogger.child('RoleVersionService');

export interface RoleVersion {
    id: string;
    roleId: string;
    config: Omit<Role, 'id'>;
    createdAt: number;
    changeNote: string;
}

const STORAGE_KEY = 'superagents-role-versions';
const MAX_VERSIONS_PER_ROLE = 50;

export class RoleVersionService {
    private versions: Map<string, RoleVersion[]> = new Map();
    private storage?: ILocalStorageAdapter;
    private _initialized = false;

    constructor(storage?: ILocalStorageAdapter) {
        this.storage = storage;
    }

    init(): void {
        if (this._initialized) return;
        this._initialized = true;
        try {
            const stored = this.storage?.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = safeJsonParse(stored) as RoleVersion[];
                for (const v of parsed) {
                    const list = this.versions.get(v.roleId) || [];
                    list.push(v);
                    this.versions.set(v.roleId, list);
                }
            }
        } catch (e) {
            LOGGER.warn(
                'RoleVersionService',
                'Failed to load versions from storage, starting fresh',
                { error: e },
            );
        }
    }

    recordChange(role: Role, changeNote: string): RoleVersion {
        const { id: _roleId, ...configWithoutId } = role;
        void _roleId;
        const version: RoleVersion = {
            id: genId('rv'),
            roleId: role.id,
            config: configWithoutId,
            createdAt: Date.now(),
            changeNote,
        };
        const list = this.versions.get(role.id) || [];
        list.push(version);
        if (list.length > MAX_VERSIONS_PER_ROLE) list.shift();
        this.versions.set(role.id, list);
        this.persist();
        return version;
    }

    getVersions(roleId: string): RoleVersion[] {
        return [...(this.versions.get(roleId) || [])].reverse();
    }

    getVersion(roleId: string, versionId: string): RoleVersion | undefined {
        return this.versions.get(roleId)?.find((v) => v.id === versionId);
    }

    getLatest(roleId: string): RoleVersion | undefined {
        const list = this.versions.get(roleId);
        return list?.[list.length - 1];
    }

    rollbackTo(roleId: string, versionId: string): Omit<Role, 'id'> | undefined {
        const version = this.getVersion(roleId, versionId);
        return version ? { ...version.config } : undefined;
    }

    diff(roleId: string, versionIdA: string, versionIdB: string): RoleDiff | undefined {
        const a = this.getVersion(roleId, versionIdA);
        const b = this.getVersion(roleId, versionIdB);
        if (!a || !b) return undefined;
        const changes: RoleDiffChange[] = [];
        const aCfg = a.config;
        const bCfg = b.config;
        for (const key of ['name', 'description', 'systemPrompt', 'baseTemperature'] as const) {
            if (aCfg[key] !== bCfg[key]) {
                changes.push({
                    field: key,
                    oldValue: String(aCfg[key]),
                    newValue: String(bCfg[key]),
                });
            }
        }
        const aPerms = [...(aCfg.permissions || [])].sort().join(',');
        const bPerms = [...(bCfg.permissions || [])].sort().join(',');
        if (aPerms !== bPerms) {
            changes.push({ field: 'permissions', oldValue: aPerms, newValue: bPerms });
        }
        return { versionA: a, versionB: b, changes };
    }

    destroy(): void {
        this._initialized = false;
        this.versions.clear();
    }

    private persist(): void {
        const all: RoleVersion[] = [];
        for (const list of this.versions.values()) all.push(...list);
        try {
            this.storage?.setItem(STORAGE_KEY, JSON.stringify(all));
        } catch {
            /* full */
        }
    }
}

export interface RoleDiffChange {
    field: string;
    oldValue: string;
    newValue: string;
}

export interface RoleDiff {
    versionA: RoleVersion;
    versionB: RoleVersion;
    changes: RoleDiffChange[];
}
