/**
 * Debate integration contract (roadmapp.md §P13).
 */
import type { ProjectDebate, DebateTrigger, DebateVerdict } from '../types/debate-integration-types';

export interface IProjectDebateIntegration {
    startDebate(projectId: string, decision: string, trigger?: DebateTrigger): ProjectDebate;
    getDebate(debateId: string): ProjectDebate | undefined;
    getDebatesForProject(projectId: string): ProjectDebate[];
    submitVerdict(debateId: string, verdict: DebateVerdict): void;
    createTaskFromVerdict(debateId: string, taskId: string): void;
    failDebate(debateId: string, reason: string): void;
}
