import type { ApiKey } from '../types/metrics-types';

export const DEMO_KEY_ID = 'demo-mock-key';
export const DEMO_PROVIDER = 'mock';
export const DEMO_MODEL = 'mock-model-v1';

export function buildDemoKey(): Omit<ApiKey, 'id' | 'stats'> {
    return {
        provider: DEMO_PROVIDER,
        key: 'demo-no-key-required',
        label: 'Demo (local mock)',
        status: 'active',
        availableModels: [DEMO_MODEL],
    };
}

export function isDemoKey(key: Pick<ApiKey, 'id' | 'provider'>): boolean {
    return key.id === DEMO_KEY_ID || key.provider === DEMO_PROVIDER;
}
