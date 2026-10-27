import { lensEngine } from '../../kernel/instances';
import type { Lens } from '../../kernel/types/lens-types';

/**
 * Resolve lens order by priority (descending) — mirrors validateStack's
 * resolvedOrder so guidance reads in the same order the engine applies lenses.
 */
function resolveOrder(ids: string[]): string[] {
    const resolved: { id: string; priority: number }[] = [];
    for (const id of ids) {
        const lens = lensEngine.getLens(id);
        if (lens) resolved.push({ id, priority: lens.priority ?? 0 });
    }
    return resolved.sort((a, b) => b.priority - a.priority).map((x) => x.id);
}

function lensGuidancePart(lens: Lens): string | null {
    const t = lens.transform;
    if (t.kind === 'prompt-prefix' && t.text) {
        return `- ${lens.name}: ${t.text}`;
    }
    if (t.kind === 'perspective-inject' && t.questions.length) {
        return `- ${lens.name}: ${t.questions.join(' ')}`;
    }
    return null;
}

/**
 * Build a human-readable "apply these lenses" block for a set of lens ids.
 * Returns '' when there is nothing to apply (or the engine is unavailable).
 */
export function buildLensGuidance(lensIds: string[]): string {
    if (!lensIds || lensIds.length === 0) return '';
    try {
        if (!lensEngine || typeof lensEngine.getLens !== 'function') return '';
        const parts: string[] = [];
        for (const id of resolveOrder(lensIds)) {
            const lens = lensEngine.getLens(id);
            if (!lens) continue;
            const part = lensGuidancePart(lens);
            if (part) parts.push(part);
        }
        if (parts.length === 0) return '';
        return [
            '### Активные линзы анализа',
            ...parts,
            'Примени эти перспективы при формировании ответа.',
        ].join('\n');
    } catch {
        return '';
    }
}
