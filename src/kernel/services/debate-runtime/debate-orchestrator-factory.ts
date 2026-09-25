import type { IDebateOrchestrator } from '../../contracts/debate-runtime';
import { DebateTopologyService } from './debate-topology';
import { ConversationBackedDebateOrchestrator } from './conversation-backed-debate-orchestrator';

/**
 * Debate orchestrator entry point (leaf module — no barrel imports).
 *
 * Step A is closed: the Debate runtime is now exclusively the
 * ConversationCore-backed orchestrator (`DebatePolicy` + `DebateAgentExecutionEngine`
 * + `ConversationOrchestrator`), reached through the `IDebateOrchestrator`
 * anti-corrosion contract. The legacy `DebateOrchestrator` class is preserved
 * (not deleted) as a regression reference but is no longer wired into any
 * production path.
 *
 * Lives here instead of `./index` so that debate-engine.ts and
 * debate-session-context.ts don't import the barrel (index ↔ engine
 * circular dependency).
 */
export function createDebateOrchestrator(
    topologyService: DebateTopologyService,
): IDebateOrchestrator {
    return new ConversationBackedDebateOrchestrator(topologyService);
}
