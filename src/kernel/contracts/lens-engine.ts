import type { ILifecycle } from './lifecycle';
import type { Lens, LensContext, LensSuggestion, LensCategory } from '../types/lens-types';

export interface ApplyLensInput {
    context: LensContext;
    lensIds: string[];
}

export interface TransformedContext {
    context: LensContext;
    appliedLensIds: string[];
    outputTransform?: (output: string) => string;
    rubric?: ScoringRubricOut;
}

export interface ScoringRubricOut {
    dimensions: string[];
    maxScore: number;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    resolvedOrder: string[];
}

export interface ILensEngineService extends ILifecycle {
    applyStack(input: ApplyLensInput): TransformedContext;
    validateStack(lensIds: string[]): ValidationResult;
    suggestLenses(context: LensContext, role: RoleLensContext): LensSuggestion[];
    listLenses(category?: LensCategory): Lens[];
    getLens(id: string): Lens | undefined;
    addLens(lens: Lens): void;
}

export interface RoleLensContext {
    id: string;
    name: string;
    systemPrompt: string;
    category: string;
    metadata?: {
        tags?: string[];
        complexity?: number;
    };
}
