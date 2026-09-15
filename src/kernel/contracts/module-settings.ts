/**
 * Module Settings service contract — AGEMS port, Phase 7.2.
 */

export interface ModuleSettings {
    moduleId: string;
    enabled: boolean;
    activityLevel: number; // 1-5
    autonomyLevel: number; // 1-5
}

export interface IModuleSettingsService {
    init(): Promise<void>;
    getAll(): ModuleSettings[];
    get(moduleId: string): ModuleSettings | undefined;
    update(moduleId: string, updates: Partial<Pick<ModuleSettings, 'enabled' | 'activityLevel' | 'autonomyLevel'>>): Promise<ModuleSettings>;
    reset(moduleId: string): Promise<void>;
    resetAll(): Promise<void>;
}
