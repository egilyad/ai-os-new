import { CONFIG_DEFAULTS } from './config-registry';
import { setConfig } from './config-mutations';
import type {
    ConfigRegistry,
    MonitoringConfigSection,
    MetricsConfigSection,
    TracesConfigSection,
    WebhooksConfigSection,
    KeysConfigSection,
    LlmConfigSection,
    PressureConfigSection,
    PricingConfigSection,
    ServicesConfigSection,
} from '../contracts/config-registry';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
import { withTransaction } from '../utils/with-transaction';

const LOGGER = rootLogger.child('ConfigService');

export interface ConfigServiceDeps {
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    eventBus?: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
}

const OVERLAYS_KEY = 'config_overlays';

export type ConfigOverlays = {
    monitoring?: Partial<MonitoringConfigSection>;
    metrics?: Partial<MetricsConfigSection>;
    traces?: Partial<TracesConfigSection>;
    webhooks?: Partial<WebhooksConfigSection>;
    keys?: Partial<KeysConfigSection>;
    llm?: Partial<LlmConfigSection>;
    pressure?: Partial<PressureConfigSection>;
    pricing?: Partial<PricingConfigSection>;
    services?: Partial<ServicesConfigSection>;
};

export function deepMerge<T>(target: T, source?: Partial<T>, depth = 0): T {
    if (!source) return target;
    if (depth > 10) return { ...target, ...source } as T;
    const result = { ...target } as Record<string, unknown>;
    for (const key of Object.keys(source as Record<string, unknown>)) {
        const val = (source as Record<string, unknown>)[key];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            const base =
                result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])
                    ? (result[key] as Record<string, unknown>)
                    : {};
            result[key] = deepMerge(base as T, val as Partial<T>, depth + 1);
        } else {
            result[key] = val;
        }
    }
    return result as T;
}

export class ConfigService {
    private deps: ConfigServiceDeps;
    private overlays: ConfigOverlays = {};
    private unsub?: () => void;
    private _initialized = false;

    constructor(deps: ConfigServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        try {
            const saved = await this.deps.database.getKv<typeof this.overlays>(OVERLAYS_KEY);
            if (saved) {
                this.overlays = saved;
                this.applyOverlays(saved);
            }
        } catch (e) {
            LOGGER.warn('ConfigService', 'Failed to load config overlays, using defaults', {
                error: e,
            });
            this.overlays = {};
        }

        if (this.deps.eventBus) {
            this.unsub = this.deps.eventBus.on(EVENTS.SETTINGS_UPDATED, (data: unknown) => {
                const payload = data as { changes?: { full?: boolean } };
                if (payload?.changes?.full) {
                    this.overlays = {};
                }
            });
        }
    }

    destroy(): void {
        this.unsub?.();
    }

    clearOverlays(): void {
        this.overlays = {};
    }

    getMonitoring(): MonitoringConfigSection {
        return deepMerge(CONFIG_DEFAULTS.monitoring, this.overlays.monitoring);
    }

    getMetrics(): MetricsConfigSection {
        return deepMerge(CONFIG_DEFAULTS.metrics, this.overlays.metrics);
    }

    getTraces(): TracesConfigSection {
        return deepMerge(CONFIG_DEFAULTS.traces, this.overlays.traces);
    }

    getWebhooks(): WebhooksConfigSection {
        return deepMerge(CONFIG_DEFAULTS.webhooks, this.overlays.webhooks);
    }

    getKeys(): KeysConfigSection {
        return deepMerge(CONFIG_DEFAULTS.keys, this.overlays.keys);
    }

    getLlm(): LlmConfigSection {
        return deepMerge(CONFIG_DEFAULTS.llm, this.overlays.llm);
    }

    getPressure(): PressureConfigSection {
        return deepMerge(CONFIG_DEFAULTS.pressure, this.overlays.pressure);
    }

    getPricing(): PricingConfigSection {
        return deepMerge(CONFIG_DEFAULTS.pricing, this.overlays.pricing);
    }

