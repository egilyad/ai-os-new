/**
 * Публичный баррел новых сервисов (Фаза 0 + SPEC-каркасы).
 *
 * Удобная точка импорта для потребителей новых модулей.
 */
export { AuthorizationService } from '../permissions/authorization-service';
export { AgentSecurityGuard } from '../security/agent-security-guard';
export { EmbeddingService } from '../embedding-service';
export { MetricsService } from '../ops/metrics-service';
export { MetricsCollector } from '../ops/metrics-collector';
export { DexieMetricsStorage } from '../ops/metrics-dexie-storage';
export { EvalHub } from '../eval/eval-hub';
export {
    AgentRuntime,
    CrewRuntime,
    CouncilRuntime,
    ForumRuntime,
} from '../agent-runtime/agent-runtime';
export type {
    IAgentRuntime,
    AgentHandle,
    AgentRuntimeConfig,
    AgentTurnInput,
    AgentTurnResult,
} from '../../contracts/agent-runtime';
export { PluginRegistry } from '../plugins/plugin-registry';
export { PluginHost, type PluginHostRegistryPort } from '../plugins/plugin-host';
export { PluginLoader } from '../plugins/plugin-loader';
export { PluginWorkerClient } from '../plugins/plugin-worker';
export { TokenCodec } from '../auth/token-codec';
export { AgentService } from '../agent-service';
export type { AgentServiceDeps, AgentStats, AgentGroup } from '../agent-service';
export { CognitiveService } from '../cognitive-service';
export type { CognitiveServiceDeps, CognitiveStats } from '../cognitive-service';
export { OrchestrationService } from '../orchestration-service';
export type { OrchestrationServiceDeps } from '../orchestration-service';
export {
    LlmCrewExecutor,
    LlmCouncilPort,
    LlmGraphPort,
    LlmFrontierExecutor,
    LlmPersonaPort,
} from '../llm-bridge/llm-task-executor';
export type { LlmBridgeOptions } from '../llm-bridge/llm-task-executor';
export { LIBRARY_ROLES, getLibraryRolesByCategory } from '../../../data/role-library';
export type { LibraryRole, LibraryRoleCategory } from '../../../data/role-library';
export { A2AClient } from '../interop/a2a-client';
export { ProvenanceLinker } from '../trust/provenance-linker';
export { ProvenanceCollector } from '../trust/provenance-collector';
export { BuilderNodeCatalog } from '../builder/node-catalog';
