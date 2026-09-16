/**
 * Phase 34 — Rival parity 2 (Roadmap Phase G, §RIVALS2_COMPARE.md).
 *
 * Registers:
 *   - `reactService` (LangChain-style ReAct loop)
 *   - `loaderService` (document loaders + splitter)
 *   - `ragService` (LlamaIndex-style retrieve→synthesize→critique→refine)
 *   - `runtimeService` (OpenHands-style action stream + micro-agents)
 *   - `sweService` (SWE-agent-style ACI over the workspace)
 *   - `aiderService` (Aider-style repo-map + edits + commit messages)
 *   - `modesService` (Roo-style modes in DAL kv + toolkit gating)
 *   - `scopedMemService` (Mem0-style scoped memory, `scopedMem` table)
 *   - `integrationsService` (Composio-style catalog + kv connections)
 *   - `characterService` (Eliza-style character import + clients)
 *
 * Additive — ToolRunner, KnowledgeService, WorkspaceService, Gateway,
 * Persona stack untouched (used as delegates).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';import type { IToolRunnerService, IKnowledgeService } from '../contracts/parity';
import type { IPersonaService } from '../contracts/persona';
import type { IWorkspaceService } from '../contracts/workspace';
import type { ISandboxBrokerService } from '../contracts/ops';
import type { IGatewayService } from '../contracts/interop';
import type { IRunQueueService } from '../contracts/rivals';
import { ReactService } from '../services/rivals2/react-service';
import { LoaderService } from '../services/rivals2/loader-service';
import { RagService } from '../services/rivals2/rag-service';
import { RuntimeService } from '../services/rivals2/runtime-service';
import { SweService } from '../services/rivals2/swe-service';
import { AiderService } from '../services/rivals2/aider-service';
import { ModesService } from '../services/rivals2/modes-service';
import { ScopedMemService } from '../services/rivals2/scopedmem-service';
import { IntegrationsService } from '../services/rivals2/integrations-service';
import { CharacterService } from '../services/rivals2/character-service';
import type { RivalRepository } from '../dal/rival-repository';

function llmOf(c: IContainer): ILLMClientService | undefined {
    return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined;
}

export const registerPhase34: Phase = ({ register }) => {
    register('reactService', (c: IContainer) => {
        return new ReactService(
            c.get<IEventBus>('eventBus'),
            llmOf(c),
            c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined,
        );
    });

    register('loaderService', (c: IContainer) => {
        return new LoaderService(
            c.has('workspaceService') ? c.get<IWorkspaceService>('workspaceService') : undefined,
            llmOf(c),
        );
    });

    register('ragService', (c: IContainer) => {
        return new RagService(
            c.get<IEventBus>('eventBus'),
            c.has('knowledgeService') ? c.get<IKnowledgeService>('knowledgeService') : undefined,
            llmOf(c),
        );
    });

    register('runtimeService', (c: IContainer) => {
        return new RuntimeService(
            c.get<RivalRepository>('rivalRepository'),
            c.get<IEventBus>('eventBus'),
            c.has('sandboxBrokerService')
                ? c.get<ISandboxBrokerService>('sandboxBrokerService')
                : undefined,
        );
    });

    register('sweService', (c: IContainer) => {
        return new SweService(
            c.get<IEventBus>('eventBus'),
            c.has('workspaceService') ? c.get<IWorkspaceService>('workspaceService') : undefined,
            c.has('sandboxBrokerService')
                ? c.get<ISandboxBrokerService>('sandboxBrokerService')
                : undefined,
        );
    });

    register('aiderService', (c: IContainer) => {
        return new AiderService(
            c.has('workspaceService') ? c.get<IWorkspaceService>('workspaceService') : undefined,
            llmOf(c),
        );
    });

    register('modesService', (c: IContainer) => {
        return new ModesService(
            c.get<DataAccessLayer>('dal'),
            c.get<IEventBus>('eventBus'),
            c.has('runQueueService') ? c.get<IRunQueueService>('runQueueService') : undefined,
        );
    });

    register('scopedMemService', (c: IContainer) => {
        return new ScopedMemService(
            c.get<DatabaseService>('database'),
            c.get<IEventBus>('eventBus'),
        );
    });

    register('integrationsService', (c: IContainer) => {
        return new IntegrationsService(
            c.get<DataAccessLayer>('dal'),
            c.get<IEventBus>('eventBus'),
            c.has('gatewayService') ? c.get<IGatewayService>('gatewayService') : undefined,
        );
    });

    register('characterService', (c: IContainer) => {
        return new CharacterService(
            c.get<DataAccessLayer>('dal'),
            c.get<IEventBus>('eventBus'),
            c.get<IPersonaService>('personaService'),
            c.has('gatewayService') ? c.get<IGatewayService>('gatewayService') : undefined,
        );
    });
};
