import type {
    ILensEngineService,
    ApplyLensInput,
    TransformedContext,
    ValidationResult,
    RoleLensContext,
} from '../../contracts/lens-engine';
import type {
    Lens,
    LensContext,
    LensSuggestion,
    LensCategory,
    LensTransform,
} from '../../types/lens-types';
import { LENS_LIBRARY } from './lens-library';

/**
 * Lens Engine — applies composable cognitive lenses (perspectives) over
 * a role's system prompt / context.
 *
 * Pipeline:
 *   1. role.systemPrompt
 *   2. for each lens in stack: prompt-prefix → context-filter → perspective-inject
 *   3. → LLM call
 *   4. for each lens in stack (reverse): output-transform / scoring-rubric
 *   5. → final output
 */
export class LensEngineService implements ILensEngineService {
    private readonly lenses = new Map<string, Lens>();

    constructor(initialLenses: Lens[] = LENS_LIBRARY) {
        for (const lens of initialLenses) this.lenses.set(lens.id, lens);
    }

    async init(): Promise<void> {
        /* no-op — lenses are static presets + runtime additions */
    }

    async destroy(): Promise<void> {
        /* no-op */
    }

    listLenses(category?: LensCategory): Lens[] {
        const all = [...this.lenses.values()];
        return category ? all.filter((l) => l.category === category) : all;
    }

    getLens(id: string): Lens | undefined {
        return this.lenses.get(id);
    }

    addLens(lens: Lens): void {
        this.lenses.set(lens.id, lens);
    }

    validateStack(lensIds: string[]): ValidationResult {
        const errors: string[] = [];
        const ids = [...new Set(lensIds)];
        const resolvedOrder: string[] = [];

        for (const id of ids) {
            const lens = this.lenses.get(id);
            if (!lens) {
                errors.push(`Unknown lens: ${id}`);
                continue;
            }
            resolvedOrder.push(id);
        }

        for (const id of ids) {
            const lens = this.lenses.get(id);
            if (!lens) continue;
            if (!lens.compositionRules.stackable && ids.length > 1) {
                errors.push(`Lens ${id} is not stackable`);
            }
            const others = ids.filter((x) => x !== id);
            for (const otherId of others) {
                const other = this.lenses.get(otherId);
                if (!other) continue;
                const allowed =
                    lens.compositionRules.allowedWith === '*' ||
                    lens.compositionRules.allowedWith.includes(otherId);
                if (!allowed) {
                    errors.push(`Lens ${id} is not allowed with ${otherId}`);
                }
                if (lens.conflictWith.includes(otherId)) {
                    errors.push(`Lens ${id} conflicts with ${otherId}`);
                }
            }
        }

        if (ids.length > 5) errors.push('Max stack size is 5');

        const sorted = [...resolvedOrder].sort((a, b) => {
            const la = this.lenses.get(a);
            const lb = this.lenses.get(b);
            return (lb?.priority ?? 0) - (la?.priority ?? 0);
        });

        return { valid: errors.length === 0, errors, resolvedOrder: sorted };
    }

    applyStack(input: ApplyLensInput): TransformedContext {
        const { lensIds } = input;
        const context = { ...input.context };

        // Resolve conflict-free, priority-sorted order
        const validation = this.validateStack(lensIds);
        const order = validation.valid
            ? validation.resolvedOrder
            : lensIds.filter((id) => this.lenses.has(id));

        let outputTransform: ((output: string) => string) | undefined;
        let rubric: { dimensions: string[]; maxScore: number } | undefined;

        for (const id of order) {
            const lens = this.lenses.get(id);
            if (!lens) continue;
            this.applyTransform(lens.transform, context);
            if (lens.transform.kind === 'scoring-rubric') {
                rubric = lens.transform.rubric;
            }
        }

        // Reverse pass for output transforms
        const transforms: LensTransform[] = [];
        for (const id of order) {
            const lens = this.lenses.get(id);
            if (lens) transforms.push(lens.transform);
        }
        const outputTransforms = transforms
            .filter(
                (t): t is Extract<LensTransform, { kind: 'output-transform' }> =>
                    t.kind === 'output-transform',
            )
            .reverse();
        if (outputTransforms.length > 0) {
            outputTransform = (output: string) => {
                let result = output;
                for (const t of outputTransforms) result = t.fn(result, context);
                return result;
            };
        }

        return {
            context,
            appliedLensIds: order,
            outputTransform,
            rubric,
        };
    }

    suggestLenses(_context: LensContext, role: RoleLensContext): LensSuggestion[] {
        const tags = role.metadata?.tags ?? [];
        const suggestions: LensSuggestion[] = [];
        const roleText = `${role.name} ${role.systemPrompt} ${tags.join(' ')}`.toLowerCase();

        for (const lens of this.lenses.values()) {
            if (!lens.isBuiltin) continue;
            let confidence = 0.2;
            const rationale: string[] = [];

            // Domain match
            if (lens.applicability.domains.includes('*')) confidence += 0.1;
            else if (lens.applicability.domains.some((d) => roleText.includes(d)))
                confidence += 0.2;

            // Tag match
            for (const t of lens.metadata.tags) {
                if (roleText.includes(t)) {
                    confidence += 0.1;
                    rationale.push(`тег "${t}" пересекается с ролью`);
                }
            }

            if (confidence > 0.3) {
                suggestions.push({
                    lensId: lens.id,
                    confidence: Math.min(0.95, confidence),
                    rationale: rationale.length > 0 ? rationale.join('; ') : 'базовая рекомендация',
                });
            }
        }

        return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    }

    private applyTransform(transform: LensTransform, context: LensContext): void {
        switch (transform.kind) {
            case 'prompt-prefix':
                context.userPrompt = `${transform.text}\n\n${context.userPrompt}`;
                break;
            case 'context-filter':
                context.conversationHistory = transform.predicate(context).conversationHistory;
                break;
            case 'perspective-inject':
                context.userPrompt = `${context.userPrompt}\n\nОцени через следующие вопросы:\n${transform.questions
                    .map((q) => `- ${q}`)
                    .join('\n')}`;
                break;
            case 'composite':
                for (const t of transform.transforms) this.applyTransform(t, context);
                break;
            case 'output-transform':
            case 'scoring-rubric':
                // Applied in reverse pass — handled by caller
                break;
            default:
                break;
        }
    }
}
