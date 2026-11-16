import type { ParticipantConfig } from '../../contracts/debate-runtime';
import { RESEARCH_ROLE_PROMPTS } from './research-brief-format';

/**
 * Пресетная «команда» для Research Brief-дебатов.
 * Роли: Analyst (факты), Researcher (проверка источников),
 * Structured Writer (финальный формат), Devil's Advocate (логическая проверка).
 */
export function buildResearchBriefTeam(_topic: string): ParticipantConfig[] {
    const base = {
        agentId: 'assistant',
        nodeId: '',
    };
    return [
        {
            ...base,
            nodeId: 'analyst',
            role: 'analyst',
            systemPrompt: RESEARCH_ROLE_PROMPTS['analyst'],
        },
        {
            ...base,
            nodeId: 'researcher',
            role: 'researcher',
            systemPrompt: RESEARCH_ROLE_PROMPTS['researcher'],
        },
        {
            ...base,
            nodeId: 'structured-writer',
            role: 'structuredWriter',
            systemPrompt: RESEARCH_ROLE_PROMPTS['structuredWriter'],
        },
        {
            ...base,
            nodeId: 'devil-advocate',
            role: 'devilAdvocate',
            systemPrompt: RESEARCH_ROLE_PROMPTS['devilAdvocate'],
        },
    ];
}

export const RESEARCH_BRIEF_TOPOLOGY_ID = 'research-brief-team';

export const RESEARCH_BRIEF_STRATEGY = 'round_robin';
