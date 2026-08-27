import type { MemoryEntry } from '../../types/memory-types';

export interface QualityGateInput {
    content: string;
    metadata: {
        importance?: number;
        source?: string;
        finishReason?: string;
        status?: string;
    };
}

const ERROR_PATTERNS = [
    /^i'?m sorry/i,
    /^sorry[,.]/i,
    /^error[:\s]/i,
    /^(an|the)\s+error/i,
    /^failed/i,
    /^unable to/i,
    /^could not/i,
    /^there was an error/i,
    /^something went wrong/i,
    /^internal server error/i,
    /^rate limit/i,
    /^too many requests/i,
    /^quota exceeded/i,
    /^insufficient/i,
    /^we encountered/i,
];

/**
 * D-04: reject error-status / error-finishReason entries and low-value content.
 */
export function passesMemoryQualityGate(entry: QualityGateInput): boolean {
    const content = entry.content?.trim();
    if (!content || content.length < 5) return false;

    if (entry.metadata.status === 'error' || entry.metadata.status === 'timeout') return false;
    const errorFinishReasons = ['SAFETY', 'RECITATION', 'OTHER'];
    if (entry.metadata.finishReason && errorFinishReasons.includes(entry.metadata.finishReason))
        return false;

    const importance = entry.metadata.importance ?? 0;
    if (entry.metadata.source === 'system' && importance < 0.3) return false;

    if (ERROR_PATTERNS.some((p) => p.test(content))) return false;

    return true;
}

/** Convenience type guard for full MemoryEntry shape. */
export function isQualityEntry(entry: MemoryEntry): boolean {
    return passesMemoryQualityGate(entry);
}
