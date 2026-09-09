/**
 * Phase 37 — Rival parity 5 (Roadmap Phase J, §RIVALS5_COMPARE.md).
 *
 * Registers (no Dexie changes — kv + existing tables only):
 *   - `appBuilderService` (clarify → scaffold → write → preview)
 *   - `ideService` (codebase Q&A + edit plans + terminal tickets)
 *   - `promptHubService` (versioned prompts + strict render)
 *   - `ontologyService` (typed objects + governed actions)
 *   - `aclService` (permissions-aware retrieval)
 *   - `workQueueService` (work items + robots + name-only assets)
 *   - `writerService` (terminology + claim citations)
 *   - `computerService` (ticket-gated computer-use pack)
 *   - `searchService` (provider fan-out + local fallback)
 *   - `codeExecService` (validated code tickets + external delegate)
 *
 * Additive — WorkspaceService, KnowledgeService, ToolRunner, Gateway,
 * Governance, Planner, Crew/Graph untouched (used as delegates).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IKnowledgeService, IToolRunnerService } from '../contracts/parity';
import type { IWorkspaceService } from '../contracts/workspace';
import type { ISandboxBrokerService } from '../contracts/ops';
import type { IGovernanceService } from '../contracts/trust';
import { AppBuilderService } from '../services/rivals5/appbuilder-service';
import { IdeService } from '../services/rivals5/ide-service';
import { PromptHubService } from '../services/rivals5/prompthub-service';
import { OntologyService } from '../services/rivals5/ontology-service';
import { AclService } from '../services/rivals5/acl-service';
import { WorkQueueService } from '../services/rivals5/workqueue-service';
import { WriterService } from '../services/rivals5/writer-service';
import { ComputerService } from '../services/rivals5/computer-service';
import { SearchService } from '../services/rivals5/search-service';
import { CodeExecService } from '../services/rivals5/codeexec-service';

function llmOf(c: IContainer): ILLMClientService | undefined {
    return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined;
}

function dalOf(c: IContainer): DataAccessLayer {
    return c.get<DataAccessLayer>('dal');
}

function eventsOf(c: IContainer): IEventBus {
    return c.get<IEventBus>('eventBus');
}

export const registerPhase37: Phase = ({ register }) => {
    register('appBuilderService', (c: IContainer) => {
        return new AppBuilderService(
            eventsOf(c),
            llmOf(c),
            c.has('workspaceService') ? c.get<IWorkspaceService>('workspaceService') : undefined,
        );
    });

    register('ideService', (c: IContainer) => {
        return new IdeService(
            llmOf(c),
            c.has('workspaceService') ? c.get<IWorkspaceService>('workspaceService') : undefined,
            c.has('sandboxBrokerService') ? c.get<ISandboxBrokerService>('sandboxBrokerService') : undefined,
        );
    });

    register('promptHubService', (c: IContainer) => {
        return new PromptHubService(dalOf(c));
    });

    register('ontologyService', (c: IContainer) => {
        return new OntologyService(
            dalOf(c),
            eventsOf(c),
            c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined,
            c.has('governanceService') ? c.get<IGovernanceService>('governanceService') : undefined,
        );
    });

    register('aclService', (c: IContainer) => {
        return new AclService(
            dalOf(c),
            c.has('knowledgeService') ? c.get<IKnowledgeService>('knowledgeService') : undefined,
            c.has('workspaceService') ? c.get<IWorkspaceService>('workspaceService') : undefined,
            c.has('governanceService') ? c.get<IGovernanceService>('governanceService') : undefined,
        );
    });

    register('workQueueService', (c: IContainer) => {
        return new WorkQueueService(dalOf(c), eventsOf(c));
    });

    register('writerService', (c: IContainer) => {
        return new WriterService(dalOf(c));
    });

    register('computerService', (c: IContainer) => {
        return new ComputerService(
            eventsOf(c),
            c.has('sandboxBrokerService') ? c.get<ISandboxBrokerService>('sandboxBrokerService') : undefined,
        );
    });

    register('searchService', (c: IContainer) => {
        return new SearchService(
            dalOf(c),
            eventsOf(c),
            c.has('knowledgeService') ? c.get<IKnowledgeService>('knowledgeService') : undefined,
        );
    });

    register('codeExecService', (c: IContainer) => {
        return new CodeExecService(dalOf(c), eventsOf(c));
    });
};
