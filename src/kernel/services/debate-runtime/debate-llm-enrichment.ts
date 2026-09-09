import { estimateTokenCount } from '../../../llm/utils/token-counter';
import { rootLogger } from '../logger-service';
import type { IDebateSession, ParticipantConfig } from '../../contracts/debate-runtime';
import type { IProviderAdapter } from '../../contracts/provider-adapter';
import type { LlmCallerDeps } from './debate-llm-caller-deps';
import { sessionRToMMap, sessionCausalGraphMap } from './debate-llm-session-maps';

const LOGGER = rootLogger.child('DebateLlmEnrichment');

/** Shape of `resolvedKey` produced by `DebateProviderResolver.resolveProvider`. */
export type ResolvedDebateKey = {
    id: string;
    key: string;
    provider: string;
    availableModels?: string[];
};

/**
 * B-11: the post-success enrichment pipeline (recordUsage + shadow-opponent +
 * redundancy + drift + RToM + causal-graph). Extracted out of the
 * `debateCallLlm` retry loop so the loop stays focused on Resolve → Call →
 * Classify → Retry/Failover. Pure orchestration of side-effects only — every
 * sub-step preserves its original try/catch (swallowed) so a failing optional
 * service never aborts the argument. Returns the (possibly shadow-strengthened)
 * content so the caller can persist the final text.
 */
export interface DebateEnrichmentContext {
    sessionId: string;
    session: IDebateSession;
    participant: ParticipantConfig;
    deps: LlmCallerDeps;
    content: string;
    systemContent: string;
    currentName: string;
    modelId: string;
    resolvedKey: ResolvedDebateKey | undefined;
    adapter: IProviderAdapter;
    controller: AbortController;
    isQ: (flag: string) => boolean;
}

export async function enrichSuccessfulDebateResponse(
    ctx: DebateEnrichmentContext,
): Promise<string> {
    const {
        sessionId,
        session,
        participant,
        deps,
        systemContent,
        currentName,
        modelId,
        resolvedKey,
        adapter,
        controller,
        isQ,
    } = ctx;
    let content = ctx.content;

    const keyService = deps.getKeyService();
    const estimatedTokens = estimateTokenCount(content);
    try {
        keyService.recordUsage(resolvedKey!.id, 0, estimatedTokens, modelId, {
            task: 'debate',
            round: session.round,
        });
    } catch {
        LOGGER.warn('DebateLlmEnrichment', 'Failed to record reasoning trace');
    }

    // P0.2: Shadow Opponent — self-critique + strengthen
    if (isQ('shadow-opponent') && deps.shadowOpponent) {
        try {
            const shadowResult = await deps.shadowOpponent.strengthenArgument(
                content,
                systemContent,
                participant.agentId,
                currentName,
                adapter,
                modelId,
                resolvedKey!.key,
                controller.signal,
                session.language,
            );
            if (shadowResult && shadowResult.strengthenedContent.length > content.length * 0.5) {
                LOGGER.debug('DebateLlmEnrichment', 'Shadow opponent strengthened argument', {
                    agentId: participant.agentId,
                    originalLen: content.length,
                    strengthenedLen: shadowResult.strengthenedContent.length,
                    latencyMs: shadowResult.latencyMs,
                });
                content = shadowResult.strengthenedContent;
            }
        } catch {
            LOGGER.warn('DebateLlmEnrichment', 'Shadow opponent failed — using original', {
                agentId: participant.agentId,
            });
        }
        deps.qualityCollector?.record({
            id: `${sessionId}-shadow-${participant.agentId}-${Date.now()}`,
            sessionId,
            techniqueId: 'shadow-opponent',
            timestamp: Date.now(),
            eventType: 'SERVICE_EXECUTED',
            round: session.round,
            agentId: participant.agentId,
            payload: {
                serviceName: 'shadowOpponent.strengthenArgument',
                calls: 1,
                totalLatencyMs: 0,
            },
        });
    }

    // P1.26: Record this argument for future redundancy checks
    if (isQ('redundancy') && deps.similarityMonitor) {
        try {
            deps.similarityMonitor.recordArgument(participant.agentId, session.round, content);
        } catch {
            LOGGER.warn('DebateLlmEnrichment', 'Redundancy record error', { sessionId });
        }
    }

    // P1.16: Record this argument for persona drift tracking
    if (isQ('stance-drift') && deps.driftDetector) {
        try {
            deps.driftDetector.recordArgument(participant.agentId, session.round, content);
        } catch {
            LOGGER.warn('DebateLlmEnrichment', 'Drift record error', { sessionId });
        }
    }

    // P2.5: Ingest argument into RToM graph for theory-of-mind tracking
    if (isQ('rtom')) {
        try {
            const rtom = sessionRToMMap.get(sessionId);
            if (rtom && resolvedKey) {
                rtom.ingestArgument(
                    participant.agentId,
                    currentName,
                    content,
                    session.round,
                    participant.role || 'neutral',
                );
            }
        } catch {
            LOGGER.warn('DebateLlmEnrichment', 'RToM ingest error', { sessionId });
        }
    }

    // P0.16: Ingest response into causal graph for subsequent loop detection
    if (isQ('causal-graph')) {
        try {
            const cg = sessionCausalGraphMap.get(sessionId);
            if (cg) {
                cg.ingestClaim(sessionId, participant.agentId, content, session.round);
            }
        } catch {
            LOGGER.warn('DebateLlmEnrichment', 'Causal graph ingest error', { sessionId });
        }
    }

    return content;
}
