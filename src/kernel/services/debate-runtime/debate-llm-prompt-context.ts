import { rootLogger } from '../logger-service';
import {
    sessionRToMMap,
    sessionFingerprintMap,
    sessionCausalGraphMap,
} from './debate-llm-session-maps';
import { buildPersonaMemory, DebateMemory } from './debate-memory';
import { buildArgumentPrompt } from './debate-prompt-builder';
import type { IDebateSession, ParticipantConfig } from '../../contracts/debate-runtime';
import type { DebateArgument, DebateParticipant } from '../../contracts/debate-types';
import type { EntanglementConstraint } from '../../contracts/debate-entanglement';
import type { SteelmanTarget } from '../../contracts/debate-steelman';
import type { UnmetBurden } from '../../contracts/debate-bop';
import type { Contradiction } from '../../contracts/debate-consistency';
import type { SourceCredibility } from '../../contracts/debate-credibility';
import type { LlmCallerDeps } from './debate-llm-caller-deps';

const LOGGER = rootLogger.child('DebateLlmCaller');

export interface BuildDebateSystemContentParams {
    deps: LlmCallerDeps;
    session: IDebateSession;
    participant: ParticipantConfig;
    sessionId: string;
    isQ: (id: string) => boolean;
    currentName: string;
    previousArguments: DebateArgument[];
    allDebateParticipants: DebateParticipant[];
    mem: DebateMemory;
    controller: AbortController;
}

export interface BuildDebateSystemContentResult {
    systemContent: string;
    entanglementConstraint: EntanglementConstraint | null;
}

