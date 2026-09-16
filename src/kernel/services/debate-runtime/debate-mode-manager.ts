import type { DebateMode } from '../../contracts/debate-mode-system';
import { DebateModeManager } from './debate-mode-system';
import { safeJsonParse } from '../../../kernel/utils/safe-json';

// ── Versioned Mode Record ──────────────────────────────────────────

export interface ModeVersion {
    readonly version: number;
    readonly mode: DebateMode;
    readonly timestamp: number;
    readonly changeDescription?: string;
}

export interface ModeVersionHistory {
    readonly modeId: string;
    readonly versions: ModeVersion[];
}

// ── Persistence Layer ──────────────────────────────────────────────

interface ModeStorage {
    config: {
        get<T>(key: string): Promise<T | null>;
        set<T>(key: string, value: T): Promise<void>;
    };
}

const MODES_INDEX_KEY = 'debate-modes-index';
const MODE_VERSION_PREFIX = 'debate-mode-version:';

// ── Extended Mode Manager ──────────────────────────────────────────

export class DebateModeManagerPersistent extends DebateModeManager {
    private storage: ModeStorage | undefined;
    private versionHistories = new Map<string, ModeVersion[]>();
    private _initialized = false;

    constructor(storage?: ModeStorage) {
        super();
        this.storage = storage;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        if (!this.storage) return;
        await this.loadPersistedModes();
        await this.loadVersionHistories();
    }

    // ── Override register to add versioning ──────────────────────

    async registerVersioned(mode: DebateMode, changeDescription?: string): Promise<void> {
        this.register(mode);
        await this.recordVersion(mode, changeDescription);
        await this.persistModesIndex();
    }

    async unregisterVersioned(id: string): Promise<boolean> {
        const result = this.unregister(id);
        if (result) {
            await this.persistModesIndex();
        }
        return result;
    }

    // ── Versioning ───────────────────────────────────────────────

    private async recordVersion(mode: DebateMode, description?: string): Promise<void> {
        const history = this.versionHistories.get(mode.id) || [];
        const version: ModeVersion = {
            version: history.length + 1,
            mode,
            timestamp: Date.now(),
            changeDescription: description,
        };
        this.versionHistories.set(mode.id, [...history, version]);
        await this.persistVersionHistory(mode.id);
    }

    async getVersionHistory(modeId: string): Promise<ModeVersion[]> {
        return this.versionHistories.get(modeId) || [];
    }

    async rollback(modeId: string, targetVersion: number): Promise<boolean> {
        const history = this.versionHistories.get(modeId);
        if (!history) return false;

        const target = history.find((v) => v.version === targetVersion);
        if (!target) return false;

        // Check if builtin before mutating history
        const existing = this.get(modeId);
        if (existing && this.list().find((p) => p.mode.id === modeId)?.builtin) {
            return false;
        }

        // Re-register with rolled-back mode
        try {
            this.unregister(modeId);
        } catch {
            return false;
        }
        this.register(target.mode);

        // Now safe to mutate history
        this.versionHistories.set(
            modeId,
            history.filter((v) => v.version <= targetVersion),
        );
        await this.persistVersionHistory(modeId);
        await this.persistModesIndex();
        return true;
    }

    // ── Import / Export (with versioning) ────────────────────────

    async exportMode(modeId: string): Promise<string | null> {
        const json = this.exportJson(modeId);
        if (!json) return null;

        const history = this.versionHistories.get(modeId) || [];
        const exportData = {
            mode: safeJsonParse(json),
            versions: history,
            exportedAt: Date.now(),
        };
        return JSON.stringify(exportData, null, 2);
    }

    async importMode(
        json: string,
    ): Promise<{ success: boolean; mode?: DebateMode; error?: string }> {
        try {
            const data = safeJsonParse(json) as Record<string, unknown> | undefined;
            const mode = (data as Record<string, unknown>)?.mode as DebateMode;

            if (!mode.id || !mode.name) {
                return { success: false, error: 'Mode must have id and name' };
            }

            // Register mode
            try {
                this.register(mode);
            } catch (e) {
                return { success: false, error: String(e) };
            }

            // Restore version history if present
            if (Array.isArray((data as Record<string, unknown>)?.versions)) {
                this.versionHistories.set(
                    mode.id,
                    (data as Record<string, unknown>)?.versions as ModeVersion[],
                );
                await this.persistVersionHistory(mode.id);
            }

            await this.persistModesIndex();
            return { success: true, mode };
        } catch {
            return { success: false, error: 'Invalid JSON' };
        }
    }

    // ── Persistence ──────────────────────────────────────────────

    private async loadPersistedModes(): Promise<void> {
        if (!this.storage) return;
        try {
            const index = await this.storage.config.get<string[]>(MODES_INDEX_KEY);
            if (!index) return;

            for (const modeId of index) {
                const modeJson = await this.storage.config.get<DebateMode>(`debate-mode:${modeId}`);
                if (modeJson) {
                    try {
                        this.register(modeJson);
                    } catch {
                        // Skip if builtin or invalid
                    }
                }
            }
        } catch {
            // Non-critical
        }
    }

    private async persistModesIndex(): Promise<void> {
        if (!this.storage) return;
        try {
            const modes = this.list()
                .filter((p) => !p.builtin)
                .map((p) => p.mode.id);
            await this.storage.config.set(MODES_INDEX_KEY, modes);
        } catch {
            // Non-critical
        }
    }

    private async loadVersionHistories(): Promise<void> {
        if (!this.storage) return;
        try {
            const modes = this.list();
            for (const preset of modes) {
                const history = await this.storage.config.get<ModeVersion[]>(
                    `${MODE_VERSION_PREFIX}${preset.mode.id}`,
                );
                if (history) {
                    this.versionHistories.set(preset.mode.id, history);
                }
            }
        } catch {
            // Non-critical
        }
    }

    private async persistVersionHistory(modeId: string): Promise<void> {
        if (!this.storage) return;
        try {
            const history = this.versionHistories.get(modeId) || [];
            await this.storage.config.set(`${MODE_VERSION_PREFIX}${modeId}`, history);
        } catch {
            // Non-critical
        }
    }

    destroy(): void {
        this._initialized = false;
        this.versionHistories.clear();
    }
}
