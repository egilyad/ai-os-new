import { CONFIG } from '../config-registry';
import type { FreeTierLimit } from './key-types';

const DEFAULT_FREE_TIER_LIMITS: Record<string, FreeTierLimit> = {
    ...CONFIG.keys.freeTierLimits,
    Together: { requestsPerDay: 0, tokensPerDay: 0 },
};

export const FREE_TIER_LIMITS = DEFAULT_FREE_TIER_LIMITS;

export const STORAGE_KEY = 'super_agents_api_keys';
