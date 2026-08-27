import { genId } from '../../utils/gen-id';
import type { ConfigRegistry } from '../contracts/config-registry';
import { CONFIG } from './config-registry';
import { replaceConfig } from './config-mutations';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ConfigHistory');

export interface ConfigVersion {
    id: string;
    version: string;
    timestamp: number;
    author: string;
    comment: string;
    configSnapshot: ConfigRegistry;
}

export interface ConfigDiffItem {
    path: string;
    oldValue?: unknown;
    newValue?: unknown;
    value?: unknown;
}

export interface ConfigDiff {
    added: ConfigDiffItem[];
    updated: ConfigDiffItem[];
    deleted: ConfigDiffItem[];
}

const MAX_HISTORY = 50;
const CONFIG_HISTORY_KEY = 'config_history_v1';

export class ConfigHistoryService {
    private history: ConfigVersion[] = [];
    private currentVersionSeq = 1;
    private _initialized = false;
    private async db(): Promise<import('../types/interfaces').IDatabaseService> {
        const { database } = await import('../instances/core-references');
        return database;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        const stored = await (
            await this.db()
        ).getKv<{ history: ConfigVersion[]; seq: number }>(CONFIG_HISTORY_KEY);
        if (stored) {
            this.history = stored.history ?? [];
            this.currentVersionSeq = stored.seq ?? this.history.length + 1;
        }
        if (this.history.length === 0) {
            await this.commit(CONFIG, 'System', 'Initial configuration seed (v1.0.0)');
        }
    }

    private async persist(): Promise<void> {
        try {
            await (
                await this.db()
            ).setKv(CONFIG_HISTORY_KEY, {
                history: this.history,
                seq: this.currentVersionSeq,
            });
        } catch (e) {
            LOGGER.error('ConfigHistory', 'Failed to persist history', { error: e });
        }
    }

    async commit(config: ConfigRegistry, author: string, comment: string): Promise<ConfigVersion> {
        if (!author || !author.trim()) {
            throw new Error('commit failed: author is required');
        }
        let snapshot: ConfigRegistry;
        try {
            snapshot = JSON.parse(
                JSON.stringify(config, (_k, v) => (typeof v === 'undefined' ? null : v)),
            ) as ConfigRegistry;
        } catch {
            snapshot = {} as ConfigRegistry;
        }
        const versionString = `1.0.${this.currentVersionSeq++}`;
        const newVersion: ConfigVersion = {
            id: genId('cfg'),
            version: versionString,
            timestamp: Date.now(),
            author,
            comment,
            configSnapshot: snapshot,
        };
        this.history.push(newVersion);
        if (this.history.length > MAX_HISTORY) this.history.shift();
        await this.persist();
        LOGGER.info('ConfigHistory', `Config committed by ${author}: ${comment}`, {
            versionString,
        });
        return newVersion;
    }

    getHistory(): ConfigVersion[] {
        return [...this.history];
    }

    getVersion(id: string): ConfigVersion | undefined {
        return this.history.find((v) => v.id === id);
    }

    async rollback(versionId: string, author = 'System'): Promise<ConfigRegistry> {
        if (!author || !author.trim()) {
            throw new Error('rollback failed: author is required');
        }
        const target = this.getVersion(versionId);
        if (!target) {
            throw new Error(`Rollback failed: Config version "${versionId}" not found.`);
        }

        const nextConfig = structuredClone(target.configSnapshot);

        // C-80: apply config FIRST, then record in history.
        // Old order (commit then replaceConfig) discarded overlays made since the rollback target.
        replaceConfig(nextConfig);

        try {
            await this.commit(
                nextConfig,
                author,
                `Rollback to version ${target.version} (${target.comment})`,
            );
        } catch (e) {
            LOGGER.error('ConfigHistory', 'Failed to record rollback in history', { error: e });
            // Config is already applied — non-fatal, history entry is just a record
        }

        LOGGER.info('ConfigHistory', `Config rolled back by ${author} to ${target.version}`, {
            versionId,
        });
        return CONFIG;
    }

    diff(versionIdA: string, versionIdB: string): ConfigDiff {
        const verA = this.getVersion(versionIdA);
        const verB = this.getVersion(versionIdB);

        if (!verA || !verB) {
            throw new Error(
                `Diff failed: One or both config versions ("${versionIdA}", "${versionIdB}") not found.`,
            );
        }

        return this.deepDiff(
            verA.configSnapshot as unknown as Record<string, unknown>,
            verB.configSnapshot as unknown as Record<string, unknown>,
        );
    }

    private deepDiff(
        objA: Record<string, unknown>,
        objB: Record<string, unknown>,
        prefix = '',
    ): ConfigDiff {
        const added: ConfigDiffItem[] = [];
        const updated: ConfigDiffItem[] = [];
        const deleted: ConfigDiffItem[] = [];

        const keysA = Object.keys(objA || {});
        const keysB = Object.keys(objB || {});
        const allKeys = new Set([...keysA, ...keysB]);

        for (const key of allKeys) {
            const path = prefix ? `${prefix}.${key}` : key;
            const hasA = keysA.includes(key);
            const hasB = keysB.includes(key);

            if (hasA && !hasB) {
                deleted.push({ path, value: objA[key] });
            } else if (!hasA && hasB) {
                added.push({ path, value: objB[key] });
            } else {
                const valA = objA[key];
                const valB = objB[key];

                if (valA !== valB) {
                    if (
                        typeof valA === 'object' &&
                        typeof valB === 'object' &&
                        valA !== null &&
                        valB !== null &&
                        !Array.isArray(valA) &&
                        !Array.isArray(valB)
                    ) {
                        const nested = this.deepDiff(
                            valA as Record<string, unknown>,
                            valB as Record<string, unknown>,
                            path,
                        );
                        added.push(...nested.added);
                        updated.push(...nested.updated);
                        deleted.push(...nested.deleted);
                    } else {
                        updated.push({ path, oldValue: valA, newValue: valB });
                    }
                }
            }
        }

        return { added, updated, deleted };
    }

    destroy(): void {
        this._initialized = false;
        this.history = [];
    }
}
