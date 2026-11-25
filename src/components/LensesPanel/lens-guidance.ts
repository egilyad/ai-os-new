import { lensEngine } from '../../kernel/instances';
import { compileLensStack } from '../../kernel/utils/lens-compiler';

/**
 * Build a human-readable "apply these lenses" block from the same compiled
 * stack the orchestrator uses — no second, simplified lens implementation.
 */
export function buildLensGuidance(lensIds: string[]): string {
    if (!lensIds || lensIds.length === 0) return '';
    try {
        if (!lensEngine || typeof lensEngine.getLens !== 'function') return '';
        const compiled = compileLensStack(
            lensIds,
            (id) => lensEngine.getLens(id),
            (ids) => lensEngine.validateStack(ids),
        );
        const lines = ['### Активные линзы анализа', ...compiled.system, ...compiled.outputRules];
        if (compiled.dropped.length) {
            lines.push(`Неизвестные линзы пропущены: ${compiled.dropped.join(', ')}`);
        }
        if (compiled.errors.length) {
            lines.push(`Конфликты стека: ${compiled.errors.join('; ')}`);
        }
        if (lines.length <= 1) return '';
        lines.push('Примени эти перспективы при формировании ответа.');
        return lines.join('\n');
    } catch {
        return '';
    }
}
