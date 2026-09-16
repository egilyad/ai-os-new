import type { ConfigRegistry } from '../contracts/config-registry';
import { EVENTS } from '../events/event-names';
import type { IEventBus } from '../types/interfaces';
import { rawConfig } from './config-registry';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ConfigMutations');

let _configEventBus: IEventBus | null = null;

/** Inject the event bus (called once at bootstrap). */
export function setConfigEventBus(bus: IEventBus): void {
    _configEventBus = bus;
}

const CONFIG_TOP_LEVEL_KEYS = new Set<string>([
    'version',
    'buildId',
    'router',
    'monitoring',
    'metrics',
    'traces',
    'webhooks',
    'keys',
    'llm',
    'pressure',
    'pricing',
    'services',
    'storage',
    'security',
    'featureFlags',
]);

/** Replace entire rawConfig with a new snapshot (used by config-history rollback). */
export function replaceConfig(next: ConfigRegistry): void {
    const target = rawConfig as unknown as Record<string, unknown>;
    const entries = Object.entries(next as unknown as Record<string, unknown>);
    for (const [key, value] of entries) {
        if (!CONFIG_TOP_LEVEL_KEYS.has(key)) {
            LOGGER.warn('replaceConfig', `Ignoring unknown config key "${key}"`);
            continue;
        }
        target[key] = value;
    }
    _configEventBus?.emit(EVENTS.SETTINGS_UPDATED, { settings: {}, changes: { full: true } });
}

/** Update a single top-level section in rawConfig (used by config-service). */
export function setConfig<K extends keyof ConfigRegistry>(key: K, value: ConfigRegistry[K]): void {
    if (!CONFIG_TOP_LEVEL_KEYS.has(key as string)) {
        LOGGER.warn('setConfig', `Ignoring unknown config key "${String(key)}"`);
        return;
    }
    rawConfig[key] = value;
    _configEventBus?.emit(EVENTS.SETTINGS_UPDATED, { settings: {}, changes: { [key]: true } });
}

/** Update a feature flag value in rawConfig. Clones the section, mutates, and replaces via setConfig. */
export function setFeatureFlag(path: string, enabled: boolean): void {
    const section = structuredClone(rawConfig.featureFlags);
    const parts = path.replace(/^featureFlags\./, '').split('.');
    let target: Record<string, unknown> = section as unknown as Record<string, unknown>;
    for (let i = 0; i < parts.length - 1; i++) {
        const next = target[parts[i]!];
        if (!next || typeof next !== 'object') return;
        target = next as Record<string, unknown>;
    }
    const flagKey = parts[parts.length - 1]!;
    if (target[flagKey] === enabled) return;
    target[flagKey] = enabled;
    setConfig('featureFlags', section);
}
