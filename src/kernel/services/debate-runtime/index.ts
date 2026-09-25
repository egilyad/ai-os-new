export { DebateTopologyService } from './debate-topology';
export { DebateSession } from './debate-session';
export { DebateBudget } from './debate-budget';
export { DebateMemory } from './debate-memory';
export { DebateConsensusEngine } from './debate-consensus';
export { DebateEvaluator } from './debate-evaluator';
export { DebateOrchestrator } from './debate-orchestrator';
export {
    ConversationBackedDebateOrchestrator,
    DebateAgentExecutionEngine,
} from './conversation-backed-debate-orchestrator';

/**
 * Debate orchestrator entry point — see ./debate-orchestrator-factory.
 * (Re-exported here for backward compatibility; import the leaf module
 * directly from inside debate-runtime to avoid barrel cycles.)
 */
export { createDebateOrchestrator } from './debate-orchestrator-factory';
export { DebateTimeline } from './debate-timeline';
export { DebateEngine } from './debate-engine';
export { DebateMemoryExtractor } from './debate-memory-extractor';
export type { ExtractedMemory, MemoryUnit, MemoryUnitType } from './debate-memory-extractor';
export { DebateEmbeddingPipeline } from './debate-embedding-pipeline';
export type { EmbeddingChunk, EmbeddingPipelineDeps } from './debate-embedding-pipeline';
export { DebateRAGRetriever } from './debate-rag-retriever';
export type { RAGContext, RetrievedChunk, DebateRAGDeps } from './debate-rag-retriever';
export { DebateMemoryGraph } from './debate-memory-graph';
export type { KnowledgeGraph, KnowledgeNode, KnowledgeEdge } from './debate-memory-graph';

// Moved standalone debate files
export { DebateInterpreter } from './debate-interpreter';
export type { DebateInterpretation, DebateInsight } from './debate-interpreter';
export type { DebateMetrics } from './debate-metrics';
export {
    computeGraphMetrics,
    computeActivityMetrics,
    computeQualityMetrics,
} from './debate-metrics';
export { buildDebateState, buildDebateStatePrompt } from './debate-state-builder';
export { updateConvergenceScore } from './debate-stop-conditions';
export { isDuplicateArgument } from './debate-duplicate-detection';
export {
    loadActiveSession,
    persistActiveSession,
    loadHistoryList,
    persistHistoryList,
} from './debate-session-persistence';
export { buildArgumentPrompt, buildOpeningPrompt } from './debate-prompt-builder';
export { DebatePostProcessor } from './debate-post-processor';
export { DebateHumanService } from './debate-human-service';
export { DebateApiService } from './debate-api';
export { DebateKnowledgeSyncService } from './debate-knowledge-sync';
export { DEBATE_TEMPLATES, getDebateTemplate } from './debate-templates';
export type { DebateTemplate } from './debate-templates';
export { DEBATE_ARCHETYPES, getArchetypesForRole } from './debate-archetypes';
export type { DebateArchetypeId } from './debate-archetypes';
export { getHistoricalFigure, HISTORICAL_FIGURES } from './debate-historical-figures';

// Subdirectory modules
export { DebateGovernor } from './debate-governor';
export { AutoDebateService } from './auto-debate/auto-debate-service';
export { StrategyManager } from './debate-strategy-manager';
export type { StrategyVersion } from './debate-strategy-manager';

// Debate enhancements (#2–#4)
export { CrossDebateMemoryService } from './cross-debate-memory';
export type { CrossDebateMemoryEntry, CrossDebateContext } from './cross-debate-memory';
export { DebateBreakpointService } from './debate-breakpoint-service';
export type { DebateBreakpoint, BreakpointHit, HumanFeedback, BreakpointTrigger } from './debate-breakpoint-service';
export { DebateQualityBenchmarkService } from './debate-quality-benchmark';
export type { DebateQualityScore, AgentQualityProfile, QualityTrend, QualityDimension } from './debate-quality-benchmark';
