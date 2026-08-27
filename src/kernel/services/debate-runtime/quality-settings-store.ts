import { ssrSafeStorage } from '../../utils/ssr-storage';
import {
    QUALITY_SETTINGS_STORAGE_KEY,
    QUALITY_TECHNIQUES,
} from '../../contracts/debate-quality-settings';
import type { QualityTechnique } from '../../contracts/debate-quality-settings';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('QualitySettingsStore');

export type QualitySettingsMap = Record<string, boolean>;

const DEFAULT_SETTINGS: QualitySettingsMap = Object.fromEntries(
    QUALITY_TECHNIQUES.map((t) => [t.id, t.defaultEnabled]),
);

let _cache: QualitySettingsMap | null = null;

function loadRaw(): QualitySettingsMap {
    try {
        const raw = ssrSafeStorage.getItem(QUALITY_SETTINGS_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as QualitySettingsMap;
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
    } catch {
        LOGGER.warn('QualitySettingsStore', 'Failed to load settings, using defaults');
    }
    return { ...DEFAULT_SETTINGS };
}

function persist(settings: QualitySettingsMap): void {
    try {
        ssrSafeStorage.setItem(QUALITY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
        LOGGER.warn('QualitySettingsStore', 'Failed to persist settings');
    }
}

export function getAllSettings(): QualitySettingsMap {
    if (!_cache) {
        _cache = loadRaw();
    }
    return { ..._cache };
}

export function getSetting(techniqueId: string): boolean {
    const all = getAllSettings();
    return all[techniqueId] ?? DEFAULT_SETTINGS[techniqueId] ?? true;
}

export function setSetting(techniqueId: string, enabled: boolean): void {
    if (!_cache) {
        _cache = getAllSettings();
    }
    _cache[techniqueId] = enabled;
    persist(_cache);
}

export function setAllSettings(settings: QualitySettingsMap): void {
    _cache = { ...DEFAULT_SETTINGS, ...settings };
    persist(_cache);
}

export function resetAllSettings(): void {
    _cache = { ...DEFAULT_SETTINGS };
    persist(_cache);
}

export function getDefaultSettings(): QualitySettingsMap {
    return { ...DEFAULT_SETTINGS };
}

export function getTechniques(): QualityTechnique[] {
    return QUALITY_TECHNIQUES;
}

export function clearSettingsCache(): void {
    _cache = null;
}
