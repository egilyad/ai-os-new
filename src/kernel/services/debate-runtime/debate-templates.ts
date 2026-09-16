import type { DebateStrategy } from '../../contracts/debate-types';

// Templates are defined inline for now; long-term they should live in a DB
// with per-row versioning to support migrations and rollback.
export const TEMPLATE_VERSION = 1;

export interface DebateTemplate {
    id: string;
    name: string;
    description: string;
    topic: string;
    strategy: DebateStrategy;
    maxRounds: number;
    debateTemperature: number;
    minAgents: number;
    version: number;
}

export const DEBATE_TEMPLATES: DebateTemplate[] = [
    {
        id: 'code-review',
        name: 'Code Review Debate',
        description:
            'Trade-offs between correctness, performance, and maintainability for a proposed change.',
        topic: 'Should we merge this change as-is, or require revisions before merge?',
        strategy: 'constrained',
        maxRounds: 4,
        debateTemperature: 0.35,
        minAgents: 3,
        version: TEMPLATE_VERSION,
    },
    {
        id: 'adr',
        name: 'ADR Debate',
        description: 'Architecture decision record — compare options with explicit criteria.',
        topic: 'Which architecture option best balances scalability, cost, and team velocity?',
        strategy: 'argument_tree',
        maxRounds: 5,
        debateTemperature: 0.4,
        minAgents: 4,
        version: TEMPLATE_VERSION,
    },
    {
        id: 'post-mortem',
        name: 'Post-Mortem',
        description: 'Blameless incident review — root cause vs contributing factors.',
        topic: 'What was the primary root cause of the incident, and what preventive actions matter most?',
        strategy: 'moderated',
        maxRounds: 4,
        debateTemperature: 0.5,
        minAgents: 3,
        version: TEMPLATE_VERSION,
    },
    {
        id: 'prompt-optimization',
        name: 'Prompt Optimization',
        description: 'Compare prompt variants for clarity, safety, and task success.',
        topic: 'Which prompt variant produces the most reliable and useful model behavior?',
        strategy: 'socratic',
        maxRounds: 3,
        debateTemperature: 0.55,
        minAgents: 3,
        version: TEMPLATE_VERSION,
    },
];

export function getDebateTemplate(id: string): DebateTemplate | undefined {
    return DEBATE_TEMPLATES.find((t) => t.id === id);
}
