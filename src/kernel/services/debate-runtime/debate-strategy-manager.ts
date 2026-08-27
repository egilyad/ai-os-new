import type { ConfigStore } from '../../../kernel/contracts/storage/config-store';
import type { StrategyDefinition } from '../../../kernel/contracts/debate-strategy-dsl';
import { StrategyRegistry } from './debate-strategy-registry';
import { safeJsonParse } from '../../../kernel/utils/safe-json';

// ── Versioned Strategy Record ──────────────────────────────────────

export interface StrategyVersion {
    readonly version: number;
    readonly definition: StrategyDefinition;
    readonly timestamp: number;
    readonly changeDescription?: string;
}

// ── Persistence keys ───────────────────────────────────────────────

const STRATEGIES_INDEX_KEY = 'debate-strategies-index';
const STRATEGY_PREFIX = 'debate-strategy:';
const STRATEGY_VERSION_PREFIX = 'debate-strategy-version:';

// ── Strategy Manager ───────────────────────────────────────────────

export class StrategyManager extends StrategyRegistry {
    private storage: ConfigStore | undefined;
    private versionHistories = new Map<string, StrategyVersion[]>();
    private _initialized = false;

    constructor(storage?: ConfigStore) {
        super();
        this.storage = storage;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        if (!this.storage) return;
        await this.loadPersistedStrategies();
        await this.loadVersionHistories();
    }

    // ── DB-16 named methods ──────────────────────────────────────

    registerStrategy(definition: StrategyDefinition, changeDescription?: string): void {
        this.register(definition, false);
        this.recordVersion(definition, changeDescription);
        void this.persistStrategiesIndex();
    }

    async registerStrategyAsync(
        definition: StrategyDefinition,
        changeDescription?: string,
    ): Promise<void> {
        this.register(definition, false);
        await this.recordVersion(definition, changeDescription);
        await this.persistStrategiesIndex();
    }

    async unregisterStrategy(id: string): Promise<boolean> {
        const result = this.unregister(id);
        if (result) {
            await this.persistStrategiesIndex();
        }
        return result;
    }

    validateStrategy(definition: StrategyDefinition) {
        return this.validate(definition);
    }

    // ── Versioning ───────────────────────────────────────────────

    private recordVersion(definition: StrategyDefinition, description?: string): void {
        const history = this.versionHistories.get(definition.id) || [];
        const version: StrategyVersion = {
            version: history.length + 1,
            definition,
            timestamp: Date.now(),
            changeDescription: description,
        };
        this.versionHistories.set(definition.id, [...history, version]);
        void this.persistVersionHistory(definition.id);
    }

    async getVersionHistory(strategyId: string): Promise<StrategyVersion[]> {
        return this.versionHistories.get(strategyId) || [];
    }

    async rollback(strategyId: string, targetVersion: number): Promise<boolean> {
        const history = this.versionHistories.get(strategyId);
        if (!history) return false;

        const target = history.find((v) => v.version === targetVersion);
        if (!target) return false;

        const existing = this.get(strategyId);
        if (existing && this.list().find((p) => p.definition.id === strategyId)?.builtin) {
            return false;
        }

        try {
            this.unregister(strategyId);
        } catch {
            return false;
        }
        this.register(target.definition, false);

        this.versionHistories.set(
            strategyId,
            history.filter((v) => v.version <= targetVersion),
        );
        await this.persistVersionHistory(strategyId);
        await this.persistStrategiesIndex();
        return true;
    }

    // ── Import / Export (with versioning) ────────────────────────

    async exportStrategy(strategyId: string): Promise<string | null> {
        const entry = this.list().find((e) => e.definition.id === strategyId);
        if (!entry) return null;

        const history = this.versionHistories.get(strategyId) || [];
        const exportData = {
            definition: entry.definition,
            versions: history,
            exportedAt: Date.now(),
        };
        return JSON.stringify(exportData, null, 2);
    }

    async importStrategy(
        json: string,
    ): Promise<{ success: boolean; definition?: StrategyDefinition; error?: string }> {
        try {
            const raw = safeJsonParse(json) as Record<string, unknown>;
            const def = raw.definition as StrategyDefinition;

            if (!def?.id || !def?.name) {
                return { success: false, error: 'Strategy must have id and name' };
            }

            const validation = this.validate(def);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Validation failed: ${validation.errors.map((e) => e.message).join('; ')}`,
                };
            }

            try {
                this.register(def, false);
            } catch (e) {
                return { success: false, error: String(e) };
            }

            const versions = raw.versions as StrategyVersion[] | undefined;
            if (Array.isArray(versions)) {
                this.versionHistories.set(def.id, versions);
                await this.persistVersionHistory(def.id);
            }

            await this.persistStrategiesIndex();
            return { success: true, definition: def };
        } catch {
            return { success: false, error: 'Invalid JSON' };
        }
    }

    // ── Persistence ──────────────────────────────────────────────

    private async loadPersistedStrategies(): Promise<void> {
        if (!this.storage) return;
        try {
            const index = await this.storage.get<string[]>(STRATEGIES_INDEX_KEY);
            if (!index) return;

            for (const id of index) {
                const def = await this.storage.get<StrategyDefinition>(`${STRATEGY_PREFIX}${id}`);
                if (def) {
                    try {
                        this.register(def, false);
                    } catch {
                        // Skip if builtin or invalid
                    }
                }
            }
        } catch {
            // Non-critical
        }
    }

    private async persistStrategiesIndex(): Promise<void> {
        if (!this.storage) return;
        try {
            const custom = this.list()
                .filter((e) => !e.builtin)
                .map((e) => e.definition.id);
            await this.storage.set(STRATEGIES_INDEX_KEY, custom);
            for (const e of this.list().filter((e) => !e.builtin)) {
                await this.storage.set(`${STRATEGY_PREFIX}${e.definition.id}`, e.definition);
            }
        } catch {
            // Non-critical
        }
    }

    private async loadVersionHistories(): Promise<void> {
        if (!this.storage) return;
        try {
            const entries = this.list();
            for (const entry of entries) {
                const history = await this.storage.get<StrategyVersion[]>(
                    `${STRATEGY_VERSION_PREFIX}${entry.definition.id}`,
                );
                if (history) {
                    this.versionHistories.set(entry.definition.id, history);
                }
            }
        } catch {
            // Non-critical
        }
    }

    destroy(): void {
        this._initialized = false;
        this.versionHistories.clear();
        super.destroy();
    }

    private async persistVersionHistory(strategyId: string): Promise<void> {
        if (!this.storage) return;
        try {
            const history = this.versionHistories.get(strategyId) || [];
            await this.storage.set(`${STRATEGY_VERSION_PREFIX}${strategyId}`, history);
        } catch {
            // Non-critical
        }
    }
}
