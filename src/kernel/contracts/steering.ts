/** A steering hint injected into an in-flight reply. */
export interface SteeringHint {
    id: string;
    text: string;
    priority: 'low' | 'normal' | 'high';
    createdAt: number;
    consumed?: boolean;
}

/** Inject guidance into a running agent reply (AgentScope HintBlock E2). */
export interface ISteeringService {
    push(hint: Omit<SteeringHint, 'id' | 'createdAt'>): SteeringHint;
    /** Collect pending hints as a single prompt block, marking them consumed. */
    drain(max?: number): string | null;
    pending(): SteeringHint[];
    clear(): void;
}
