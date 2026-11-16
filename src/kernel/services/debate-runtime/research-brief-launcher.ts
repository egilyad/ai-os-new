import type { DebateTopology } from '../../contracts/debate-runtime';
import type { ParticipantConfig } from '../../contracts/debate-runtime';
import { buildResearchBriefTeam } from './research-brief-team';

/**
 * Запуск «Research Brief»-дебата: строит команду (Analyst, Researcher,
 * Structured Writer, Devil's Advocate) и топологию. Используется там, где
 * создаётся сессия дебата (например, из команды/API).
 */
export function createResearchBriefDebate(
    _topic: string,
    _language = 'ru',
): { topology: DebateTopology; participants: ParticipantConfig[]; strategy: string } {
    const participants = buildResearchBriefTeam(_topic);

    const topology: DebateTopology = {
        id: 'research-brief-team',
        type: 'linear',
        nodes: participants.map((p) => ({
            id: p.nodeId,
            label: p.role ?? p.nodeId,
            role: (p.role as 'analyst' | 'researcher' | 'structuredWriter' | 'devilAdvocate') ??
                'neutral',
        })),
        edges: participants.slice(1).map((p, i) => ({
            from: participants[i]!.nodeId,
            to: p.nodeId,
            type: 'sequential',
        })),
        maxRounds: 3,
    };

    return { topology, participants, strategy: 'round_robin' };
}