    getServices(): ServicesConfigSection {
        return deepMerge(CONFIG_DEFAULTS.services, this.overlays.services);
    }

    private getConfigForSection(section: string) {
        switch (section) {
            case 'monitoring':
                return this.getMonitoring();
            case 'metrics':
                return this.getMetrics();
            case 'traces':
                return this.getTraces();
            case 'webhooks':
                return this.getWebhooks();
            case 'keys':
                return this.getKeys();
            case 'llm':
                return this.getLlm();
            case 'pressure':
                return this.getPressure();
            case 'pricing':
                return this.getPricing();
            case 'services':
                return this.getServices();
            default:
                return undefined;
        }
    }

    private async _updateSection<K extends keyof ConfigOverlays>(
        section: K,
        partial: Partial<NonNullable<ConfigOverlays[K]>>,
    ): Promise<void> {
        const snapshot = structuredClone(this.overlays);
        await withTransaction(
            `config:${String(section)}`,
            async (tx) => {
                this.overlays[section] = deepMerge(
                    (this.overlays[section] || {}) as Record<string, unknown>,
                    partial as Record<string, unknown>,
                ) as ConfigOverlays[K];
                setConfig(
                    section as keyof ConfigRegistry,
                    deepMerge(
                        CONFIG_DEFAULTS[section as keyof ConfigRegistry] as Record<string, unknown>,
                        this.overlays[section] as Record<string, unknown>,
                    ),
                );
                tx.deferPersist(
                    () => this.deps.database.setKv(OVERLAYS_KEY, this.overlays),
                    async () => {
                        this.overlays = structuredClone(snapshot);
                        const defaults = CONFIG_DEFAULTS as Record<string, unknown>;
                        for (const k of Object.keys(defaults) as (keyof ConfigRegistry)[]) {
                            const merged = this.overlays[k as keyof ConfigOverlays]
                                ? deepMerge(
                                      defaults[k] as Record<string, unknown>,
                                      this.overlays[k as keyof ConfigOverlays] as Record<
                                          string,
                                          unknown
                                      >,
                                  )
                                : defaults[k];
                            setConfig(k, merged as never);
                        }
                    },
                );
                tx.deferEmit(EVENTS.SETTINGS_UPDATED, {
                    settings: this.getConfigForSection(section as string),
                    changes: partial,
                });
            },
            this.deps.eventBus as { emit: (event: string, data?: unknown) => void },
        );
    }

    async updateMonitoring(partial: Partial<MonitoringConfigSection>) {
        await this._updateSection('monitoring', partial);
    }

    async updateMetrics(partial: Partial<MetricsConfigSection>) {
        await this._updateSection('metrics', partial);
    }

    async updateTraces(partial: Partial<TracesConfigSection>) {
        await this._updateSection('traces', partial);
    }

    async updateWebhooks(partial: Partial<WebhooksConfigSection>) {
        await this._updateSection('webhooks', partial);
    }

    async updateKeys(partial: Partial<KeysConfigSection>) {
        await this._updateSection('keys', partial);
    }

    async updateLlm(partial: Partial<LlmConfigSection>) {
        await this._updateSection('llm', partial);
    }

    async updatePressure(partial: Partial<PressureConfigSection>) {
        await this._updateSection('pressure', partial);
    }

    async updatePricing(partial: Partial<PricingConfigSection>) {
        await this._updateSection('pricing', partial);
    }

    async updateServices(partial: Partial<ServicesConfigSection>) {
        await this._updateSection('services', partial);
    }

    private applyOverlays(overlays: ConfigOverlays) {
        const defaults = CONFIG_DEFAULTS as Record<string, unknown>;
        for (const [key, value] of Object.entries(overlays)) {
            if (value)
                setConfig(
                    key as keyof ConfigRegistry,
                    deepMerge(defaults[key] as Record<string, unknown>, value),
                );
        }
    }
}
