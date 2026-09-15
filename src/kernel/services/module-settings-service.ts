/**
 * Module Settings Service — AGEMS port, Phase 7.2.
 * Per-module settings: enabled, activityLevel (1-5), autonomyLevel (1-5).
 */
import { rootLogger } from './logger-service';

const log = rootLogger.child('ModuleSettingsService');

export interface ModuleSettings {
    moduleId: string;
    enabled: boolean;
    activityLevel: number; // 1-5
    autonomyLevel: number; // 1-5
}

const DEFAULT_MODULES: ModuleSettings[] = [
    { moduleId: 'lenses', enabled: true, activityLevel: 3, autonomyLevel: 3 },
    { moduleId: 'crystals', enabled: true, activityLevel: 3, autonomyLevel: 3 },
    { moduleId: 'junctions', enabled: true, activityLevel: 3, autonomyLevel: 3 },
    { moduleId: 'synthesis', enabled: true, activityLevel: 3, autonomyLevel: 3 },
    { moduleId: 'knowledge-generator', enabled: true, activityLevel: 3, autonomyLevel: 3 },
    { moduleId: 'forum', enabled: true, activityLevel: 3, autonomyLevel: 3 },
    { moduleId: 'builder', enabled: true, activityLevel: 3, autonomyLevel: 3 },
    { moduleId: 'debate', enabled: true, activityLevel: 3, autonomyLevel: 3 },
    { moduleId: 'director', enabled: true, activityLevel: 3, autonomyLevel: 3 },
    { moduleId: 'invocation', enabled: true, activityLevel: 3, autonomyLevel: 3 },
];

export class ModuleSettingsService {
    private db: {
        keyValue: {
            get(id: string): Promise<{ value: unknown } | undefined>;
            put(record: { id: string; value: unknown; version?: number }): Promise<string>;
        };
    };
    private settings: ModuleSettings[] = [];

    constructor(db: {
        keyValue: {
            get(id: string): Promise<{ value: unknown } | undefined>;
            put(record: { id: string; value: unknown; version?: number }): Promise<string>;
        };
    }) {
        this.db = db;
    }

    private static KEY = 'module_settings';

    async init(): Promise<void> {
        const record = await this.db.keyValue.get(ModuleSettingsService.KEY);
        if (record?.value && Array.isArray(record.value)) {
            this.settings = record.value as ModuleSettings[];
        } else {
            this.settings = [...DEFAULT_MODULES];
            await this.persist();
        }
    }

    private async persist(): Promise<void> {
        await this.db.keyValue.put({
            id: ModuleSettingsService.KEY,
            value: this.settings,
        });
    }

    getAll(): ModuleSettings[] {
        return [...this.settings];
    }

    get(moduleId: string): ModuleSettings | undefined {
        return this.settings.find(s => s.moduleId === moduleId);
    }

    async update(moduleId: string, updates: Partial<Pick<ModuleSettings, 'enabled' | 'activityLevel' | 'autonomyLevel'>>): Promise<ModuleSettings> {
        const idx = this.settings.findIndex(s => s.moduleId === moduleId);
        if (idx === -1) {
            const newSettings: ModuleSettings = {
                moduleId,
                enabled: updates.enabled ?? true,
                activityLevel: updates.activityLevel ?? 3,
                autonomyLevel: updates.autonomyLevel ?? 3,
            };
            this.settings.push(newSettings);
            await this.persist();
            log.info('update', `Created settings for ${moduleId}`);
            return newSettings;
        }

        this.settings[idx] = { ...this.settings[idx], ...updates };
        await this.persist();
        log.info('update', `Updated settings for ${moduleId}`);
        return this.settings[idx];
    }

    async reset(moduleId: string): Promise<void> {
        const defaults = DEFAULT_MODULES.find(m => m.moduleId === moduleId);
        if (defaults) {
            await this.update(moduleId, defaults);
        }
    }

    async resetAll(): Promise<void> {
        this.settings = [...DEFAULT_MODULES];
        await this.persist();
    }
}
