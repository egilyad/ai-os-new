/**
 * ProjectDebateIntegration — connects project decisions to the Debate Engine (roadmapp.md §P13).
 *
 * Flow: Project Decision → Debate → Verdict → Task
 */
import type { ProjectDebate, DebateTrigger, DebateVerdict } from '../types/debate-integration-types';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ProjectDebateIntegration');

export interface IProjectDebateIntegration {
    startDebate(projectId: string, decision: string, trigger?: DebateTrigger): ProjectDebate;
    getDebate(debateId: string): ProjectDebate | undefined;
    getDebatesForProject(projectId: string): ProjectDebate[];
    submitVerdict(debateId: string, verdict: DebateVerdict): void;
    createTaskFromVerdict(debateId: string, taskId: string): void;
    failDebate(debateId: string, reason: string): void;
}

let debateCounter = 0;

export class ProjectDebateIntegration implements IProjectDebateIntegration {
    private debates = new Map<string, ProjectDebate>();

    startDebate(projectId: string, decision: string, trigger: DebateTrigger = 'manual'): ProjectDebate {
        const debate: ProjectDebate = {
            id: `pdeb-${Date.now()}-${++debateCounter}`,
            projectId,
            decision,
            trigger,
            status: 'debating',
            createdAt: Date.now(),
        };

        this.debates.set(debate.id, debate);
        LOGGER.info('startDebate', `Debate started for project ${projectId}: "${decision}" (${trigger})`);
        return debate;
    }

    getDebate(debateId: string): ProjectDebate | undefined {
        return this.debates.get(debateId);
    }

    getDebatesForProject(projectId: string): ProjectDebate[] {
        return Array.from(this.debates.values()).filter((d) => d.projectId === projectId);
    }

    submitVerdict(debateId: string, verdict: DebateVerdict): void {
        const debate = this.debates.get(debateId);
        if (!debate) throw new Error(`Debate not found: ${debateId}`);

        debate.verdict = verdict.recommendation;
        debate.verdictConfidence = verdict.confidence;
        debate.status = 'verdict';
        debate.completedAt = Date.now();

        LOGGER.info('submitVerdict', `Verdict for debate ${debateId}: confidence ${verdict.confidence}`);
    }

    createTaskFromVerdict(debateId: string, taskId: string): void {
        const debate = this.debates.get(debateId);
        if (!debate) throw new Error(`Debate not found: ${debateId}`);

        debate.createdTaskId = taskId;
        debate.status = 'task-created';
        debate.completedAt = Date.now();

        LOGGER.info('createTaskFromVerdict', `Task ${taskId} created from debate ${debateId}`);
    }

    failDebate(debateId: string, reason: string): void {
        const debate = this.debates.get(debateId);
        if (!debate) throw new Error(`Debate not found: ${debateId}`);

        debate.status = 'failed';
        debate.completedAt = Date.now();

        LOGGER.info('failDebate', `Debate ${debateId} failed: ${reason}`);
    }
}
