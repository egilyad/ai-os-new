/**
 * Phase 36 — Rival parity 4 (Roadmap Phase I, §RIVALS4_COMPARE.md).
 *
 * Registers (no Dexie changes — kv + existing tables only):
 *   - `copilotService` (topics/entities/variables/generative answers)
 *   - `bedrockService` (action groups + KB profiles + guardrails + trace)
 *   - `cxfService` (CX flows/pages/routes/parameters/fulfillment)
 *   - `agentforceService` (topics + reasoning transcript + trust check)
 *   - `entityService` (list/pattern/datetime extractors, stateless)
 *   - `koreService` (dialog tasks with interruption)
 *   - `campaignService` (outbound broadcasts via gateway)
 *   - `employeeService` (AI employees + trigger runs + inbox)
 *   - `codeAgentService` (code-as-action mini-DSL over ToolRunner)
 *   - `assistantService` (persona + dataset + toolkit bundles)
 *   - `gumService` (forms + for-each + vault refs)
 *
 * Additive — DialogueService, RagService, ToolRunner, Gateway, Persona,
 * Governance, Planner, Crew/Graph untouched (used as delegates).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IKnowledgeService, IToolRunnerService } from '../contracts/parity';
import type { IRagService } from '../contracts/rivals2';
import type { IReasoningService } from '../contracts/rivals3';
import type { IGovernanceService } from '../contracts/trust';
import type { IGatewayService } from '../contracts/interop';
import type { IDialogueService, IPlannerService, IRunQueueService } from '../contracts/rivals';
import type { IDatasetService } from '../contracts/rivals3';
import type { IMobileAccessService } from '../contracts/ops';
import type { IPersonaService } from '../contracts/persona';
import type { ICrewService } from '../contracts/crew';
import type { IGraphService } from '../contracts/graph';
import type { LoaderService } from '../services/rivals2/loader-service';
import { CopilotService } from '../services/rivals4/copilot-service';
import { BedrockService } from '../services/rivals4/bedrock-service';
import { CxfService } from '../services/rivals4/cxf-service';
import { AgentforceService } from '../services/rivals4/agentforce-service';
import { EntityService } from '../services/rivals4/entity-service';
import { KoreService } from '../services/rivals4/kore-service';
import { CampaignService } from '../services/rivals4/campaign-service';
import { EmployeeService } from '../services/rivals4/employee-service';
import { CodeAgentService } from '../services/rivals4/codeagent-service';
import { AssistantService } from '../services/rivals4/assistant-service';
import { GumService } from '../services/rivals4/gum-service';

function llmOf(c: IContainer): ILLMClientService | undefined {
    return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined;
}

function dalOf(c: IContainer): DataAccessLayer {
    return c.get<DataAccessLayer>('dal');
}

function eventsOf(c: IContainer): IEventBus {
    return c.get<IEventBus>('eventBus');
}

export const registerPhase36: Phase = ({ register }) => {
    register('copilotService', (c: IContainer) => {
        return new CopilotService(
            dalOf(c),
            eventsOf(c),
            c.has('ragService') ? c.get<IRagService>('ragService') : undefined,
        );
    });

    register('bedrockService', (c: IContainer) => {
        return new BedrockService(
            dalOf(c),
            eventsOf(c),
            c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined,
            c.has('knowledgeService') ? c.get<IKnowledgeService>('knowledgeService') : undefined,
            c.has('loaderService') ? c.get<LoaderService>('loaderService') : undefined,
        );
    });

    register('cxfService', (c: IContainer) => {
        return new CxfService(
            dalOf(c),
            eventsOf(c),
            c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined,
        );
    });

    register('agentforceService', (c: IContainer) => {
        return new AgentforceService(
            dalOf(c),
            eventsOf(c),
            c.has('reasoningService') ? c.get<IReasoningService>('reasoningService') : undefined,
            c.has('governanceService') ? c.get<IGovernanceService>('governanceService') : undefined,
            c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined,
        );
    });

    register('entityService', () => {
        return new EntityService();
    });

    register('koreService', (c: IContainer) => {
        return new KoreService(dalOf(c), eventsOf(c), c.get<IDialogueService>('dialogueService'));
    });

    register('campaignService', (c: IContainer) => {
        return new CampaignService(
            dalOf(c),
            eventsOf(c),
            c.has('gatewayService') ? c.get<IGatewayService>('gatewayService') : undefined,
        );
    });

    register('employeeService', (c: IContainer) => {
        return new EmployeeService(
            dalOf(c),
            eventsOf(c),
            c.has('plannerService') ? c.get<IPlannerService>('plannerService') : undefined,
            c.has('mobileAccessService') ? c.get<IMobileAccessService>('mobileAccessService') : undefined,
        );
    });

    register('codeAgentService', (c: IContainer) => {
        return new CodeAgentService(
            eventsOf(c),
            llmOf(c),
            c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined,
        );
    });

    register('assistantService', (c: IContainer) => {
        return new AssistantService(
            dalOf(c),
            c.get<IPersonaService>('personaService'),
            c.has('datasetService') ? c.get<IDatasetService>('datasetService') : undefined,
            c.has('runQueueService') ? c.get<IRunQueueService>('runQueueService') : undefined,
            c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined,
        );
    });

    register('gumService', (c: IContainer) => {
        return new GumService(
            dalOf(c),
            c.has('crewService') ? c.get<ICrewService>('crewService') : undefined,
            c.has('graphService') ? c.get<IGraphService>('graphService') : undefined,
        );
    });
};
