export interface WorkflowStep {
    id: string;
    label: string;
    promptTemplate: string;
    provider: string;
    model: string;
    temperature?: number;
    maxOutputTokens?: number;
    /** Variable mapping: key = placeholder in prompt, value = path to previous step output.
     *  e.g. { "CODE": "steps.0.output", "CONTEXT": "steps.1.output" } */
    inputMapping?: Record<string, string>;
}

export interface Workflow {
    id: string;
    title: string;
    description: string;
    steps: WorkflowStep[];
    createdAt: number;
    updatedAt: number;
    usageCount: number;
    isBuiltIn: boolean;
    tags: string[];
}

export interface WorkflowStepResult {
    stepId: string;
    label: string;
    output: string;
    latency: number;
    tokens: number;
    error?: string;
    status: 'success' | 'error';
}

export interface WorkflowRun {
    id: string;
    workflowId: string;
    workflowTitle: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startedAt: number;
    completedAt?: number;
    stepResults: WorkflowStepResult[];
    currentStepIndex: number;
}

export const BUILT_IN_WORKFLOWS: Workflow[] = [
    {
        id: 'wf-code-review',
        title: 'Code Review Pipeline',
        description:
            'Analyze code for bugs, security issues, and best practices across 3 LLM passes',
        steps: [
            {
                id: 's1',
                label: 'Bug Analysis',
                promptTemplate:
                    'Review the following code for potential bugs and runtime errors:\n\n{{CODE}}',
                provider: 'groq',
                model: 'llama-3.1-8b-instant',
                temperature: 0.2,
                inputMapping: { CODE: 'input' },
            },
            {
                id: 's2',
                label: 'Security Audit',
                promptTemplate:
                    'Analyze this code for security vulnerabilities, injection risks, and data leaks:\n\n{{CODE}}\n\nPrevious bug analysis: {{STEP_0_OUTPUT}}',
                provider: 'groq',
                model: 'llama-3.1-8b-instant',
                temperature: 0.3,
                inputMapping: { CODE: 'input', STEP_0_OUTPUT: 'steps.0.output' },
            },
            {
                id: 's3',
                label: 'Best Practices',
                promptTemplate:
                    'Suggest improvements for code quality, performance, and maintainability:\n\n{{CODE}}\n\nBug report: {{STEP_0_OUTPUT}}\nSecurity: {{STEP_1_OUTPUT}}',
                provider: 'groq',
                model: 'llama-3.1-8b-instant',
                temperature: 0.4,
                inputMapping: {
                    CODE: 'input',
                    STEP_0_OUTPUT: 'steps.0.output',
                    STEP_1_OUTPUT: 'steps.1.output',
                },
            },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        isBuiltIn: true,
        tags: ['engineering', 'code-review', 'security'],
    },
    {
        id: 'wf-adr',
        title: 'Architecture Decision Record',
        description: 'Generate a comprehensive ADR with context, options, and rationale',
        steps: [
            {
                id: 's1',
                label: 'Context Analysis',
                promptTemplate:
                    'Analyze the following technical context and identify key architectural drivers:\n\n{{CONTEXT}}',
                provider: 'groq',
                model: 'llama-3.1-8b-instant',
                temperature: 0.5,
                inputMapping: { CONTEXT: 'input' },
            },
            {
                id: 's2',
                label: 'Option Generation',
                promptTemplate:
                    'Based on this analysis: {{STEP_0_OUTPUT}}\n\nGenerate 3-5 architectural options with pros/cons for each.',
                provider: 'groq',
                model: 'llama-3.1-8b-instant',
                temperature: 0.7,
                inputMapping: { CONTEXT: 'input', STEP_0_OUTPUT: 'steps.0.output' },
            },
            {
                id: 's3',
                label: 'Synthesis',
                promptTemplate:
                    'Synthesize a final Architecture Decision Record from:\n\nContext: {{CONTEXT}}\nAnalysis: {{STEP_0_OUTPUT}}\nOptions: {{STEP_1_OUTPUT}}\n\nFormat: Title, Status, Context, Decision, Consequences.',
                provider: 'groq',
                model: 'llama-3.1-8b-instant',
                temperature: 0.3,
                inputMapping: {
                    CONTEXT: 'input',
                    STEP_0_OUTPUT: 'steps.0.output',
                    STEP_1_OUTPUT: 'steps.1.output',
                },
            },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0,
        isBuiltIn: true,
        tags: ['engineering', 'architecture', 'documentation'],
    },
];
