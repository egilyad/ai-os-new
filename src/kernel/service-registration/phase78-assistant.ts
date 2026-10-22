/**
 * Phase 78 — the project assistant.
 *
 * Registers the assistant's knowledge (A/B layers), its navigation channel,
 * its action registry (the toolbelt) and the service that assembles a turn.
 *
 * Only kernel-owned services are wired here. UI-owned capabilities (keys,
 * MCP, skills, scheduler, tasks) register their actions from the composition
 * root — they are part of the interface, not of the kernel.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { MemoryOrchestrator } from '../services/memory-orchestrator';
import type { AgentPermissionService } from '../services/permissions/permission-service';
import type { ToolApprovalService } from '../services/tool-pipeline/tool-approval-service';
import type { AgentService } from '../services/agent-service';
import type { ToolService } from '../services/tool-executor';
import type { CapabilityTrustService } from '../services/capability-trust/capability-trust-service';
import { AssistantExamService } from '../services/assistant/assistant-exam-service';
import { AssistantDiagnosisService } from '../services/assistant/assistant-diagnosis-service';
import { AssistantViewService } from '../services/assistant/assistant-view-service';
import { AssistantGuideService } from '../services/assistant/assistant-guide-service';
import type { AssistantDiaryService } from '../services/assistant/assistant-diary-service';
import { ProjectKnowledgeService } from '../services/assistant/project-knowledge-service';
import { AssistantNavigationService } from '../services/assistant/assistant-navigation-service';
import { AssistantActionRegistry } from '../services/assistant/assistant-action-registry';
import { createAssistantActions } from '../services/assistant/assistant-actions';
import { AssistantService } from '../services/assistant/assistant-service';

/** The assistant acts as a system agent; its permission state gates writes. */
const ASSISTANT_AGENT_ID = 'assistant';

