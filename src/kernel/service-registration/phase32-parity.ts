/**
 * Phase 32 — Parity tools/knowledge/training (GAP E.2, E.3 adds training here).
 *
 * Registers:
 *   - `parityRepository` (DAL over `knowledgeSources` + `trainGuides`)
 *   - `toolRunnerService` (built-in tools + agentic loop; delegates:
 *     llmClientService, toolGovernanceService, workspaceService, mcpService,
 *     knowledgeService — each optional, service degrades gracefully)
 *   - `knowledgeService` (RAG over url/text sources)
 *
 * Additive — ToolExecutor / MCPService / WorkspaceService untouched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IToolGovernanceService } from '../contracts/ops';
import type { IWorkspaceService } from '../contracts/workspace';
import type { ICrewService } from '../contracts/crew';
import type { MCPService } from '../services/mcp-service';
import { ParityRepository } from '../dal/parity-repository';
import { ToolRunnerService } from '../services/parity/tool-runner-service';
import { KnowledgeService } from '../services/parity/knowledge-service';
import { TrainingService } from '../services/parity/training-service';
import { DefaultEmbeddingService } from '../services/parity/default-embedding-service';

export const registerPhase32: Phase = ({ register }) => {
    register('parityRepository', (c: IContainer) => {
        return new ParityRepository(c.get<DatabaseService>('database'));
    });

    register('knowledgeService', (c: IContainer) => {
        const svc = new KnowledgeService(
            c.get<ParityRepository>('parityRepository'),
            c.get<IEventBus>('eventBus'),
        );
        // 6.1 default embeddings (offline) — real provider can replace via setEmbedder
        svc.setEmbedder(new DefaultEmbeddingService());
        return svc;
    });

    register('toolRunnerService', (c: IContainer) => {
        const knowledge = c.has('knowledgeService')
            ? c.get<KnowledgeService>('knowledgeService')
            : undefined;
        return new ToolRunnerService({
            events: c.get<IEventBus>('eventBus'),
            llm: c.get<ILLMClientService>('llmClientService'),
            governance: c.has('toolGovernanceService')
                ? c.get<IToolGovernanceService>('toolGovernanceService')
                : undefined,
            workspace: c.has('workspaceService')
                ? c.get<IWorkspaceService>('workspaceService')
                : undefined,
            mcp: c.has('mcpService') ? c.get<MCPService>('mcpService') : undefined,
            knowledge,
        });
    });

    // GAP E.3 — crew training guides + replay/test (CrewAI train analogue).
    register('trainingService', (c: IContainer) => {
        return new TrainingService({
            repo: c.get<ParityRepository>('parityRepository'),
            events: c.get<IEventBus>('eventBus'),
            crewProvider: () => c.get<ICrewService>('crewService'),
        });
    });
};
