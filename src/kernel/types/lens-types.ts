/**
 * Lens domain types.
 *
 * A Lens is an orthogonal cognitive layer to a Role:
 * - Role answers "who speaks?" (persona with permissions)
 * - Lens answers "through what prism?" (perspective transform applied to
 *   context/output), composable into a stack.
 */

export type LensCategory =
    'analytical' | 'ethical' | 'temporal' | 'domain' | 'risk' | 'stakeholder';

export interface LensApplicability {
    taskTypes: string[];
    domains: string[];
    minConfidence?: number;
}

export type LensTransform =
    | { kind: 'prompt-prefix'; text: string }
    | { kind: 'context-filter'; predicate: (ctx: LensContext) => LensContext }
    | { kind: 'output-transform'; fn: (output: string, ctx: LensContext) => string }
    | { kind: 'perspective-inject'; questions: string[] }
    | { kind: 'scoring-rubric'; rubric: ScoringRubric }
    | { kind: 'composite'; transforms: LensTransform[] };

export interface LensContext {
    roleSystemPrompt: string;
    userPrompt: string;
    conversationHistory?: string[];
    meta?: Record<string, unknown>;
}

export interface ScoringRubric {
    dimensions: string[];
    maxScore: number;
}

export interface LensComposition {
    stackable: boolean;
    maxStackSize: number;
    orderMatters: boolean;
    allowedWith: string[] | '*';
}

export interface LensMetadata {
    version: number;
    author: string;
    tags: string[];
    maturity: 'draft' | 'stable' | 'deprecated';
}

export interface Lens {
    id: string;
    name: string;
    description: string;
    category: LensCategory;
    transform: LensTransform;
    applicability: LensApplicability;
    compositionRules: LensComposition;
    conflictWith: string[];
    priority: number;
    isBuiltin?: boolean;
    metadata: LensMetadata;
}

export interface LensStackEntry {
    lensId: string;
    appliedAt: number;
    appliedBy: 'human' | 'agent-self' | 'orchestrator';
    scope: 'session' | 'single-turn' | 'single-tool-call';
    reason?: string;
}

export interface LensSuggestion {
    lensId: string;
    confidence: number;
    rationale: string;
}
