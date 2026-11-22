export type ModelClass = 'trivial' | 'reasoning' | 'code' | 'creative' | 'vision';

export interface ModelClassDecision {
    cls: ModelClass;
    model: string;
    reason: string;
    confidence: number;
}

/** Classify a request and choose a model class (AgentScope/OWL E4). */
export interface IModelClassRouterService {
    /** Pure heuristic classification — no LLM, no side effects. */
    classify(request: string): ModelClass;
    /** Choose a concrete model from configured per-class mappings. */
    route(request: string, models: Partial<Record<ModelClass, string>>): ModelClassDecision;
}
