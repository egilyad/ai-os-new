/**
 * Phase 35 — Rival parity 3 (Roadmap Phase H, §RIVALS3_COMPARE.md).
 *
 * Registers (no Dexie changes — everything on DAL kv + existing tables):
 *   - `reasoningService` (Agno-style think blocks)
 *   - `sessionStateService` (ADK-style scopes + parallel/loop runners)
 *   - `datasetService` (Dify-style datasets + annotations)
 *   - `flowApiService` (Langflow-style token → graph invokes)
 *   - `docStoreService` (Flowise-style stores + feedback)
 *   - `typedAgentService` (PydanticAI-style deps + zod validation)
 *   - `codePlanService` (TaskWeaver-style plugin-call plans)
 *   - `dialogueService` (Rasa-style intents/slots/stories)
 *   - `botRouterService` (Botpress-style autonomous routing + analytics)
 *   - `prototypeService` (Voiceflow-style CMS + funnels + export)
 *
 * Additive — ToolRunner, KnowledgeService, Gateway, Persona, Graph untouched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IKnowledgeService, IToolRunnerService } from '../contracts/parity';
import type { IGraphService } from '../contracts/graph';
import type { IRagService } from '../contracts/rivals2';
import { ReasoningService } from '../services/rivals3/reasoning-service';
import { SessionStateService } from '../services/rivals3/session-state-service';
import { DatasetService } from '../services/rivals3/dataset-service';
import { FlowApiService } from '../services/rivals3/flowapi-service';
import { DocStoreService } from '../services/rivals3/docstore-service';
import { TypedAgentService } from '../services/rivals3/typedagent-service';
import { CodePlanService } from '../services/rivals3/codeplan-service';
import { DialogueService } from '../services/rivals3/dialogue-service';
import { BotRouterService } from '../services/rivals3/botrouter-service';
import { PrototypeService } from '../services/rivals3/prototype-service';

function llmOf(c: IContainer): ILLMClientService | undefined {
    return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined;
}

function dalOf(c: IContainer): DataAccessLayer {
    return c.get<DataAccessLayer>('dal');
}

function eventsOf(c: IContainer): IEventBus {
    return c.get<IEventBus>('eventBus');
}

export const registerPhase35: Phase = ({ register }) => {
    register('reasoningService', (c: IContainer) => {
        return new ReasoningService(eventsOf(c), llmOf(c));
    });

    register('sessionStateService', (c: IContainer) => {
        return new SessionStateService(dalOf(c), eventsOf(c), llmOf(c));
    });

    register('datasetService', (c: IContainer) => {
        return new DatasetService(
            dalOf(c),
            eventsOf(c),
            c.has('knowledgeService') ? c.get<IKnowledgeService>('knowledgeService') : undefined,
        );
    });

    register('flowApiService', (c: IContainer) => {
        return new FlowApiService(dalOf(c), c.get<IGraphService>('graphService'));
    });

    register('docStoreService', (c: IContainer) => {
        return new DocStoreService(
            dalOf(c),
            eventsOf(c),
            c.has('knowledgeService') ? c.get<IKnowledgeService>('knowledgeService') : undefined,
        );
    });

    register('typedAgentService', (c: IContainer) => {
        return new TypedAgentService(eventsOf(c), llmOf(c));
    });

    register('codePlanService', (c: IContainer) => {
        return new CodePlanService(
            eventsOf(c),
            llmOf(c),
            c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined,
        );
    });

    register('dialogueService', (c: IContainer) => {
        return new DialogueService(dalOf(c), eventsOf(c));
    });

    register('botRouterService', (c: IContainer) => {
        return new BotRouterService(
            dalOf(c),
            eventsOf(c),
            llmOf(c),
            c.has('ragService') ? c.get<IRagService>('ragService') : undefined,
        );
    });

    register('prototypeService', (c: IContainer) => {
        return new PrototypeService(dalOf(c));
    });
};
