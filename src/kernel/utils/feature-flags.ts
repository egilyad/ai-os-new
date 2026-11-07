import type { FeatureFlagsConfigSection } from '../contracts/config-registry';

/**
 * W6-018: typed flattening of the feature-flags config section.
 *
 * The UI historically read flags via a flattened `Record<string, boolean>`
 * (e.g. `featureFlags['memory.enabled']`) obtained through an unsafe
 * `as unknown as Record<string, boolean>` cast. This helper enumerates every
 * known flag explicitly so the flattening is type-checked and the cast is
 * no longer needed.
 */
export type FlatFeatureFlags = Record<string, boolean>;

export function flattenFeatureFlags(ff: FeatureFlagsConfigSection): FlatFeatureFlags {
    return {
        'memory.enabled': ff.memory.enabled,
        'memory.semantic': ff.memory.semantic,
        'memory.ragOnChat': ff.memory.ragOnChat,
        'memory.autoStore': ff.memory.autoStore,
        'debate.runtimeEngine': ff.debate.runtimeEngine,
        'debate.engineOnly': ff.debate.engineOnly,
        'ui.experimentalVisuals': ff.ui.experimentalVisuals,
        'mockServices.enabled': ff.mockServices.enabled,
    };
}
