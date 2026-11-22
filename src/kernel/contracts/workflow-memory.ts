export interface WorkflowTemplate {
    id: string;
    goalPattern: string;
    steps: string[];
    uses: number;
    createdAt: number;
}

/** Reusable task-decomposition memory (CAMEL WorkflowMemoryManager H3). */
export interface IWorkflowMemoryService {
    remember(goal: string, steps: string[]): WorkflowTemplate;
    /** Find a reusable plan by token overlap with a new goal. */
    recall(goal: string): WorkflowTemplate | null;
    list(): WorkflowTemplate[];
}