export async function buildDebateSystemContent(
    params: BuildDebateSystemContentParams,
): Promise<BuildDebateSystemContentResult> {
    const {
        deps,
        session,
        participant,
        sessionId,
        isQ,
        currentName,
        previousArguments,
        allDebateParticipants,
        mem,
        controller,
    } = params;
    // Phase A: Build unified argument graph for all downstream services
    if (deps.argumentGraphService && previousArguments.length >= 2) {
        try {
            const graphInput = previousArguments.map((a) => ({
                id: a.id,
                agentId: a.agentId,
                agentName: a.agentName,
                content: a.content,
                round: a.round,
                timestamp: a.timestamp,
                confidence: a.confidence,
                position: a.position,
                parentId: a.parentId,
                parentResolution: a.parentResolution,
                duplicateOf: a.duplicateOf,
            }));
            deps.argumentGraphService.build(graphInput);
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Argument graph build error', { sessionId });
        }
    }

    // P0.1: Compute entanglement constraint (direct claim-by-claim response)
    let entanglementConstraint = null;
    if (isQ('entanglement') && deps.entanglementEngine && previousArguments.length >= 2) {
        try {
            entanglementConstraint = deps.entanglementEngine.getConstraint(
                participant.agentId,
                currentName,
                previousArguments,
                session.round,
            );
            if (entanglementConstraint) {
                LOGGER.debug('DebateLlmCaller', 'Entanglement constraint generated', {
                    targetAgentId: entanglementConstraint.opponentId,
                    responseType: entanglementConstraint.responseType,
                    sessionId,
                });
            }
            deps.qualityCollector?.record({
                id: `${sessionId}-entanglement-${participant.agentId}-${Date.now()}`,
                sessionId,
                techniqueId: 'entanglement',
                timestamp: Date.now(),
                eventType: 'SERVICE_EXECUTED',
                round: session.round,
                agentId: participant.agentId,
                payload: {
                    serviceName: 'entanglementEngine.getConstraint',
                    calls: 1,
                    totalLatencyMs: 0,
                    outputSummary: entanglementConstraint
                        ? `target=${entanglementConstraint.opponentId},type=${entanglementConstraint.responseType}`
                        : undefined,
                },
            });
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Entanglement engine error', { sessionId });
        }
    }

    // P0.5: Extract anchors (agreed-upon claims) to focus on delta
    let anchors: import('../../contracts/debate-entanglement').AnchorClaim[] | undefined;
    if (isQ('agreement-anchoring') && deps.anchoringService && previousArguments.length >= 6) {
        try {
            anchors = deps.anchoringService.extractAnchors(previousArguments, session.round, 3);
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Anchoring service error', { sessionId });
        }
    }

    // P0.4: Compute vulnerability targets (weakest opponent claims to attack)
    let vulnerabilityTargets:
        import('../../contracts/debate-vulnerability').VulnerabilityTarget[] | undefined;
    if (
        isQ('vulnerability-targeting') &&
        deps.vulnerabilityTargeting &&
        deps.argumentGraphService?.initialized &&
        previousArguments.length >= 4
    ) {
        try {
            vulnerabilityTargets = deps.vulnerabilityTargeting.findVulnerabilities(
                participant.agentId,
                currentName,
                session.round,
                2,
            );
            if (vulnerabilityTargets && vulnerabilityTargets.length > 0) {
                LOGGER.debug('DebateLlmCaller', 'Vulnerability targets found', {
                    count: vulnerabilityTargets.length,
                    sessionId,
                });
            }
            deps.qualityCollector?.record({
                id: `${sessionId}-vuln-${participant.agentId}-${Date.now()}`,
                sessionId,
                techniqueId: 'vulnerability-targeting',
                timestamp: Date.now(),
                eventType: 'SERVICE_EXECUTED',
                round: session.round,
                agentId: participant.agentId,
                payload: {
                    serviceName: 'vulnerabilityTargeting.findVulnerabilities',
                    calls: vulnerabilityTargets?.length ?? 0,
                    totalLatencyMs: 0,
                },
            });
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Vulnerability targeting error', {
                sessionId,
            });
        }
    }

    // P0.3: Adversarial Source — verify opponent source citations
    let adversarialWarnings:
        import('../../contracts/debate-adversarial-source').SourceVerificationResult[] | undefined;
    if (isQ('adversarial-source') && deps.adversarialSource && previousArguments.length >= 2) {
        try {
            // Scan opponent claims (not current agent's) for source URLs
            const opponentClaims = previousArguments
                .filter((a) => a.agentId !== participant.agentId)
                .slice(-3)
                .map((a) => a.content)
                .join('\n\n');
            if (opponentClaims.length > 50) {
                adversarialWarnings = await deps.adversarialSource.verifyClaims(
                    opponentClaims,
                    controller.signal,
                );
                if (adversarialWarnings && adversarialWarnings.length > 0) {
                    LOGGER.debug('DebateLlmCaller', 'Adversarial source warnings found', {
                        count: adversarialWarnings.length,
                        sessionId,
                    });
                }
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Adversarial source check error', {
                sessionId,
            });
        }
    }

    // P0.6: Adversarial Belief Mining — extract implicit premises and
    // detect cross-agent belief conflicts
    let beliefConflicts:
        import('../../contracts/debate-belief-mining').BeliefConflict[] | undefined;
    if (isQ('belief-mining') && deps.beliefMiningService && previousArguments.length >= 4) {
        try {
            const miningInput = previousArguments.map((a) => ({
                id: a.id,
                agentId: a.agentId,
                agentName: a.agentName,
                content: a.content,
                round: a.round,
            }));
            beliefConflicts = deps.beliefMiningService.mineConflicts(miningInput, session.round);
            if (beliefConflicts && beliefConflicts.length > 0) {
                LOGGER.debug('DebateLlmCaller', 'Belief conflicts found', {
                    count: beliefConflicts.length,
                    sessionId,
                    topSeverity: beliefConflicts[0]!.severity.toFixed(2),
                });
            }
        } catch (e) {
            LOGGER.warn('DebateLlmCaller', 'Belief mining error', {
                sessionId,
                error: e instanceof Error ? e.message : String(e),
                stack:
                    e instanceof Error ? e.stack?.split('\n').slice(0, 3).join(' | ') : undefined,
            });
        }
    }

    // P0.7: Graph Minimax — compute best strategic move for this agent
    // using 2-ply minimax on the argument graph
    let minimaxMove: import('../../contracts/debate-minimax').MinimaxMove | null | undefined;
    if (
        isQ('graph-minimax') &&
        deps.minimaxPlanner &&
        deps.argumentGraphService?.initialized &&
        previousArguments.length >= 4
    ) {
        try {
            minimaxMove = deps.minimaxPlanner.plan(participant.agentId, currentName, session.round);
            if (minimaxMove) {
                LOGGER.debug('DebateLlmCaller', 'Minimax strategic move found', {
                    type: minimaxMove.type,
                    targetNodeId: minimaxMove.targetNodeId,
                    score: minimaxMove.score.toFixed(3),
                    sessionId,
                });
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Minimax planner error', { sessionId });
        }
    }

    // P0.8: Meta-Agent — compute tactical directive for this agent
    let tacticalDirective:
        import('../../contracts/debate-meta-agent').TacticalDirective | null | undefined;
    if (
        isQ('meta-agent') &&
        deps.metaAgent &&
        deps.argumentGraphService?.initialized &&
        previousArguments.length >= 3
    ) {
        try {
            const miningInput = previousArguments.map((a) => ({
                id: a.id,
                agentId: a.agentId,
                content: a.content,
                round: a.round,
            }));
            tacticalDirective = deps.metaAgent.getDirective(
                participant.agentId,
                currentName,
                miningInput,
                session.round,
            );
            if (tacticalDirective) {
                LOGGER.debug('DebateLlmCaller', 'Meta-agent directive assigned', {
                    role: tacticalDirective.role,
                    agentId: participant.agentId,
                    sessionId,
                });
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Meta-agent error', { sessionId });
        }
    }

    // P0.10: Burden of Proof — check for this agent's unmet burdens
    let unmetBurdens: UnmetBurden[] | undefined;
    if (isQ('burden-of-proof') && deps.boPTracker && previousArguments.length >= 1) {
        try {
            // Record this agent's past claims as burden entries
            for (const arg of previousArguments) {
                if (arg.agentId === participant.agentId) {
                    deps.boPTracker.recordClaim(
                        arg.id,
                        arg.agentId,
                        arg.agentName,
                        arg.content,
                        arg.round,
                    );
                }
            }
            // Find which burdens are still unmet
            unmetBurdens = deps.boPTracker.getUnmetForAgent(participant.agentId);
            if (unmetBurdens && unmetBurdens.length > 0) {
                LOGGER.debug('DebateLlmCaller', 'Unmet burdens found', {
                    count: unmetBurdens.length,
                    sessionId,
                });
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'BoP tracker error', { sessionId });
        }
    }

    // P0.11: Consistency Check — detect contradictions among agent's own
    // past claims. Results inject a warning in the current prompt so the
    // agent can address/resolve inconsistencies.
    let consistencyContradictions: Contradiction[] | undefined;
    if (isQ('consistency-check') && deps.consistencyService && previousArguments.length >= 3) {
        try {
            const ownArgs = previousArguments.filter((a) => a.agentId === participant.agentId);
            // Found internal contradictions among agent's own claims
            if (ownArgs.length >= 2) {
                // Check pairwise: each pair that's contradictory is flagged
                const found: Contradiction[] = [];
                for (let i = 0; i < ownArgs.length - 1; i++) {
                    const sub = ownArgs.slice(0, i + 1);
                    const result = deps.consistencyService.checkConsistency(
                        participant.agentId,
                        currentName,
                        ownArgs[i + 1]!.content,
                        ownArgs[i + 1]!.round,
                        sub.map((a) => ({
                            id: a.id,
                            agentId: a.agentId,
                            content: a.content,
                            round: a.round,
                        })),
                    );
                    found.push(...result);
                }
                consistencyContradictions = found.length > 0 ? found : undefined;
                if (consistencyContradictions) {
                    LOGGER.debug('DebateLlmCaller', 'Consistency contradictions found', {
                        count: consistencyContradictions.length,
                        sessionId,
                    });
                }
            }
            deps.qualityCollector?.record({
                id: `${sessionId}-consistency-${participant.agentId}-${Date.now()}`,
                sessionId,
                techniqueId: 'consistency-check',
                timestamp: Date.now(),
                eventType: 'SIGNAL_CREATED',
                round: session.round,
                agentId: participant.agentId,
                payload: {
                    signalName: 'consistencyContradictions',
                    value: consistencyContradictions?.length ?? 0,
                },
            });
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Consistency check error', { sessionId });
        }
    }

    // P0.9: Steelmanning Protocol — select opponent's claim to restate
    // in strongest form before rebuttal
    let steelmanTarget: SteelmanTarget | null | undefined;
    if (isQ('steelman') && deps.steelmanService && previousArguments.length >= 2) {
        try {
            const miningInput = previousArguments.map((a) => ({
                id: a.id,
                agentId: a.agentId,
                agentName: a.agentName,
                content: a.content,
                round: a.round,
            }));
            steelmanTarget = deps.steelmanService.selectTarget(participant.agentId, miningInput);
            if (steelmanTarget) {
                LOGGER.debug('DebateLlmCaller', 'Steelman target selected', {
                    opponentName: steelmanTarget.opponentName,
                    sessionId,
                });
            }
            deps.qualityCollector?.record({
                id: `${sessionId}-steelman-${participant.agentId}-${Date.now()}`,
                sessionId,
                techniqueId: 'steelman',
                timestamp: Date.now(),
                eventType: 'PROMPT_BLOCK_USED',
                round: session.round,
                agentId: participant.agentId,
                payload: {
                    blockName: 'steelmanBlock',
                    charLength: steelmanTarget?.claimText?.length ?? 0,
                    runtimeServiceCalled: true,
                    serviceLatencyMs: 0,
                },
            });
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Steelman selection error', { sessionId });
        }
    }

    // P0.12: Source Credibility Scoring — assess credibility of
    // sources cited in previous arguments and inject awareness
    let sourceCredibilityScores: SourceCredibility[] | undefined;
    if (isQ('credibility-scoring') && deps.credibilityScorer && previousArguments.length >= 1) {
        try {
            const allSourceMatches: string[] = [];
            for (const arg of previousArguments) {
                const urlMatches = arg.content.match(/https?:\/\/[^\s)]+/g);
                if (urlMatches) allSourceMatches.push(...urlMatches);
                const citeMatches = arg.content.match(/"According to [^"]+"/g);
                if (citeMatches) allSourceMatches.push(...citeMatches);
            }
            if (allSourceMatches.length > 0) {
                const result = deps.credibilityScorer.scoreSources(allSourceMatches);
                sourceCredibilityScores = result.scores;
                LOGGER.debug('DebateLlmCaller', 'Source credibility scored', {
                    count: result.scores.length,
                    average: result.average,
                    lowestTier: result.lowestTier,
                    sessionId,
                });
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Credibility scoring error', { sessionId });
        }
    }

    // P1.26: Echo chamber / redundancy detection — warn agent if recent
    // arguments are too similar to their own prior turns.
    let redundancyScore: number | undefined;
    if (isQ('redundancy') && deps.similarityMonitor) {
        try {
            const prevRedundancy = deps.similarityMonitor.getRedundancy(
                participant.agentId,
                session.round - 1,
            );
            if (prevRedundancy) redundancyScore = prevRedundancy.similarityScore;
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Redundancy check error', { sessionId });
        }
    }

    // P1.16: Persona drift detection — register persona and check drift
    let driftScore: number | undefined;
    if (isQ('stance-drift') && deps.driftDetector) {
        try {
            deps.driftDetector.registerPersona(
                participant.agentId,
                participant.role || 'neutral',
                participant.systemPrompt,
            );
            const prevDrift = deps.driftDetector.getDrift(participant.agentId, session.round - 1);
            if (prevDrift) driftScore = prevDrift.driftScore;
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Drift detection error', { sessionId });
        }
    }

    // P1.21: InsightBus — ingest previous round arguments, get formatted insights
    let insightText: string | undefined;
    if (isQ('insight-bus') && deps.insightBus && session.round > 1) {
        try {
            // Ingest all available previous arguments (across all agents)
            const allRoundArgs = previousArguments.map((a) => ({
                agentId: a.agentId,
                content: a.content,
            }));
            deps.insightBus.ingestRound(session.round - 1, allRoundArgs);
            insightText = deps.insightBus.getFormattedInsights(session.language);
        } catch {
            LOGGER.warn('DebateLlmCaller', 'InsightBus error', { sessionId });
        }
    }

    // P1.22: Key-moment replay — ingest previous round for pivotal moment detection
    let replayText: string | undefined;
    if (isQ('replay') && deps.replaySelector && session.round > 1) {
        try {
            const allRoundArgs = previousArguments.map((a) => ({
                agentId: a.agentId,
                content: a.content,
            }));
            deps.replaySelector.ingestRound(session.round - 1, allRoundArgs);
            replayText = deps.replaySelector.getFormattedReplay(session.round, session.language);
        } catch {
            LOGGER.warn('DebateLlmCaller', 'ReplaySelector error', { sessionId });
        }
    }

    // P1.25: Logical form extraction / enthymeme detection
    let enthymemeText: string | undefined;
    if (isQ('enthymeme') && deps.logicalFormExtractor && session.round > 1) {
        try {
            const prevArgs = previousArguments.filter((a) => a.round === session.round - 1);
            for (const a of prevArgs) {
                deps.logicalFormExtractor.analyzeArgument(a.agentId, a.round, a.content);
            }
            enthymemeText = deps.logicalFormExtractor.getFormattedTargets(
                participant.agentId,
                session.round - 1,
                session.language,
            );
        } catch {
            LOGGER.warn('DebateLlmCaller', 'LogicalFormExtractor error', { sessionId });
        }
    }

    // P1.18: Cognitive bias profiling — check opponent's arguments
    let biasExploitText: string | undefined;
    if (isQ('bias-exploit') && deps.biasProfiler && session.round > 1) {
        try {
            const prevArgs = previousArguments.filter((a) => a.round === session.round - 1);
            for (const a of prevArgs) {
                deps.biasProfiler.analyzeArgument(a.agentId, a.round, a.content);
            }
            // Get exploit prompt for self and mitigation for opponent
            const exploit = deps.biasProfiler.getExploitPrompt(
                participant.agentId,
                session.round - 1,
                session.language,
            );
            const mitigate = deps.biasProfiler.getMitigationPrompt(
                participant.agentId,
                session.round - 1,
                session.language,
            );
            biasExploitText = [exploit, mitigate].filter(Boolean).join('\n');
        } catch {
            LOGGER.warn('DebateLlmCaller', 'BiasProfiler error', { sessionId });
        }
    }

    // P1.17: Micro-interrupt queue — check for pending clarification requests
    let interruptText: string | undefined;
    if (isQ('interrupt') && deps.interruptQueue && session.round > 1) {
        try {
            interruptText = deps.interruptQueue.getFormattedInterrupts(
                participant.agentId,
                session.round,
                session.language,
            );
        } catch {
            LOGGER.warn('DebateLlmCaller', 'InterruptQueue error', { sessionId });
        }
    }

    // P1.24: Stakeholder Impact Multi-Perspective Analysis
    let stakeholderText: string | undefined;
    if (isQ('stakeholder') && deps.stakeholderMapper && session.round > 1) {
        try {
            const stakeholders = deps.stakeholderMapper.analyzeTopic(session.topic);
            if (stakeholders.length > 0) {
                stakeholderText = deps.stakeholderMapper.getFormattedStakeholders(
                    stakeholders,
                    session.language,
                );
                LOGGER.debug('DebateLlmCaller', 'Stakeholder analysis generated', {
                    count: stakeholders.length,
                    sessionId,
                });
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'StakeholderMapper error', { sessionId });
        }
    }

    // P1.2: Fact-check — check previous round's arguments for false/disputed claims
    let factCheckText: string | undefined;
    if (isQ('fact-checking') && deps.factCheckService && session.round > 1) {
        try {
            const prevArgs = previousArguments.filter((a) => a.round === session.round - 1);
            const warnings: string[] = [];
            for (const a of prevArgs) {
                const fc = deps.factCheckService.getForArgument(a.id);
                if (!fc || fc.results.length === 0) continue;
                const bad = fc.results.filter(
                    (r) => r.verdict === 'false' || r.verdict === 'disputed',
                );
                for (const r of bad) {
                    warnings.push(
                        `${a.agentName}: "${r.claim.slice(0, 80)}" — ${r.verdict} (${r.reasoning.slice(0, 60)})`,
                    );
                }
            }
            if (warnings.length > 0) {
                factCheckText =
                    'WARNING: The following claims from the previous round were flagged as questionable:\n' +
                    warnings.map((w) => `- ${w}`).join('\n') +
                    '\nYou may challenge these claims in your response.';
            }
            deps.qualityCollector?.record({
                id: `${sessionId}-factcheck-${participant.agentId}-${Date.now()}`,
                sessionId,
                techniqueId: 'fact-checking',
                timestamp: Date.now(),
                eventType: 'SIGNAL_CREATED',
                round: session.round,
                agentId: participant.agentId,
                payload: {
                    signalName: 'factCheckWarnings',
                    value: warnings.length,
                },
            });
        } catch {
            LOGGER.warn('DebateLlmCaller', 'FactCheck error', { sessionId });
        }
    }

    // P1.3: Epistemic uncertainty calibration — score claims and enforce
    let calibrationText: string | undefined;
    if (isQ('epistemic-calibration') && deps.calibrationService && session.round > 1) {
        try {
            // Score opponent claims from previous round
            const prevArgs = previousArguments.filter((a) => a.round === session.round - 1);
            for (const a of prevArgs) {
                const result = deps.calibrationService.scoreClaims(a.content);
                deps.calibrationService.trackCalibration(
                    a.agentId,
                    session.round,
                    result.avgHeuristic,
                    false,
                );
            }
            // Get calibration enforcement for current agent
            calibrationText = deps.calibrationService.getCalibrationPrompt(
                participant.agentId,
                session.round,
                session.language,
            );
        } catch {
            LOGGER.warn('DebateLlmCaller', 'CalibrationService error', { sessionId });
        }
    }

    // P1.9: Adaptive Persona Mixer — generate persona variation
    let personaMixText: string | undefined;
    if (isQ('persona-mixer') && deps.personaMixer) {
        try {
            const mix = deps.personaMixer.getMix({
                agentId: participant.agentId,
                agentName: currentName,
                basePersona: participant.systemPrompt || '',
                agentRole: participant.role || 'neutral',
                round: session.round,
                otherParticipants: allDebateParticipants.map((p) => ({
                    id: p.id,
                    name: p.name,
                    role: p.role,
                    persona: p.systemPrompt || '',
                })),
                usedPersonaKeys: [],
            });
            deps.personaMixer.recordMix(participant.agentId, session.round, mix.variationKey);
            personaMixText = mix.personaText;
        } catch {
            LOGGER.warn('DebateLlmCaller', 'PersonaMixer error', { sessionId });
        }
    }

    // P1.12: Framing Contests Engine — detect & surface dominant frame
    let frameText: string | undefined;
    if (isQ('frame') && deps.frameTracker && session.round > 1) {
        try {
            // Register frames for previous round's arguments
            const prevRound = previousArguments.filter((a) => a.round === session.round - 1);
            for (const a of prevRound) {
                deps.frameTracker.registerFrame(a.agentId, a.agentName, a.round, a.content);
            }
            frameText = deps.frameTracker.getFramePrompt(session.language);
        } catch {
            LOGGER.warn('DebateLlmCaller', 'FrameTracker error', { sessionId });
        }
    }

    // P1.14: Expert Witness — find and summon relevant domain expert
    let expertText: string | undefined;
    if (isQ('expert-witness') && deps.expertWitness && session.round > 1) {
        try {
            const expert = deps.expertWitness.findExpert(session.topic);
            if (expert && !deps.expertWitness.wasSummoned(expert.id)) {
                deps.expertWitness.markSummoned(expert.id);
                expertText = deps.expertWitness.generateTestimony(
                    expert,
                    session.topic,
                    session.language,
                );
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'ExpertWitness error', { sessionId });
        }
    }

    // P1.8: Stance Drift — register opponent arguments, get call-out prompt
    let driftText: string | undefined;
    if (isQ('stance-drift') && deps.stanceDriftTracker && session.round > 1) {
        try {
            // Register previous round's arguments from all agents for stance tracking
            const prevRound = previousArguments.filter((a) => a.round === session.round - 1);
            for (const a of prevRound) {
                deps.stanceDriftTracker.registerArgument(
                    a.agentId,
                    a.agentName,
                    a.round,
                    a.content,
                );
            }
            // Check opponents for goalpost_shift to inject call-out
            const opponents = allDebateParticipants.filter((p) => p.id !== participant.agentId);
            for (const opp of opponents) {
                const callout = deps.stanceDriftTracker.getDriftCalloutText(
                    opp.id,
                    session.language,
                );
                if (callout) {
                    driftText = driftText ? `${driftText}\n${callout}` : callout;
                }
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'StanceDriftTracker error', { sessionId });
        }
    }

    // P2.6: Rhetorical Device — select device for current agent
    let rhetoricalText: string | undefined;
    if (isQ('rhetorical-device') && deps.rhetoricalDeviceSelector) {
        try {
            rhetoricalText = deps.rhetoricalDeviceSelector.getDevicePrompt(
                participant.role || 'neutral',
                session.round,
                session.language,
            );
        } catch {
            LOGGER.warn('DebateLlmCaller', 'RhetoricalDevice error', { sessionId });
        }
    }

    // P2.11: Hidden scratchpad — tactical analysis before argument generation
    let scratchpadText: string | undefined;
    if (isQ('scratchpad') && deps.scratchpadService && session.round > 1) {
        try {
            const analysis = deps.scratchpadService.analyze(
                participant.agentId,
                participant.role || 'neutral',
                session.round,
                previousArguments.map((a) => ({
                    agentId: a.agentId,
                    agentName: a.agentName,
                    content: a.content,
                    round: a.round,
                })),
                session.topic,
                session.language,
            );
            scratchpadText = analysis.promptBlock;
        } catch {
            LOGGER.warn('DebateLlmCaller', 'ScratchpadService error', { sessionId });
        }
    }

    // P2.14: Narrative Arc — storytelling structure instruction
    let narrativeText: string | undefined;
    if (isQ('narrative-arc') && session.round >= 2) {
        try {
            const { NarrativeBuilder } = await import('./narrative-builder');
            const builder = new NarrativeBuilder();
            const arc = builder.selectArc(
                participant.agentId,
                session.round,
                session.maxRounds || session.round + 3,
            );
            narrativeText = arc.instruction;
        } catch {
            LOGGER.warn('DebateLlmCaller', 'NarrativeBuilder error', { sessionId });
        }
    }

    // P2.20: Abstraction Ladder Switcher
    let levelText: string | undefined;
    if (isQ('abstraction-ladder') && session.round >= 2) {
        try {
            const { LevelTracker } = await import('./level-tracker');
            const tracker = new LevelTracker();
            const myClaims = previousArguments
                .filter((a) => a.agentId === participant.agentId)
                .map((a) => a.content);
            const analysis = tracker.analyze(participant.agentId, myClaims, session.round);
            levelText = analysis.instruction;
        } catch {
            LOGGER.warn('DebateLlmCaller', 'LevelTracker error', { sessionId });
        }
    }

    // P2.23: Role-Reversal Exercise — forced perspective-taking (every 4 rounds, from round 3)
    let reversalText: string | undefined;
    if (isQ('role-reversal') && session.round >= 3 && session.round % 4 === 0) {
        const opponents = previousArguments
            .filter((a) => a.agentId !== participant.agentId)
            .map((a) => a.agentName);
        if (opponents.length > 0) {
            const target =
                opponents[Math.abs(participant.agentId.charCodeAt(0)) % opponents.length];
            reversalText = `For this round only, argue FROM the perspective of ${target}. Adopt their underlying values, priorities, and reasoning style. Do NOT announce that you are role-playing — simply argue as if you genuinely hold their position. This exercise builds empathy and steelman capability.`;
        }
    }

    // P2.10: Fog of War / Info Asymmetry — each agent gets a limited
    // information scope based on role and round progression
    const FOG_SCOPES = [
        'general knowledge and the debate transcript visible to all participants',
        'the debate transcript plus your assigned domain expertise',
        'the debate transcript plus classified intelligence on the topic',
        'only the debate transcript — no external knowledge',
    ];
    const fogIndex = isQ('fog-of-war')
        ? Math.abs(
              (participant.agentId.charCodeAt(0) * 7 + session.round * 3) % FOG_SCOPES.length,
          ) % FOG_SCOPES.length
        : 0;
    const fogOfWarScope = isQ('fog-of-war') ? FOG_SCOPES[fogIndex] : undefined;

    // P2.16: Progressive Evidence Revelation — evidence tier increases
    // with round number. Early rounds get foundational evidence, later
    // rounds get deeper, more specific evidence tiers.
    const evidenceRevelationRound = isQ('evidence-revelation') ? session.round : undefined;

    // P2.17: Humor & Wit Injector — humor level based on agent personality
    // and round (more humor in later rounds when tension is higher)
    const HUMOR_LEVELS = ['light wit', 'dry humor', 'ironic commentary', 'sharp satire'];
    const humorIdx = isQ('humor')
        ? Math.abs(
              (participant.agentId.charCodeAt(participant.agentId.length - 1) * 13 +
                  session.round * 5) %
                  HUMOR_LEVELS.length,
          ) % HUMOR_LEVELS.length
        : 0;
    const humorLevel = isQ('humor') && session.round >= 3 ? HUMOR_LEVELS[humorIdx] : undefined;

    // P2.21: Status & Power Dynamics — assign status based on agent role
    // and debate progress. Pro/con sides rotate status each round.
    const STATUS_BADGES = [
        'High Authority — an established expert whose words carry weight',
        'Equal Peer — a respected colleague with balanced standing',
        'Challenger — an upstart questioning the established order',
        'Neutral Observer — an impartial analyst with no stake in the outcome',
    ];
    const statusIdx = isQ('status-dynamics')
        ? Math.abs((participant.agentId.charCodeAt(2) * 3 + session.round) % STATUS_BADGES.length) %
          STATUS_BADGES.length
        : 0;
    const statusBadge = isQ('status-dynamics') ? STATUS_BADGES[statusIdx] : undefined;

    // P2.22: Linguistic Style Matching — pick an agent to mirror style
    const styleTarget = isQ('style-matching')
        ? (() => {
              if (session.round < 2) return undefined;
              const others = allDebateParticipants.filter((p) => p.id !== participant.agentId);
              if (others.length === 0) return undefined;
              const idx = Math.abs(
                  (participant.agentId.length + session.round * 11) % others.length,
              );
              return others[idx % others.length]!.name;
          })()
        : undefined;

    // P2.1: Dynamic Persona Selection — match persona to topic
    let personaText: string | undefined;
    if (isQ('dynamic-persona') && session.round >= 1) {
        try {
            const { PersonaSelector } = await import('./persona-selector');
            const selector = new PersonaSelector();
            const usedVariants: string[] = [];
            personaText = selector.selectForTopic(
                participant.agentId,
                participant.role || 'neutral',
                session.topic,
                session.round,
                usedVariants,
                session.language,
            );
        } catch {
            LOGGER.warn('DebateLlmCaller', 'PersonaSelector error', { sessionId });
        }
    }

    // P2.18: Whisper Channels — private coordination with allied agent
    let whisperText: string | undefined;
    if (isQ('whisper-channels') && session.round >= 2 && allDebateParticipants.length >= 3) {
        const allies = allDebateParticipants.filter(
            (p) => p.id !== participant.agentId && p.role === participant.role,
        );
        if (allies.length > 0) {
            const allyIdx = Math.abs(
                (participant.agentId.charCodeAt(1) + session.round) % allies.length,
            );
            const ally = allies[allyIdx % allies.length]!;
            whisperText = `Your ally ${ally.name} shares your position and is preparing to reinforce your arguments. Coordinate your approach: let them handle the evidentiary support while you focus on the principled case. Trust their judgment on factual matters.`;
        }
    }

    // P2.15: Dynamic Alliance & Coalition — formal alliance formation
    let allianceText: string | undefined;
    if (isQ('alliance') && session.round >= 3 && allDebateParticipants.length >= 4) {
        const allies = allDebateParticipants.filter(
            (p) => p.id !== participant.agentId && p.role === participant.role,
        );
        const opponents = allDebateParticipants.filter(
            (p) =>
                p.id !== participant.agentId && p.role !== participant.role && p.role !== 'neutral',
        );
        if (allies.length > 0) {
            const allyNames = allies.map((a) => a.name).join(', ');
            const oppNames =
                opponents.length > 0
                    ? opponents.map((o) => o.name).join(', ')
                    : 'the opposing side';
            allianceText = `You are allied with: ${allyNames}. Your opponents are: ${oppNames}. Support your allies' arguments, build on their points, and defend them against opposition attacks. A coordinated coalition is stronger than isolated voices.`;
        }
    }

    // P2.19: Internal Prediction Market — predict debate trajectory
    let predictionText: string | undefined;
    if (isQ('prediction-market') && session.round >= 2) {
        const proCount = previousArguments.filter((a) => a.role === 'pro').length;
        const conCount = previousArguments.filter((a) => a.role === 'con').length;
        const proTokens = previousArguments
            .filter((a) => a.role === 'pro')
            .reduce((s, a) => s + a.content.length, 0);
        const conTokens = previousArguments
            .filter((a) => a.role === 'con')
            .reduce((s, a) => s + a.content.length, 0);
        const totalArgs = proCount + conCount || 1;
        const proRatio = proCount / totalArgs;
        const predictionPrompt =
            proRatio > 0.6
                ? `Current trend favors PRO (${Math.round(proRatio * 100)}% of arguments). Which side will be winning by round ${session.round + 2}?`
                : conCount > proCount
                  ? `Current trend favors CON (${Math.round((1 - proRatio) * 100)}% of arguments). Will this momentum continue?`
                  : 'The debate is evenly balanced. Which side will break the deadlock?';
        const engagement = `Total argument volume: ${Math.round((proTokens + conTokens) / 1000)}K characters so far.`;
        predictionText = `${predictionPrompt} ${engagement} Reflect briefly on the trajectory before making your argument.`;
    }

    // P2.5: Theory of Mind — compute agent belief context
    let rtomText: string | undefined;
    if (isQ('rtom') && session.round >= 2) {
        try {
            if (!sessionRToMMap.has(sessionId)) {
                const { RToMGraphService } = await import('./debate-rtom-service');
                sessionRToMMap.set(sessionId, new RToMGraphService());
            }
            const rtom = sessionRToMMap.get(sessionId)!;
            rtomText = rtom.getToMContext(
                participant.agentId,
                currentName,
                session.round,
                session.language,
            );
        } catch {
            LOGGER.warn('DebateLlmCaller', 'RToM context error', { sessionId });
        }
    }

    // P2.7: Strategy Fingerprinting — detect opponent patterns
    let fingerprintText: string | undefined;
    if (isQ('strategy-fingerprint') && session.round >= 2 && previousArguments.length >= 4) {
        try {
            if (!sessionFingerprintMap.has(sessionId)) {
                const { StrategyFingerprintService } =
                    await import('./debate-strategy-fingerprint');
                sessionFingerprintMap.set(sessionId, new StrategyFingerprintService());
            }
            const fp = sessionFingerprintMap.get(sessionId)!;
            const inferences = fp.analyzeOpponent(
                participant.agentId,
                currentName,
                previousArguments,
                allDebateParticipants,
            );
            fingerprintText = fp.getFingerprintPrompt(
                participant.agentId,
                inferences,
                session.language,
            );
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Fingerprint analysis error', { sessionId });
        }
    }

    // P0.16: Causal Loop Mapping — detect linear thinking, force systemic reasoning
    let causalText: string | undefined;
    if (isQ('causal-graph') && session.round >= 1) {
        try {
            if (!sessionCausalGraphMap.has(sessionId)) {
                const { CausalGraphBuilder } = await import('./causal-graph-builder');
                sessionCausalGraphMap.set(sessionId, new CausalGraphBuilder());
            }
            const cg = sessionCausalGraphMap.get(sessionId)!;
            // Ingest previous arguments into the causal graph
            for (const prev of previousArguments) {
                cg.ingestClaim(sessionId, participant.agentId, prev.content, session.round);
            }
            causalText = cg.getCausalContext(
                sessionId,
                participant.agentId,
                allDebateParticipants.map((p) => p.id),
                session.round,
                session.language,
            );
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Causal graph analysis error', {
                sessionId,
            });
        }
    }

    // P2.9: Dynamic Demographic Audience — compute audience reaction context
    let audienceReactionText: string | undefined;
    if (isQ('audience') && session.round >= 2 && previousArguments.length >= 3) {
        const lastArgs = previousArguments.slice(-6);
        let proStrength = 0;
        let conStrength = 0;
        let laughs = 0;
        let applauses = 0;
        for (const a of lastArgs) {
            const lower = a.content.toLowerCase();
            const hasEvidence = /\b(study|research|data|evidence|according to|statistics?)\b/.test(
                lower,
            );
            if (hasEvidence) {
                if (a.role === 'pro') proStrength += 2;
                else conStrength += 2;
                applauses++;
            }
            const isWeak = /\b(maybe|perhaps|i think|not sure|possibly|might be wrong)\b/.test(
                lower,
            );
            if (isWeak) {
                if (a.role === 'pro') proStrength -= 1;
                else conStrength -= 1;
            }
            const isWitty = /\b(funny|humor|joke|ridiculous|absurd|laugh)\b/.test(lower);
            if (isWitty) laughs++;
            const isAggressive = /\b(attack|destroy|stupid|idiot|wrong|nonsense)\b/.test(lower);
            if (isAggressive) {
                if (a.role === 'pro') proStrength -= 0.5;
                else conStrength -= 0.5;
            }
        }
        const total = proStrength + conStrength;
        const audienceMood =
            laughs > applauses && laughs > 2
                ? 'The audience is amused — laughter has been heard. The tone is light but attention is wavering.'
                : applauses > laughs && applauses > 2
                  ? 'Some applause has been heard — the audience appreciates well-supported arguments.'
                  : 'The audience is quiet and attentive, waiting for convincing arguments.';
        const momentum =
            total > 0
                ? `The PRO side seems to have slightly more momentum (audience energy score: +${Math.round(Math.abs(total))}).`
                : total < 0
                  ? `The CON side seems to have slightly more momentum (audience energy score: +${Math.round(Math.abs(total))}).`
                  : 'Both sides are evenly matched in audience perception.';
        audienceReactionText = `${audienceMood} ${momentum}`;
    }

    // P2.3: Strategist — adaptive strategic planning
    let strategistText: string | undefined;
    if (isQ('strategist') && session.round >= 1) {
        try {
            const { Strategist } = await import('./debate-strategist');
            const strategist = new Strategist();
            const plan = strategist.plan(
                participant.agentId,
                participant.role || 'neutral',
                session.round,
                previousArguments.map((a) => ({
                    agentId: a.agentId,
                    agentName: a.agentName,
                    content: a.content,
                    round: a.round,
                })),
                session.language,
            );
            if (plan) {
                strategistText = plan.instruction;
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'Strategist error', { sessionId });
        }
    }

    // P0.17: Hidden Incentives Mining — detect conflicts of interest
    let hiddenIncentivesText: string | undefined;
    if (isQ('hidden-incentives') && deps.incentiveDetector && previousArguments.length > 0) {
        try {
            const lastArg = previousArguments[previousArguments.length - 1]!;
            const analysis = deps.incentiveDetector.analyze(
                lastArg.agentId,
                lastArg.agentName,
                lastArg.content,
                session.topic,
            );
            if (analysis && analysis.conflictOfInterest) {
                hiddenIncentivesText = analysis.disclosurePrompt;
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'IncentiveDetector error', { sessionId });
        }
    }

    // P1.28: Graph-of-Thoughts Deliberation — multi-branch reasoning
    let gotText: string | undefined;
    if (isQ('graph-of-thoughts') && deps.gotDeliberation && session.round > 1) {
        try {
            const opposing = previousArguments
                .filter((a) => a.agentId !== participant.agentId)
                .slice(-3)
                .map((a) => a.content);
            const gotResult = await deps.gotDeliberation.deliberate(
                session.topic,
                participant.role || 'neutral',
                opposing,
            );
            if (gotResult && gotResult.branches.length > 0) {
                gotText = gotResult.branches
                    .map((b, i) => `Branch ${i + 1} (${b.type}): ${b.premise.slice(0, 120)}...`)
                    .join('\n');
                gotText += `\n→ Selected: ${gotResult.selectedType} (diversity: ${Math.round(gotResult.diversityScore * 100)}%)`;
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'GoT deliberation error', { sessionId });
        }
    }

    // P1.29: Semantic Concept Blending — detect deadlock, generate blends
    let blendingText: string | undefined;
    if (
        isQ('semantic-blending') &&
        deps.conceptBlender &&
        session.round >= 4 &&
        previousArguments.length >= 6
    ) {
        try {
            const deadlock = deps.conceptBlender.detectDeadlock(
                participant.agentId,
                currentName,
                previousArguments,
                session.round,
            );
            if (deadlock && deadlock.present) {
                const blend = deps.conceptBlender.generateBlend(
                    deadlock,
                    session.topic,
                    session.language,
                );
                if (blend && blend.bestBlendText) {
                    blendingText = blend.bestBlendText;
                }
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'ConceptBlender error', { sessionId });
        }
    }

    // P1.30: Outcome Forecaster — predict judge score impact
    let forecasterText: string | undefined;
    if (isQ('outcome-forecaster') && deps.outcomeForecaster && session.round > 1) {
        try {
            const opponentStrengths = previousArguments
                .filter((a) => a.agentId !== participant.agentId)
                .slice(-5)
                .map((a) => a.content.slice(0, 100));
            const forecast = deps.outcomeForecaster.forecast(
                [],
                participant.role || 'neutral',
                opponentStrengths,
                session.topic,
                session.language,
            );
            if (forecast && forecast.variants.length > 0) {
                forecasterText = `Recommended angle: ${forecast.recommendedLabel}\nExpected gain: +${(forecast.expectedScoreGain * 100).toFixed(0)}%\nApproach: ${forecast.recommendedAngle}`;
            }
        } catch {
            LOGGER.warn('DebateLlmCaller', 'OutcomeForecaster error', { sessionId });
        }
    }

    // Use the rich prompt builder instead of the simple inline prompt
    let systemContent = buildArgumentPrompt(
        {
            id: participant.agentId,
            name: currentName,
            role: (participant.role || 'neutral') as DebateParticipant['role'],
            systemPrompt:
                (participant.systemPrompt || '').replace(/<[^>]*>/g, '').slice(0, 800) || undefined,
        },
        session.round,
        previousArguments,
        session.topic,
        undefined,
        undefined,
        allDebateParticipants,
        undefined,
        undefined,
        session.language,
        entanglementConstraint,
        anchors,
        vulnerabilityTargets,
        adversarialWarnings,
        beliefConflicts,
        minimaxMove,
        tacticalDirective,
        steelmanTarget,
        unmetBurdens,
        consistencyContradictions,
        sourceCredibilityScores,
        redundancyScore,
        driftScore,
        insightText,
        replayText,
        enthymemeText,
        biasExploitText,
        interruptText,
        stakeholderText,
        calibrationText,
        factCheckText,
        personaMixText,
        frameText,
        expertText,
        driftText,
        rhetoricalText,
        scratchpadText,
        narrativeText,
        levelText,
        reversalText,
        fogOfWarScope,
        evidenceRevelationRound,
        humorLevel,
        statusBadge,
        styleTarget,
        personaText,
        strategistText,
        whisperText,
        audienceReactionText,
        allianceText,
        predictionText,
        rtomText,
        fingerprintText,
        causalText,
        hiddenIncentivesText,
        gotText,
        blendingText,
        forecasterText,
        session.qualitySettings,
    );

    // Append persona memory block (from past debates — adds 3+ step history)
    if (mem.getAgentSteps(participant.agentId).length >= 3) {
        const personaBlock = buildPersonaMemory(mem, participant.agentId);
        if (personaBlock) systemContent += personaBlock;
    }

    // RAG: inject relevant memory from past debates
    if (deps.ragRetriever) {
        try {
            systemContent = await deps.ragRetriever.injectMemoryIntoDebate(
                sessionId,
                session.topic,
                systemContent,
            );
        } catch {
            LOGGER.warn('DebateEngine', 'RAG memory injection failed', {
                sessionId,
                agentId: participant.agentId,
            });
        }
    }

    return { systemContent, entanglementConstraint };
}
