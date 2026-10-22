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
import { createAssistantOpsActions } from '../services/assistant/assistant-ops-actions';
import { createAssistantAdminActions } from '../services/assistant/assistant-admin-actions';
import { AssistantService } from '../services/assistant/assistant-service';
import type { OrchestrationService } from '../services/orchestration-service';
import type { MetricsService } from '../services/metrics-service';
import type { TraceService } from '../services/trace-service';
import type { RoleService } from '../services/role-service';
import type { SettingsService } from '../services/settings-service';
import type { IAuditService } from '../contracts/ops';

/** The assistant acts as a system agent; its permission state gates writes. */
import { ASSISTANT_AGENT_ID } from '../services/assistant/assistant-agent';
export { ASSISTANT_AGENT_ID };

export const registerPhase78: Phase = ({ register }) => {
    register('projectKnowledgeService', () => new ProjectKnowledgeService());

    register('assistantNavigationService', (c: IContainer) => {
        return new AssistantNavigationService({ eventBus: c.get<IEventBus>('eventBus') });
    });

    register('assistantActionRegistry', (c: IContainer) => {
        const knowledge = c.get<ProjectKnowledgeService>('projectKnowledgeService');
        const navigation = c.get<AssistantNavigationService>('assistantNavigationService');
        /**
         * Optional services: a trimmed composition (tests, embed mode) may not
         * have them, and constructing some of them can fail without storage.
         * The actions that need them degrade to "not available" instead of
         * breaking the whole assistant.
         */
        const optional = <T>(id: string): T | undefined => {
            try {
                return c.has(id) ? c.get<T>(id) : undefined;
            } catch {
                return undefined;
            }
        };
        const agentService = optional<AgentService>('agentService');
        const memory = optional<MemoryOrchestrator>('memoryOrchestrator');
        const toolService = optional<ToolService>('toolService');
        const trust = optional<CapabilityTrustService>('capabilityTrustService');
        const approvalSvc = optional<ToolApprovalService>('toolApprovalService');
        const debateService = optional<{
            startDebate(
                topic: string,
                participants: unknown,
                strategy?: string,
                maxRounds?: number,
            ): Promise<{ id: string; status?: string }>;
        }>('debateService');

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
                // The service is built after the registry; the action only
                // resolves it when the model asks who it is.
                self: {
                    describe: () => {
                        try {
                            return c.get<AssistantService>(
                                'projectAssistantService',
                            ).describeSelf();
                        } catch {
                            return null;
                        }
                    },
                },
            }),
        );

        // Runtime observations: what the system is doing right now.
        const orchestrator = optional<OrchestrationService>('orchestrator');
        const metricsService = optional<MetricsService>('metricsService');
        const traceService = optional<TraceService>('traceService');
        const roleService = optional<RoleService>('roleService');
        const settingsService = optional<SettingsService>('settingsService');
        const auditService = optional<IAuditService>('auditService');
        registry.registerAll(
            createAssistantOpsActions({
                topology: orchestrator
                    ? {
                          summary: () => {
                              const top = orchestrator.getActiveTopology();
                              if (!top) return null;
                              const agents = top.nodes.filter((n) => n.type === 'agent');
                              return {
                                  id: top.id,
                                  name: top.name,
                                  nodes: top.nodes.length,
                                  agents: agents.length,
                                  routers: top.nodes.filter((n) => n.type === 'router').length,
                                  paused: agents.filter((n) =>
                                      orchestrator.isNodeDisabled(n.id),
                                  ).length,
                                  edges: (top.edges ?? []).length,
                              };
                          },
                      }
                    : undefined,
                metrics: metricsService
                    ? { aggregated: () => metricsService.generateAggregated() }
                    : undefined,
                traces: traceService
                    ? { stats: () => traceService.getTraceStats() }
                    : undefined,
                approvals: approvalSvc
                    ? {
                          pending: () =>
                              approvalSvc.listPending().map((p) => ({
                                  id: p.id,
                                  tool: p.toolId,
                                  agentId: p.agentId,
                              })),
                      }
                    : undefined,
            }),
        );

        // What the admin panels show, minus anything secret.
        registry.registerAll(
            createAssistantAdminActions({
                roles: roleService
                    ? {
                          getAllRoles: () =>
                              roleService.getAllRoles().map((r) => ({
                                  id: r.id,
                                  category: r.metadata?.category,
                                  builtin: r.isBuiltin,
                              })),
                      }
                    : undefined,
                settings: settingsService
                    ? { getSettings: () => settingsService.getSettings() }
                    : undefined,
                audit: auditService
                    ? {
                          list: (limit) => auditService.list(limit),
                          verify: () => auditService.verify(),
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
            // The assistant itself is a capability of the system, not a
            // hidden helper: it has an agent node and a panel behind it.
            trust.seed([
                {
                    id: 'agent:assistant',
                    kind: 'agent' as const,
                    title: 'Project Assistant',
                    evidence: ['topology node assistant', 'panel /assistant'],
                },
            ]);
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
            agentLabel: 'Project Assistant',
            lifecycle: c.has('agentService')
                ? {
                      status: (id: string) =>
                          c.get<AgentService>('agentService').getLifecycleState(id),
                  }
                : undefined,
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
            // The same rule as the chat: the first usable active key. The
            // assistant must run on any key the user has, without extra setup.
            // Resolved lazily: the key pool belongs to the UI-owned layer and
            // may be absent in a reduced composition.
            resolveRoute: () => {
                try {
                    if (!c.has('keyService')) return undefined;
                    const keyService = c.get<{
                        getActiveKeys(): Array<{
                            provider: string;
                            key: string;
                            status: string;
                            model?: string;
                            availableModels?: string[];
                        }>;
                    }>('keyService');
                    const key = keyService
                        .getActiveKeys()
                        .find((k) => k.status === 'active' && !!k.key);
                    if (!key) return undefined;
                    const model =
                        key.model && key.model !== 'auto'
                            ? key.model
                            : (key.availableModels ?? []).find((m) => m && m !== 'auto');
                    return { provider: key.provider, model };
                } catch {
                    return undefined;
                }
            },
        });
    });
};
