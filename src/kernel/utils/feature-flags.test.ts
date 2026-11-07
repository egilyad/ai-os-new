import { describe, it, expect } from 'vitest';
import { flattenFeatureFlags } from './feature-flags';
import type { FeatureFlagsConfigSection } from '../contracts/config-registry';

const SAMPLE: FeatureFlagsConfigSection = {
    memory: {
        enabled: true,
        semantic: false,
        ragOnChat: true,
        autoStore: false,
    },
    debate: {
        runtimeEngine: true,
        engineOnly: false,
    },
    ui: {
        experimentalVisuals: false,
    },
    mockServices: {
        enabled: true,
    },
};

describe('flattenFeatureFlags', () => {
    it('maps nested section into the dotted flat shape used by the UI', () => {
        const flat = flattenFeatureFlags(SAMPLE);
        expect(flat).toEqual({
            'memory.enabled': true,
            'memory.semantic': false,
            'memory.ragOnChat': true,
            'memory.autoStore': false,
            'debate.runtimeEngine': true,
            'debate.engineOnly': false,
            'ui.experimentalVisuals': false,
            'mockServices.enabled': true,
        });
    });

    it('returns a fresh object (no aliasing with the source section)', () => {
        const flat = flattenFeatureFlags(SAMPLE);
        flat['memory.enabled'] = false;
        expect(SAMPLE.memory.enabled).toBe(true);
    });
});
