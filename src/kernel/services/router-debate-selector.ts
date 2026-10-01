import type { ApiKey } from '../types/metrics-types';
import type { IKeyStateStore } from '../contracts/key-state';
import type { RouterDecisionRecorder } from './router-decision-recorder';
import { rootLogger } from './logger-service';
const RDS_LOGGER = rootLogger.child('RouterDebateSelector');

export interface DebateSelectorDeps {
    keyService: {
        getKeys: () => ApiKey[];
        isProviderCircuitOpen: (provider: string) => boolean;
        isProviderRateLimited: (provider: string) => boolean;
        isKeyInBackoff: (keyId: string) => { backoff: boolean; remainingMs: number };
    };
    kernel: {
        getState: () => {
            providers: Record<
                string,
                {
                    avgTTFT: number;
                    avgTPS: number;
                    reliability: number;
                    totalRequests: number;
                    selectionRate: number;
                    status: string;
                }
            >;
        };
    };
    keyStateStore?: IKeyStateStore;
    decisionRecorder: RouterDecisionRecorder;
}

export class RouterDebateSelector {
    private deps: DebateSelectorDeps;

    constructor(deps: DebateSelectorDeps) {
        this.deps = deps;
    }

    getDebateProviders(count: number): Array<{ provider: string; key: ApiKey }> {
        const allKeys = this.deps.keyService.getKeys();
        let activeKeys = allKeys.filter((k) => {
            const ks = this.deps.keyStateStore?.get(k.id);
            if (ks) {
                if (ks.flags.authFailed) {
                    this.deps.decisionRecorder.logDebateSkip(
                        k,
                        `Auth failed — key unauthorized`,
                        'status',
                    );
                    return false;
                }
                if (ks.healthScore < 75) {
                    this.deps.decisionRecorder.logDebateSkip(
                        k,
                        `Health score: ${ks.healthScore}/100`,
                        'status',
                    );
                    return false;
                }
            } else {
                if (k.status !== 'active') {
                    this.deps.decisionRecorder.logDebateSkip(k, `Status: ${k.status}`, 'status');
                    return false;
                }
                if (this.deps.keyService.isProviderCircuitOpen(k.provider)) {
                    this.deps.decisionRecorder.logDebateSkip(k, 'Circuit breaker open', 'circuit');
                    return false;
                }
                if (this.deps.keyService.isProviderRateLimited(k.provider)) {
                    this.deps.decisionRecorder.logDebateSkip(k, 'Rate limited', 'ratelimit');
                    return false;
                }
            }
            return true;
        });
        RDS_LOGGER.debug('RouterDebateSelector', 'getDebateProviders primary pass', {
            totalKeys: allKeys.length,
            activeCount: activeKeys.length,
            activeProviders: activeKeys.map(
                (k) =>
                    `${k.provider}:${k.id.slice(0, 8)} health=${this.deps.keyStateStore?.get(k.id)?.healthScore ?? 'N/A'}`,
            ),
            skippedAuth: allKeys
                .filter((k) => this.deps.keyStateStore?.get(k.id)?.flags.authFailed)
                .map((k) => k.provider),
        });
        if (activeKeys.length === 0) {
            activeKeys = allKeys.filter((k) => {
                const ks = this.deps.keyStateStore?.get(k.id);
                if (ks) {
                    if (ks.flags.authFailed) {
                        this.deps.decisionRecorder.logDebateSkip(
                            k,
                            `Fallback skipped — auth failed`,
                            'status',
                        );
                        return false;
                    }
                    if (ks.healthScore < 25) {
                        this.deps.decisionRecorder.logDebateSkip(
                            k,
                            `Fallback skipped — health score ${ks.healthScore}/100`,
                            'status',
                        );
                        return false;
                    }
                } else {
                    if (k.status === 'error') {
                        this.deps.decisionRecorder.logDebateSkip(
                            k,
                            `Fallback skipped — Status: ${k.status}`,
                            'status',
                        );
                        return false;
                    }
                    const backoff = this.deps.keyService.isKeyInBackoff(k.id);
                    if (backoff.backoff) {
                        this.deps.decisionRecorder.logDebateSkip(
                            k,
                            `Fallback skipped — backoff ${backoff.remainingMs}ms`,
                            'backoff',
                        );
                        return false;
                    }
                }
                return true;
            });
        }
        RDS_LOGGER.debug('RouterDebateSelector', 'getDebateProviders active after filter', {
            fallbackUsed: activeKeys.length,
            providers: activeKeys.map((k) => {
                const ks = this.deps.keyStateStore?.get(k.id);
                return `${k.provider}:${k.id.slice(0, 8)} health=${ks?.healthScore ?? 'N/A'} auth=${!ks?.flags.authFailed}`;
            }),
        });
        // Audit R1: was collapse-to-1-key-per-provider — the other 16 keys
        // of a 20-key fleet only surfaced in last-resort brute-force.
        // Keep up to 3 keys per provider so Step 4 failover has depth;
        // provider-diversity ordering (PRIORITY sort) is preserved.
        const byProvider = new Map<string, ApiKey[]>();
        for (const k of activeKeys) {
            const arr = byProvider.get(k.provider) ?? [];
            if (arr.length < 3) arr.push(k);
            byProvider.set(k.provider, arr);
        }
        const PRIORITY = [
            'groq',
            'gemini',
            'openrouter',
            'nvidia',
            'cerebras',
            'cloudflare',
            'deepseek',
            'cohere',
            'scaleway',
            'github',
            'blackbox',
            'cometapi',
        ];
        const sorted = Array.from(byProvider.entries()).sort(([a], [b]) => {
            const ia = PRIORITY.indexOf(a);
            const ib = PRIORITY.indexOf(b);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        return sorted
            .slice(0, Math.min(count, sorted.length))
            .flatMap(([provider, keys]) => keys.map((key) => ({ provider, key })));
    }

    getProviderStats() {
        const state = this.deps.kernel.getState();
        return Object.entries(state.providers).map(([id, p]) => ({
            id,
            avgTTFT: p.avgTTFT,
            avgTPS: p.avgTPS,
            reliability: p.reliability,
            totalRequests: p.totalRequests,
            selectionRate: p.selectionRate,
            status: p.status,
        }));
    }
}
