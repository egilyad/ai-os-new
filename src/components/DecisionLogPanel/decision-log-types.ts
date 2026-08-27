import { storageAdapter } from '../../kernel/instances';
import { safeJsonParse } from '../../kernel/utils/safe-json';

export const STORAGE_KEY = 'provider_decisions_v1';
export const MAX_DECISIONS = 500;

export interface ProviderDecisionEntry {
    id: string;
    timestamp: number;
    requestType: string;
    promptPreview: string;
    chosenProvider: string;
    chosenModel: string;
    chosenKeyId: string;
    reason: string;
    rejectedKeys: Array<{ provider: string; model: string; keyId: string; reason: string }>;
    latencyMs: number;
    estimatedCost: number;
    tokensEstimate: number;
    scoring: { reliability: number; latency: number; cost: number; ttft: number; tps: number };
    policyApplied: string[];
}

export function loadFromStorage(): ProviderDecisionEntry[] {
    try {
        const raw = storageAdapter.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = safeJsonParse(raw);
        return Array.isArray(parsed) ? (parsed as ProviderDecisionEntry[]) : [];
    } catch {
        return [];
    }
}
