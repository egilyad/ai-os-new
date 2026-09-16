/**
 * Phase 66 — Projects + Workspace + Agent Runtime + Website Preview + QA (roadmapp.md §P1–§P5).
 *
 * Generic path only: no debate/forum/invocation dependency.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DatabaseService } from '../services/database-service';
import type { IEventBus } from '../types/interfaces';
import { ProjectRepository } from '../dal/project-repository';
import { ProjectService } from '../services/project-service';
import { ProjectWorkspaceService } from '../services/project-workspace-service';
import { AgentProjectRuntime } from '../services/agent-project-runtime';
import { WebsitePreviewService } from '../services/website-preview-service';
import { BrowserInspectorService } from '../services/browser-inspector-service';
import { MultiAgentProjectService } from '../services/multi-agent-project-service';
import { PythonRunnerService } from '../services/python-runner-service';
import { ProjectObservabilityService } from '../services/project-observability-service';
import { ProjectMemoryService } from '../services/project-memory-service';
import { ApprovalService } from '../services/approval-service';
import { ArtifactService } from '../services/artifact-service';
import { ProjectTemplateService } from '../services/project-template-service';
import { ProjectDebateIntegration } from '../services/project-debate-integration';
import { AutonomyOrchestrator } from '../services/autonomy-orchestrator';
import { AutonomyRunner } from '../services/autonomy-runner';
import { ProjectInvocationBridge } from '../services/project-invocation-bridge';

export const registerPhase66: Phase = ({ register }) => {
    register('projectRepository', (c: IContainer) => {
        return new ProjectRepository(c.get<DatabaseService>('database'));
    });

    register('projectManagerService', (c: IContainer) => {
        return new ProjectService(
            c.get<ProjectRepository>('projectRepository'),
            c.get<IEventBus>('eventBus'),
        );
    });

    register('projectWorkspaceService', (c: IContainer) => {
        return new ProjectWorkspaceService(
            c.get<DatabaseService>('database'),
            c.get<IEventBus>('eventBus'),
        );
    });

    register('agentProjectRuntime', (c: IContainer) => {
        return new AgentProjectRuntime(
            c.get('projectManagerService'),
            c.get('projectWorkspaceService'),
            c.has('toolRunnerService') ? c.get('toolRunnerService') : { runWithTools: async () => ({ output: 'stub' }) },
            c.get<IEventBus>('eventBus'),
        );
    });

    register('websitePreviewService', (c: IContainer) => {
        return new WebsitePreviewService(
            c.get('projectWorkspaceService'),
        );
    });

    register('browserInspectorService', (c: IContainer) => {
        return new BrowserInspectorService(
            c.get('projectWorkspaceService'),
        );
    });

    register('multiAgentProjectService', (c: IContainer) => {
        return new MultiAgentProjectService(
            c.get('projectManagerService'),
            c.get<IEventBus>('eventBus'),
        );
    });

    register('pythonRunnerService', (c: IContainer) => {
        return new PythonRunnerService(
            c.get('projectWorkspaceService'),
        );
    });

    register('projectObservabilityService', (c: IContainer) => {
        return new ProjectObservabilityService(
            c.get<IEventBus>('eventBus'),
        );
    });

    register('projectMemoryService', () => {
        return new ProjectMemoryService();
    });

    register('approvalService', () => {
        return new ApprovalService();
    });

    register('artifactService', (c: IContainer) => {
        return new ArtifactService(c.get('projectWorkspaceService'));
    });

    register('projectTemplateService', (c: IContainer) => {
        return new ProjectTemplateService(c.get('projectWorkspaceService'));
    });

    register('projectDebateIntegration', () => {
        return new ProjectDebateIntegration();
    });

    register('autonomyOrchestrator', (c: IContainer) => {
        return new AutonomyOrchestrator(
            c.get('projectManagerService'),
            c.get('projectWorkspaceService'),
        );
    });

    register('autonomyRunner', (c: IContainer) => {
        return new AutonomyRunner(
            c.get('autonomyOrchestrator'),
            c.get('agentProjectRuntime'),
            c.get('projectWorkspaceService'),
            c.get<IEventBus>('eventBus'),
        );
    });

    register('projectInvocationBridge', (c: IContainer) => {
        return new ProjectInvocationBridge(
            c.get('projectManagerService'),
            c.get('projectWorkspaceService'),
            c.get('projectObservabilityService'),
        );
    });
};