export const registerPhase78: Phase = ({ register }) => {
    register('projectKnowledgeService', () => new ProjectKnowledgeService());

    register('assistantNavigationService', (c: IContainer) => {
        return new AssistantNavigationService({ eventBus: c.get<IEventBus>('eventBus') });
    });

    register('assistantActionRegistry', (c: IContainer) => {
        const knowledge = c.get<ProjectKnowledgeService>('projectKnowledgeService');
        const navigation = c.get<AssistantNavigationService>('assistantNavigationService');
        const agentService = c.has('agentService') ? c.get<AgentService>('agentService') : undefined;
        const memory = c.has('memoryOrchestrator')
            ? c.get<MemoryOrchestrator>('memoryOrchestrator')
            : undefined;
        const toolService = c.has('toolService') ? c.get<ToolService>('toolService') : undefined;
        const trust = c.has('capabilityTrustService')
            ? c.get<CapabilityTrustService>('capabilityTrustService')
            : undefined;
        const debateService = c.has('debateService')
            ? c.get<{
                  startDebate(
                      topic: string,
                      participants: unknown,
                      strategy?: string,
                      maxRounds?: number,
                  ): Promise<{ id: string; status?: string }>;
              }>('debateService')
            : undefined;

        const registry = new AssistantActionRegistry();
        // The exam and the diary depend on the registry, so they are resolved
        // lazily — the actions only touch them when they actually run.
        let exam: AssistantExamService | undefined;
        let diary: AssistantDiaryService | undefined;
        const diagnosis = new AssistantDiagnosisService();
        const guide = new AssistantGuideService({ knowledge });
        registry.registerAll(
            createAssistantActions({
                knowledge,
                navigation,
                diagnosis,
                guide,
                get exam() {
                    return exam;
                },
                get diary() {
                    return diary;
                },
                agents: agentService
                    ? {
                          getAgents: () => agentService.getAgents(),
                          spawnAgent: (name, roleId, config) =>
                              agentService.spawnAgent(name, roleId, config),
                          activate: (id) => agentService.activate(id),
                          pause: (id) => agentService.pause(id),
                          getLifecycleState: (id) => agentService.getLifecycleState(id),
                      }
                    : undefined,
                memory: memory
                    ? {
                          recall: (context, limit) => memory.recall(context, limit),
                          store: (entry) =>
                              memory.store({
                                  content: entry.content,
                                  metadata: {
                                      source: 'assistant',
                                      type: String(entry.metadata['type'] ?? 'note'),
                                      timestamp: Date.now(),
                                      importance: 0.6,
                                  },
                              }),
                      }
                    : undefined,
                tools: toolService
                    ? {
                          getTools: () =>
                              toolService.getTools().map((t) => ({
                                  id: t.id,
                                  name: t.name,
                                  description: t.description,
                                  enabled: t.enabled,
                              })),
                      }
                    : undefined,
                trust: trust
                    ? {
                          list: () =>
                              trust.list().map((c) => ({
                                  id: c.id,
                                  kind: c.kind,
                                  title: c.title,
                                  trust: c.trust,
                                  evidence: c.evidence,
                                  stale: c.stale,
                              })),
                          stats: () => trust.stats(),
                      }
                    : undefined,
                debates: debateService
                    ? {
                          startDebate: (topic, participants, strategy, maxRounds) =>
                              debateService.startDebate(
                                  topic,
                                  participants,
                                  strategy,
                                  maxRounds,
                              ),
                      }
                    : undefined,
            }),
        );
        // Actions are tracked capabilities: discovered on registration,
        // verified when they actually run.
        if (trust) {
            registry.setTrustService(trust);
            trust.seed(
                knowledge.panelsMatching().map((p) => ({
                    id: `panel:${p.id}`,
                    kind: 'panel' as const,
                    title: p.id,
                    evidence: [p.route, p.component ?? 'no component'],
                })),
            );
            exam = new AssistantExamService({ trust, actions: registry });
        }
        if (c.has('assistantDiaryService')) {
            diary = c.get<AssistantDiaryService>('assistantDiaryService');
        }
        return registry;
    });

    // The exam is stateless — it only reads the trust ledger and the action
    // registry — so the container may hold its own instance for the assistant.
    register('assistantExamService', (c: IContainer) => {
        const trust = c.get<CapabilityTrustService>('capabilityTrustService');
        const actions = c.get<AssistantActionRegistry>('assistantActionRegistry');
        return new AssistantExamService({ trust, actions });
    });

    register('assistantDiagnosisService', () => new AssistantDiagnosisService());

    register('assistantViewService', () => new AssistantViewService());

    register('assistantGuideService', (c: IContainer) => {
        const knowledge = c.get<ProjectKnowledgeService>('projectKnowledgeService');
        return new AssistantGuideService({ knowledge });
    });

    register('projectAssistantService', (c: IContainer) => {
        return new AssistantService({
            llm: c.get<ILLMClientService>('llmClientService'),
            actions: c.get<AssistantActionRegistry>('assistantActionRegistry'),
            knowledge: c.get<ProjectKnowledgeService>('projectKnowledgeService'),
            events: c.get<IEventBus>('eventBus'),
            agentId: ASSISTANT_AGENT_ID,
            permissionService: c.has('agentPermissionService')
                ? c.get<AgentPermissionService>('agentPermissionService')
                : undefined,
            approvalService: c.has('toolApprovalService')
                ? c.get<ToolApprovalService>('toolApprovalService')
                : undefined,
            memory: c.has('memoryOrchestrator')
                ? c.get<MemoryOrchestrator>('memoryOrchestrator')
                : undefined,
            trust: c.has('capabilityTrustService')
                ? c.get<CapabilityTrustService>('capabilityTrustService')
                : undefined,
            diary: c.has('assistantDiaryService')
                ? c.get<AssistantDiaryService>('assistantDiaryService')
                : undefined,
            exam: c.has('assistantExamService')
                ? c.get<AssistantExamService>('assistantExamService')
                : undefined,
            diagnosis: c.has('assistantDiagnosisService')
                ? c.get<AssistantDiagnosisService>('assistantDiagnosisService')
                : undefined,
            view: c.has('assistantViewService')
                ? c.get<AssistantViewService>('assistantViewService')
                : undefined,
        });
    });
};
