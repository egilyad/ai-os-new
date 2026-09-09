import type { ApiKey } from '../types/metrics-types';
import type {
    FallbackLink,
    RoutingPolicyPreview,
    RoutingPolicyPreviewInput,
    RoutingPolicySnapshot,
} from '../contracts/routing-policy';
import type { RoutingStrategy } from './router-types';
import type { RouterDecisionRecorder } from './router-decision-recorder';

export interface FallbackResolverDeps {
    keyService: {
        getKeys: () => ApiKey[];
        getPoolKeys: (provider: string) => ApiKey[];
        selectFromPool: (provider: string) => ApiKey | undefined;
        selectWithBurst?: (provider: string) => ApiKey | undefined;
        canUseKey: (keyId: string) => { can: boolean; reason?: string };
    };
    budgetService: {
        canUseProvider: (provider: string) => boolean;
    };
    routingPolicyService: {
        getSnapshot: () => RoutingPolicySnapshot;
        preview: (input: RoutingPolicyPreviewInput) => RoutingPolicyPreview;
        getFallbackChain: (strategy: string) => FallbackLink[];
        setFallbackChain: (strategy: string, chain: FallbackLink[]) => void;
        setDowngradeChain: (model: string, chain: string[]) => void;
        getDowngradedModel: (model: string) => string | null;
        getDeepDowngradedModel: (model: string, steps: number) => string | null;
    };
    decisionRecorder: RouterDecisionRecorder;
}

export class RouterFallbackResolver {
    private deps: FallbackResolverDeps;

    constructor(deps: FallbackResolverDeps) {
        this.deps = deps;
    }

    getFallbackChain(strategy: RoutingStrategy): FallbackLink[] {
        return this.deps.routingPolicyService.getFallbackChain(strategy);
    }

    resolveWithFallback(
        strategy: RoutingStrategy,
        excludeProviders?: Set<string> | string,
        excludeKeyId?: string,
    ): { key: ApiKey; provider: string } | null {
        const rawSet =
            typeof excludeProviders === 'string'
                ? new Set([excludeProviders])
                : (excludeProviders ?? new Set());
        const excludedSet = new Set(Array.from(rawSet).map((p) => p.toLowerCase()));
        const chain = this.getFallbackChain(strategy);
        for (const link of chain) {
            if (excludedSet.has(link.provider.toLowerCase())) {
                continue;
            }
            if (!this.deps.budgetService.canUseProvider(link.provider)) {
                continue;
            }
            const pool = this.deps.keyService.getPoolKeys(link.provider);
            const usable = pool.filter((k) => {
                if (excludeKeyId && k.id === excludeKeyId) return false;
                const u = this.deps.keyService.canUseKey(k.id);
                return u.can;
            });
            if (usable.length > 0) {
                const selectedKey =
                    this.deps.keyService.selectWithBurst?.(link.provider) ??
                    this.deps.keyService.selectFromPool(link.provider);
                if (!selectedKey) continue;
                return { key: selectedKey, provider: link.provider };
            }
        }
        const allActive = this.deps.keyService.getKeys().filter((k) => k.status === 'active');
        if (allActive.length > 0) {
            for (const k of allActive) {
                if (!this.deps.budgetService.canUseProvider(k.provider)) continue;
                const selected =
                    this.deps.keyService.selectWithBurst?.(k.provider) ??
                    this.deps.keyService.selectFromPool(k.provider);
                if (selected && this.deps.keyService.canUseKey(selected.id).can) {
                    return { key: selected, provider: selected.provider };
                }
            }
        }
        return null;
    }

    setFallbackChain(strategy: string, chain: FallbackLink[]) {
        this.deps.routingPolicyService.setFallbackChain(strategy, chain);
    }

    setDowngradeChain(model: string, chain: string[]) {
        this.deps.routingPolicyService.setDowngradeChain(model, chain);
    }

    getRoutingPolicySurface(): RoutingPolicySnapshot {
        return this.deps.routingPolicyService.getSnapshot();
    }

    previewRoutingPolicy(input: RoutingPolicyPreviewInput): RoutingPolicyPreview {
        return this.deps.routingPolicyService.preview(input);
    }
}
