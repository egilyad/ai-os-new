import type { Lens, LensTransform } from '../types/lens-types';

export interface CompiledLensStack {
    order: string[];
    dropped: string[];
    errors: string[];
    system: string[];
    user: string[];
    outputRules: string[];
}

export interface LensValidation {
    valid: boolean;
    errors: string[];
    resolvedOrder: string[];
}

function describeTransform(lens: Lens, transform: LensTransform): string[] {
    switch (transform.kind) {
        case 'prompt-prefix':
            return [`- ${lens.name}: ${transform.text}`];
        case 'perspective-inject':
            return transform.questions.length
                ? [`- ${lens.name}: ${transform.questions.join(' ')}`]
                : [];
        case 'scoring-rubric':
            return [
                `- ${lens.name}: оцени по ${transform.rubric.dimensions.join(', ')} (макс. ${transform.rubric.maxScore})`,
            ];
        case 'context-filter':
            return [`- ${lens.name}: отфильтруй контекст по правилу линзы`];
        case 'output-transform':
            return [`- ${lens.name}: примени трансформацию к итоговому ответу`];
        case 'composite':
            return transform.transforms.flatMap((nested) => describeTransform(lens, nested));
        default:
            return [];
    }
}

export function compileLensStack(
    lensIds: string[],
    getLens: (id: string) => Lens | undefined,
    validate: (ids: string[]) => LensValidation,
): CompiledLensStack {
    const validation = validate(lensIds);
    const order = validation.resolvedOrder;
    const dropped = lensIds.filter((id) => !getLens(id));
    const result: CompiledLensStack = {
        order,
        dropped,
        errors: validation.errors,
        system: [],
        user: [],
        outputRules: [],
    };
    for (const id of order) {
        const lens = getLens(id);
        if (!lens) continue;
        const parts = describeTransform(lens, lens.transform);
        if (
            lens.transform.kind === 'output-transform' ||
            lens.transform.kind === 'scoring-rubric'
        ) {
            result.outputRules.push(...parts);
        } else {
            result.system.push(...parts);
        }
    }
    return result;
}
