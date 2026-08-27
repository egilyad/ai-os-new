import type { IHealthSlaService, SlaProfile, SlaRule } from '../contracts/health-sla';
import type { IProviderTracker } from '../types/interfaces';
import { rootLogger } from './logger-service';
const HS_LOGGER = rootLogger.child('HealthSlaService');

const genId = () => crypto.randomUUID();
const genRuleId = () => crypto.randomUUID();

export interface HealthSlaServiceDeps {
    providerTracker: IProviderTracker;
}

/**
 * @deprecated MOCK — simulated backend. Replace with real implementation before production use.
 */
export class HealthSlaService implements IHealthSlaService {
    private profiles: SlaProfile[] = [
        {
            id: genId(),
            name: 'Production Critical',
            description: 'Strict SLA for production-grade providers',
            rules: [
                {
                    id: genRuleId(),
                    name: 'Max Latency',
                    metric: 'latency',
                    operator: 'lt',
                    threshold: 2000,
                    unit: 'ms',
                    severity: 'critical',
                    enabled: true,
                },
                {
                    id: genRuleId(),
                    name: 'Min Uptime',
                    metric: 'uptime',
                    operator: 'gte',
                    threshold: 99.5,
                    unit: '%',
                    severity: 'critical',
                    enabled: true,
                },
                {
                    id: genRuleId(),
                    name: 'Error Rate',
                    metric: 'error_rate',
                    operator: 'lt',
                    threshold: 1,
                    unit: '%',
                    severity: 'warning',
                    enabled: true,
                },
            ],
            providers: ['Groq', 'NVIDIA'],
            createdAt: Date.now() - 86400000 * 14,
            updatedAt: Date.now() - 86400000 * 7,
        },
        {
            id: genId(),
            name: 'Best Effort',
            description: 'Relaxed SLA for experimental providers',
            rules: [
                {
                    id: genRuleId(),
                    name: 'Max Latency',
                    metric: 'latency',
                    operator: 'lt',
                    threshold: 5000,
                    unit: 'ms',
                    severity: 'warning',
                    enabled: true,
                },
                {
                    id: genRuleId(),
                    name: 'Min Uptime',
                    metric: 'uptime',
                    operator: 'gte',
                    threshold: 95,
                    unit: '%',
                    severity: 'info',
                    enabled: true,
                },
            ],
            providers: ['Gemini', 'OpenRouter'],
            createdAt: Date.now() - 86400000 * 7,
            updatedAt: Date.now() - 86400000,
        },
    ];
    private deps: HealthSlaServiceDeps;

    constructor(deps: HealthSlaServiceDeps) {
        this.deps = deps;
    }

    getProfiles(): SlaProfile[] {
        return [...this.profiles];
    }

    getProfile(id: string): SlaProfile | undefined {
        return this.profiles.find((p) => p.id === id);
    }

    createProfile(name: string, description: string): SlaProfile {
        const profile: SlaProfile = {
            id: genId(),
            name,
            description,
            rules: [],
            providers: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.profiles.push(profile);
        return profile;
    }

    updateProfile(id: string, updates: Partial<SlaProfile>): SlaProfile {
        const idx = this.profiles.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error(`Profile ${id} not found`);
        this.profiles[idx] = {
            ...this.profiles[idx]!,
            ...updates,
            updatedAt: Date.now(),
        } as SlaProfile;
        return { ...this.profiles[idx]! };
    }

    deleteProfile(id: string): void {
        this.profiles = this.profiles.filter((p) => p.id !== id);
    }

    addRule(profileId: string, rule: Omit<SlaRule, 'id'>): SlaRule {
        const profile = this.profiles.find((p) => p.id === profileId);
        if (!profile) throw new Error(`Profile ${profileId} not found`);
        const newRule: SlaRule = { ...rule, id: genRuleId() };
        profile.rules.push(newRule);
        profile.updatedAt = Date.now();
        return newRule;
    }

    updateRule(profileId: string, ruleId: string, updates: Partial<SlaRule>): void {
        const profile = this.profiles.find((p) => p.id === profileId);
        if (!profile) throw new Error(`Profile ${profileId} not found`);
        const rule = profile.rules.find((r) => r.id === ruleId);
        if (!rule) throw new Error(`Rule ${ruleId} not found`);
        Object.assign(rule, updates);
        profile.updatedAt = Date.now();
    }

    removeRule(profileId: string, ruleId: string): void {
        const profile = this.profiles.find((p) => p.id === profileId);
        if (!profile) throw new Error(`Profile ${profileId} not found`);
        profile.rules = profile.rules.filter((r) => r.id !== ruleId);
        profile.updatedAt = Date.now();
    }

    evaluateProfile(profileId: string): { ruleId: string; passed: boolean; actual: number }[] {
        const profile = this.profiles.find((p) => p.id === profileId);
        if (!profile) throw new Error(`Profile ${profileId} not found`);
        HS_LOGGER.warn(
            'HealthSlaService',
            'evaluateProfile uses @deprecated MOCK backend — metrics are simulated',
            { profileId, profileName: profile.name },
        );
        return profile.rules.map((rule) => {
            let actual: number;
            let hasData = false;
            switch (rule.metric) {
                case 'latency': {
                    const latencies: number[] = [];
                    for (const prov of profile.providers) {
                        const m = this.deps.providerTracker.getMetrics(prov, '');
                        if (m && m.avgLatency > 0) latencies.push(m.avgLatency);
                    }
                    hasData = latencies.length > 0;
                    actual = hasData ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
                    break;
                }
                case 'error_rate': {
                    const rates: number[] = [];
                    for (const prov of profile.providers) {
                        const m = this.deps.providerTracker.getMetrics(prov, '');
                        if (m && m.totalRequests > 0)
                            rates.push((m.errors / m.totalRequests) * 100);
                    }
                    hasData = rates.length > 0;
                    actual = hasData ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
                    break;
                }
                case 'uptime': {
                    const ups: number[] = [];
                    for (const prov of profile.providers) {
                        const m = this.deps.providerTracker.getMetrics(prov, '');
                        if (m && m.totalRequests > 0)
                            ups.push(((m.totalRequests - m.errors) / m.totalRequests) * 100);
                    }
                    hasData = ups.length > 0;
                    actual = hasData ? ups.reduce((a, b) => a + b, 0) / ups.length : 100;
                    break;
                }
                case 'throughput': {
                    const tps: number[] = [];
                    for (const prov of profile.providers) {
                        const m = this.deps.providerTracker.getMetrics(prov, '');
                        if (m) tps.push(m.totalRequests);
                    }
                    hasData = tps.length > 0;
                    actual = hasData ? tps.reduce((a, b) => a + b, 0) / tps.length : 0;
                    break;
                }
                default:
                    actual = 0;
            }
            const passed =
                rule.operator === 'lt'
                    ? actual < rule.threshold
                    : rule.operator === 'gt'
                      ? actual > rule.threshold
                      : rule.operator === 'lte'
                        ? actual <= rule.threshold
                        : rule.operator === 'gte'
                          ? actual >= rule.threshold
                          : actual === rule.threshold;
            return {
                ruleId: rule.id,
                passed: hasData ? passed : false,
                actual: Math.round(actual * 100) / 100,
            };
        });
    }
}
