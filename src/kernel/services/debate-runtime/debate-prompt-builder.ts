import type {
    DebateParticipant,
    DebateArgument,
    DebateConstraint,
} from '../../contracts/debate-types';
import type { EntanglementConstraint, AnchorClaim } from '../../contracts/debate-entanglement';
import type { VulnerabilityTarget } from '../../contracts/debate-vulnerability';
import type { SourceVerificationResult } from '../../contracts/debate-adversarial-source';
import type { BeliefConflict } from '../../contracts/debate-belief-mining';
import type { MinimaxMove } from '../../contracts/debate-minimax';
import type { TacticalDirective } from '../../contracts/debate-meta-agent';
import type { SteelmanTarget } from '../../contracts/debate-steelman';
import type { UnmetBurden } from '../../contracts/debate-bop';
import type { Contradiction } from '../../contracts/debate-consistency';
import type { SourceCredibility } from '../../contracts/debate-credibility';
import { buildDebateState, buildDebateStatePrompt } from './debate-state-builder';

// ── Re-exports for external consumers (prompt-audit-service, index.ts) ──
export {
    ARGUMENT_STRATEGY_INSTRUCTIONS,
    CONSTRAINT_PROMPTS,
    DEFAULT_LANGUAGE,
    UNIQUE_ANGLES,
} from './debate-prompt-constants';
export {
    buildTemperaturePrompt,
    buildPrePublishCriticPrompt,
    buildSocraticPivotPrompt,
    buildConcessionPrompt,
    buildCounterfactualPrompt,
    buildHegelianSynthesisPrompt,
    buildShadowOpponentPrompt,
    buildEmpathyMirrorPrompt,
    buildEpistemicHumilityPrompt,
    buildHeatAdaptivePrompt,
    buildFallacySentinelPrompt,
    buildCredibilityPrompt,
    buildObjectionAnticipationPrompt,
    buildTriangulationPrompt,
    buildDriftCorrectionPrompt,
    buildRedundancyWarningPrompt,
    buildCrossExaminationPrompt,
    buildDeltaFocusingPrompt,
    buildCriticPrompt,
    buildDpoSamplerPrompt,
    buildUncertaintyPropagationPrompt,
    buildRhetoricSafetyPrompt,
    buildBiddingTimePrompt,
    buildAdaptiveOrderPrompt,
    buildBlindEvaluationPrompt,
    buildPivotStrategyPrompt,
    buildSynthesisPrompt,
    buildExecutableEvidencePrompt,
    buildHiddenIncentivesPrompt,
    buildGoTPrompt,
    buildBlendingPrompt,
    buildForecasterPrompt,
    buildBestOfNPrompt,
} from './debate-prompt-quality-gates';
export {
    buildEntanglementConstraintPrompt,
    buildBeliefConflictsPrompt,
    buildSteelmanPrompt,
    buildBurdenOfProofPrompt,
    buildConsistencyWarning,
    buildVulnerabilityTargetingPrompt,
    buildAnchorsPrompt,
    buildMinimaxStrategicPrompt,
} from './debate-prompt-strategic';

// ── Imports from extracted modules (used inside buildArgumentPrompt/buildOpeningPrompt) ──
import {
    DEFAULT_LANGUAGE,
    stableSelectIndex,
    sanitizeForPrompt,
    ARGUMENT_STRATEGY_INSTRUCTIONS,
    CONSTRAINT_PROMPTS,
    UNIQUE_ANGLES,
} from './debate-prompt-constants';
import {
    buildTemperaturePrompt,
    buildPrePublishCriticPrompt,
    buildSocraticPivotPrompt,
    buildConcessionPrompt,
    buildCounterfactualPrompt,
    buildHegelianSynthesisPrompt,
    buildShadowOpponentPrompt,
    buildEmpathyMirrorPrompt,
    buildEpistemicHumilityPrompt,
    buildHeatAdaptivePrompt,
    buildFallacySentinelPrompt,
    buildCredibilityPrompt,
    buildObjectionAnticipationPrompt,
    buildTriangulationPrompt,
    buildDriftCorrectionPrompt,
    buildRedundancyWarningPrompt,
    buildCrossExaminationPrompt,
    buildDeltaFocusingPrompt,
    buildCriticPrompt,
    buildDpoSamplerPrompt,
    buildUncertaintyPropagationPrompt,
    buildRhetoricSafetyPrompt,
    buildBiddingTimePrompt,
    buildAdaptiveOrderPrompt,
    buildBlindEvaluationPrompt,
    buildPivotStrategyPrompt,
    buildSynthesisPrompt,
    buildExecutableEvidencePrompt,
    buildHiddenIncentivesPrompt,
    buildGoTPrompt,
    buildBlendingPrompt,
    buildForecasterPrompt,
    buildBestOfNPrompt,
} from './debate-prompt-quality-gates';
import {
    buildEntanglementConstraintPrompt,
    buildBeliefConflictsPrompt,
    buildSteelmanPrompt,
    buildBurdenOfProofPrompt,
    buildConsistencyWarning,
    buildVulnerabilityTargetingPrompt,
    buildAnchorsPrompt,
    buildMinimaxStrategicPrompt,
} from './debate-prompt-strategic';

// ── Small inline builders (tightly coupled to buildArgumentPrompt) ──

/** P1.25: Enthymeme attack prompt — injects hidden premise targets. */
function buildEnthymemePrompt(enthymemeText: string, _language = DEFAULT_LANGUAGE): string {
    return `\n\n### Hidden Premises to Attack\n${enthymemeText}`;
}

/** P1.23: Multi-hop justification requirement. */
function buildMultiHopPrompt(_language = DEFAULT_LANGUAGE): string {
    return (
        '\n\n### Multi-Hop Justification Required\n' +
        'You MUST structure your argument with at least TWO linked steps:\n' +
        '1. CLAIM — state your position\n' +
        '2. WARRANT — explain WHY the claim holds\n' +
        '3. EVIDENCE — support with data, examples, or reasoning\n' +
        'Single-step assertions ("X is true because Y") without deeper backing will be penalized. ' +
        'Build a chain of reasoning, not a one-liner.'
    );
}

/** P1.18: Bias exploit prompt — injects opponent bias information. */
function buildBiasExploitPrompt(biasText: string, _language = DEFAULT_LANGUAGE): string {
    return `\n\n### Cognitive Bias Intelligence\n${biasText}`;
}

/** P1.17: Clarification request prompt — shows incoming micro-interrupts. */
function buildClarificationPrompt(interruptText: string, _language = DEFAULT_LANGUAGE): string {
    return `\n\n### Clarification Requests\n${interruptText}`;
}

/** P1.3: Calibration enforcement prompt — penalizes over/underconfidence. */
function buildCalibrationPrompt(calibrationText: string, _language = DEFAULT_LANGUAGE): string {
    return `\n\n### Confidence Calibration Enforcement\n${calibrationText}`;
}

function isQ(id: string, qualitySettings?: Record<string, boolean>): boolean {
    return qualitySettings?.[id] !== false;
}

export function buildOpeningPrompt(
    participant: DebateParticipant,
    topic: string,
    strategy: string | undefined,
    socraticQuestioner: number | undefined,
    participants: DebateParticipant[],
    debateTemperature: number | undefined,
    constraint: DebateConstraint | undefined,
    language = DEFAULT_LANGUAGE,
): string {
    const isSocratic = strategy === 'socratic';
    const isSocrates = isSocratic && socraticQuestioner === participants.indexOf(participant);

    const safeName = participant.name.replace(/[\n\r]/g, ' ').slice(0, 60);
    const roleContext = isSocrates
        ? `You are ${safeName} — SOCRATES. Your job is NOT to argue for or against the topic. Instead, ask probing, Socratic questions that expose contradictions, assumptions, and weaknesses in others' reasoning.`
        : participant.role === 'pro'
          ? `You are ${safeName}, arguing FOR this topic. Present your strongest supporting arguments.`
          : participant.role === 'con'
            ? `You are ${safeName}, arguing AGAINST this topic. Present your strongest opposing arguments.`
            : `You are ${safeName}, a neutral analyst. Provide balanced perspective.`;

    const openingStrategy = isSocratic
        ? 'Do not state your own position. Ask 2-3 incisive questions. Your goal is to make others think deeper.'
        : participant.role === 'pro'
          ? 'Focus on concrete evidence and logical reasoning. Your goal is to establish a strong foundation.'
          : participant.role === 'con'
            ? 'Focus on identifying weaknesses or gaps in the opposing position before it is even stated. Preemptively challenge likely arguments.'
            : 'Focus on establishing criteria for evaluating arguments. Define what counts as strong evidence.';

    const characterBlock = participant.systemPrompt
        ? `\n### Your Character\n${sanitizeForPrompt(participant.systemPrompt, 800)}`
        : '';

    const constraintBlock =
        constraint && constraint !== 'none' && strategy === 'constrained'
            ? `\n\n### Constraint (ABSOLUTE — YOU MUST FOLLOW THIS)\n${CONSTRAINT_PROMPTS[constraint]}`
            : '';

    const strategyBlock = participant.strategy
        ? `\n\n### Argument Strategy\n${ARGUMENT_STRATEGY_INSTRUCTIONS[participant.strategy]}`
        : '';

    const tempBlock =
        debateTemperature !== undefined ? buildTemperaturePrompt(debateTemperature) : '';

    return `## Topic: ${sanitizeForPrompt(topic)}

## Your Role
${roleContext}${characterBlock}${constraintBlock}${strategyBlock}${tempBlock}

### Strategy
${openingStrategy}

Provide a concise opening statement (100-150 words) that:
1. States your core position clearly
2. Gives 2-3 key supporting points
3. Anticipates potential counter-arguments

CRITICAL: Do NOT repeat or paraphrase arguments that other agents have already made. Contribute a UNIQUE perspective from your specific expertise.

Be direct and persuasive. This is the opening round - make it count. Respond in ${language}.`;
}

export function buildArgumentPrompt(
    participant: DebateParticipant,
    round: number,
    previousArguments: DebateArgument[],
    topic: string,
    strategy: string | undefined,
    socraticQuestioner: number | undefined,
    participants: DebateParticipant[],
    debateTemperature: number | undefined,
    constraint: DebateConstraint | undefined,
    language = DEFAULT_LANGUAGE,
    entanglementConstraint?: EntanglementConstraint | null,
    anchors?: AnchorClaim[],
    vulnerabilityTargets?: VulnerabilityTarget[],
    adversarialWarnings?: SourceVerificationResult[],
    beliefConflicts?: BeliefConflict[],
    minimaxMove?: MinimaxMove | null,
    tacticalDirective?: TacticalDirective | null,
    steelmanTarget?: SteelmanTarget | null,
    unmetBurdens?: UnmetBurden[],
    consistencyContradictions?: Contradiction[],
    sourceCredibilityScores?: SourceCredibility[],
    redundancyScore?: number,
    driftScore?: number,
    insightText?: string,
    replayText?: string,
    enthymemeText?: string,
    biasExploitText?: string,
    interruptText?: string,
    stakeholderText?: string,
    calibrationText?: string,
    factCheckText?: string,
    personaMixText?: string,
    frameText?: string,
    expertText?: string,
    driftText?: string,
    rhetoricalText?: string,
    scratchpadText?: string,
    narrativeText?: string,
    levelText?: string,
    reversalText?: string,
    fogOfWarScope?: string,
    evidenceRevelationRound?: number,
    humorLevel?: string,
    statusBadge?: string,
    styleTarget?: string,
    personaText?: string,
    strategistText?: string,
    whisperText?: string,
    audienceReactionText?: string,
    allianceText?: string,
    predictionText?: string,
    rtomText?: string,
    fingerprintText?: string,
    causalText?: string,
    hiddenIncentivesText?: string,
    gotText?: string,
    blendingText?: string,
    forecasterText?: string,
    qualitySettings?: Record<string, boolean>,
): string {
    const isSocratic = strategy === 'socratic';
    const isArgumentTree = strategy === 'argument_tree';
    const isConstrained = strategy === 'constrained';

    const isSocrates = isSocratic && socraticQuestioner === participants.indexOf(participant);

    const roleContext = isSocrates
        ? 'You are SOCRATES. Ask probing questions. Do NOT make arguments — expose contradictions.'
        : participant.role === 'pro'
          ? 'You argue FOR the topic.'
          : participant.role === 'con'
            ? 'You argue AGAINST the topic.'
            : 'You provide neutral analysis.';

    let treePrompt = '';
    if (isArgumentTree && round > 1) {
        const prevRoots = previousArguments.filter((a) => a.round === round - 1);
        if (prevRoots.length > 0) {
            const target =
                prevRoots[stableSelectIndex(`${participant.id}-round-${round}`, prevRoots.length)];
            treePrompt = `\n\n### Argument Tree Context\nYou are responding to this argument from the previous round:\n"${target!.content.slice(0, 300)}"\n\nYou can SUPPORT it (add evidence, strengthen), CHALLENGE it (find flaws, counter-argue), or REFINE it (clarify, qualify). End your response with "[parent:${target!.id}]" to link to the argument you are building on.`;
        } else {
            treePrompt =
                '\n\n### Argument Tree Context\nThis is the first round. State your main argument — this will be a root node in the argument tree.';
        }
    }

    const state = buildDebateState(previousArguments, participant.id);
    const statePrompt = buildDebateStatePrompt(state, participant.name, round, language);

    const constraintBlock =
        isConstrained && constraint && constraint !== 'none'
            ? `\n\n### Constraint (ABSOLUTE — YOU MUST FOLLOW THIS)\n${CONSTRAINT_PROMPTS[constraint]}`
            : '';

    const strategyBlock = participant.strategy
        ? `\n\n### Argument Strategy\n${ARGUMENT_STRATEGY_INSTRUCTIONS[participant.strategy]}`
        : '';

    // Assign a rotating unique angle based on agent position so each participant
    // approaches the topic from a distinct analytical lens — prevents all agents
    // on the same provider/model from producing near-identical content.
    const agentIndex = participants.indexOf(participant);
    const uniqueAngle =
        agentIndex >= 0 ? UNIQUE_ANGLES[agentIndex % UNIQUE_ANGLES.length] : UNIQUE_ANGLES[0];
    const angleBlock = `\n\n### Your Unique Lens\n${uniqueAngle}\n\nYour job is to apply THIS lens to the debate. Other participants have different lenses. Do NOT borrow their lens — stay in your assigned lane.`;

    const socraticBlock = isSocratic
        ? isSocrates
            ? '\n\n### Socratic Mode\nAsk a deep, probing question based on what others have said. Challenge assumptions. Do NOT agree or disagree — question.'
            : '\n\n### Socratic Mode\nAnswer Socrates\' question directly and honestly. Do not evade. Your goal is to clarify your reasoning, not to "win" the argument.'
        : '';

    const tempBlock =
        debateTemperature !== undefined ? buildTemperaturePrompt(debateTemperature) : '';

    const entanglementBlock = entanglementConstraint
        ? buildEntanglementConstraintPrompt(entanglementConstraint, language)
        : '';

    const anchorsBlock = anchors && anchors.length > 0 ? buildAnchorsPrompt(anchors, language) : '';

    const vulnerabilityBlock =
        vulnerabilityTargets && vulnerabilityTargets.length > 0
            ? buildVulnerabilityTargetingPrompt(vulnerabilityTargets, language)
            : '';

    const adversarialBlock =
        adversarialWarnings && adversarialWarnings.length > 0
            ? `\n\n### Source Verification Warnings\n${adversarialWarnings.map((w) => w.warning).join('\n\n')}`
            : '';

    const beliefConflictsBlock =
        beliefConflicts && beliefConflicts.length > 0
            ? buildBeliefConflictsPrompt(beliefConflicts, language)
            : '';

    const minimaxBlock = minimaxMove ? buildMinimaxStrategicPrompt(minimaxMove, language) : '';

    const tacticalBlock = tacticalDirective
        ? `\n\n### 🧠 Tactical Directive (Round ${round})\n${tacticalDirective.instruction}`
        : '';
    const steelmanBlock = steelmanTarget ? buildSteelmanPrompt(steelmanTarget, language) : '';

    const bopBlock =
        unmetBurdens && unmetBurdens.length > 0
            ? buildBurdenOfProofPrompt(unmetBurdens, language)
            : '';

    const consistencyBlock =
        consistencyContradictions && consistencyContradictions.length > 0
            ? buildConsistencyWarning(consistencyContradictions, language)
            : '';

    const credibilityBlock =
        sourceCredibilityScores && sourceCredibilityScores.length > 0
            ? buildCredibilityPrompt(sourceCredibilityScores, language)
            : '';

    // ── P0 internal blocks (gated by qualitySettings) ─────────────────

    const crossExBlock =
        isQ('cross-examination', qualitySettings) && round > 1
            ? buildCrossExaminationPrompt(language)
            : '';

    const deltaBlock =
        isQ('delta-focusing', qualitySettings) && round > 1
            ? buildDeltaFocusingPrompt(language)
            : '';

    const objectionBlock =
        isQ('objection-anticipation', qualitySettings) && round > 1
            ? buildObjectionAnticipationPrompt(language)
            : '';

    const triangulationBlock =
        (isQ('evidence-triangulation', qualitySettings) || isQ('triangulation', qualitySettings)) &&
        round > 2
            ? buildTriangulationPrompt(language)
            : '';

    const shadowBlock =
        isQ('shadow-opponent', qualitySettings) && round > 1
            ? buildShadowOpponentPrompt(language)
            : '';

    // ── P1 internal blocks (gated by qualitySettings) ─────────────────

    const criticBlock =
        isQ('pre-publish-critic', qualitySettings) && round > 1
            ? buildPrePublishCriticPrompt(language)
            : '';

    const criticSelfBlock =
        isQ('critic', qualitySettings) && round > 1 ? buildCriticPrompt(language) : '';

    const socraticPivotBlock =
        isQ('socratic-pivot', qualitySettings) && round > 3
            ? buildSocraticPivotPrompt(language)
            : '';

    const changePivotBlock =
        isQ('pivot', qualitySettings) && round >= 3 ? buildPivotStrategyPrompt(language) : '';

    const synthesizeBlock =
        isQ('synthesis', qualitySettings) && round >= 4 ? buildSynthesisPrompt(language) : '';

    const concessionBlock = isQ('concession', qualitySettings)
        ? buildConcessionPrompt(language)
        : '';

    const concessionEngineBlock = isQ('concession-engine', qualitySettings)
        ? buildConcessionPrompt(language)
        : '';

    const counterfactualBlock =
        isQ('counterfactual', qualitySettings) && round >= 3
            ? buildCounterfactualPrompt(language)
            : '';

    const synthesisBlock =
        isQ('hegelian-synthesis', qualitySettings) && round >= 5
            ? buildHegelianSynthesisPrompt(language)
            : '';

    const empathyBlock =
        isQ('empathy', qualitySettings) && round > 1 ? buildEmpathyMirrorPrompt(language) : '';

    const humilityBlock =
        isQ('humility-scoring', qualitySettings) && round > 1
            ? buildEpistemicHumilityPrompt(language)
            : '';

    const heatLevel = Math.min(1, round / 8);
    const heatBlock = isQ('heat', qualitySettings)
        ? buildHeatAdaptivePrompt(heatLevel, language)
        : '';

    const sentinelBlock =
        isQ('sentinel', qualitySettings) && round > 1
            ? buildFallacySentinelPrompt(topic, language)
            : '';

    const multiHopBlock =
        isQ('multi-hop', qualitySettings) && round > 1 ? buildMultiHopPrompt(language) : '';

    const dpoBlock =
        isQ('dpo-sampler', qualitySettings) && round > 1 ? buildDpoSamplerPrompt(language) : '';

    const uncertaintyBlock =
        isQ('uncertainty-propagation', qualitySettings) && round >= 2
            ? buildUncertaintyPropagationPrompt(language)
            : '';

    // ── P2 internal blocks (gated by qualitySettings) ─────────────────

    const rhetoricBlock = isQ('rhetoric-safety', qualitySettings)
        ? buildRhetoricSafetyPrompt(language)
        : '';

    const biddingBlock = isQ('bidding-time', qualitySettings)
        ? buildBiddingTimePrompt(language)
        : '';

    const adaptiveBlock =
        isQ('adaptive-order', qualitySettings) && round >= 2
            ? buildAdaptiveOrderPrompt(language)
            : '';

    const blindBlock = isQ('blind-evaluation', qualitySettings)
        ? buildBlindEvaluationPrompt(language)
        : '';

    // ── Ungated blocks (passed as params from caller with isQ there) ──

    const redundancyBlock =
        redundancyScore !== undefined && redundancyScore >= 0.65
            ? buildRedundancyWarningPrompt(redundancyScore, language)
            : '';

    const driftBlock =
        driftScore !== undefined && driftScore >= 0.55
            ? buildDriftCorrectionPrompt(driftScore, language)
            : '';

    const insightBlock = insightText || '';
    const replayBlock = replayText || '';

    const enthymemeBlock = enthymemeText ? buildEnthymemePrompt(enthymemeText, language) : '';

    const biasBlock = biasExploitText ? buildBiasExploitPrompt(biasExploitText, language) : '';

    // P1.17: Clarification / micro-interrupt requests
    const interruptBlock = interruptText ? buildClarificationPrompt(interruptText, language) : '';

    // P1.24: Stakeholder impact — force multi-perspective analysis from round 2+
    const stakeholderBlock = stakeholderText ? `\n\n${stakeholderText}` : '';

    // P1.3: Calibration enforcement — penalize over/underconfidence
    const calibrationBlock = calibrationText
        ? buildCalibrationPrompt(calibrationText, language)
        : '';

    // P1.2: Fact-check warnings — flag opponent's questionable claims
    const factCheckBlock = factCheckText ? `\n\n### Fact-Check Warnings\n${factCheckText}` : '';

    // P1.9: Adaptive Persona Mixer — persona variation for this round
    const personaMixBlock = personaMixText ? `\n\n### Persona Approach\n${personaMixText}` : '';

    // P1.12: Framing Contests Engine — current debate frame
    const frameBlock = frameText ? `\n\n${frameText}` : '';

    // P1.14: Expert Witness — expert testimony block
    const expertBlock = expertText ? `\n\n${expertText}` : '';

    // P1.8: Stance drift call-out — alert agent to opponent's goalpost shift
    const driftCalloutBlock = driftText ? `\n\n${driftText}` : '';

    // P2.6: Rhetorical device instruction
    const rhetoricalBlock = rhetoricalText ? `\n\n${rhetoricalText}` : '';

    // P2.11: Hidden scratchpad — tactical analysis not visible to other agents
    const scratchpadBlock = scratchpadText ? `\n\n${scratchpadText}` : '';

    // P2.14: Narrative Arc — storytelling structure instruction
    const narrativeBlock = narrativeText ? `\n\n### Narrative Structure\n${narrativeText}` : '';

    // P2.20: Abstraction Ladder Switcher — adjust concrete/abstract balance
    const levelBlock = levelText ? `\n\n### Abstraction Level\n${levelText}` : '';

    // P2.23: Role-Reversal Exercise — forced perspective-taking
    const reversalBlock = reversalText ? `\n\n### Role-Reversal Exercise\n${reversalText}` : '';

    // P2.10: Fog of War — limits information available to this agent
    const fogBlock = fogOfWarScope
        ? `\n\n### Available Information\nYour information access is limited to: ${fogOfWarScope}\n\nYou do NOT have access to information outside this scope. Do not reference arguments or evidence that falls outside your assigned information boundary.`
        : '';

    // P2.16: Progressive Evidence Revelation — staged evidence release by round
    const evidenceBlock =
        evidenceRevelationRound !== undefined
            ? `\n\n### Evidence Available (Round ${evidenceRevelationRound})\nYou have been given access to the following evidence tier for this round. Use it to support your arguments, but do not fabricate evidence you have not been given.`
            : '';

    // P2.17: Humor & Wit Injector — humor level instruction
    const humorBlock = humorLevel
        ? `\n\n### Rhetorical Tone\nIncorporate ${humorLevel} into your argument where appropriate. Use wit, analogy, or irony — but never at the expense of logical rigor. The humor should illuminate, not distract.`
        : '';

    // P2.21: Status & Power Dynamics — social status assignment
    const statusBlock = statusBadge
        ? `\n\n### Social Context\nIn this debate, you hold the position of **${statusBadge}**. Other participants have different status levels. Your status influences how your arguments are received. Argue in a manner consistent with your position.`
        : '';

    // P2.22: Linguistic Style Matching — match opponent's style
    const styleBlock = styleTarget
        ? `\n\n### Communication Style\nAdapt your communication style to match that of ${styleTarget}. Mirror their tone, formality level, and rhetorical patterns. This builds rapport and makes your arguments more persuasive to aligned participants.`
        : '';

    // P2.1: Dynamic Persona Selection — topic-matched persona variant
    const personaBlock = personaText ? `\n\n${personaText}` : '';

    // P2.3: Strategist — adaptive strategic directive
    const strategistBlock = strategistText ? `\n\n### Strategic Directive\n${strategistText}` : '';

    // P2.18: Private Caucus / Whisper Channels — private coordination signal
    const whisperBlock = whisperText
        ? `\n\n### 🔒 Private Whisper\n${whisperText}\n\nThis is a PRIVATE message visible only to you. Do not reveal that you received it. Use this intelligence to inform your arguments.`
        : '';

    // P2.9: Dynamic Demographic Audience — audience reaction awareness
    const audienceBlock = audienceReactionText
        ? `\n\n### Audience Sentiment\n${audienceReactionText}\n\nConsider how the audience is reacting. If they seem to favor a particular side, you may need to work harder to win them over. If they are laughing or cheering, the momentum may be shifting. Do not ignore the room.`
        : '';

    // P2.15: Dynamic Alliance & Coalition — formal alliance context
    const allianceBlock = allianceText
        ? `\n\n### Coalition Status\n${allianceText}\n\nCoordinate with your allies. Reference their arguments, build on their points, and defend them against attacks. A united front is stronger than isolated voices.`
        : '';

    // P2.19: Internal Prediction Market — agents predict debate trajectory
    const predictionBlock = predictionText
        ? `\n\n### Prediction Market\n${predictionText}\n\nYour prediction affects your standing. If you correctly anticipate how the debate unfolds, your credibility increases. If you are consistently wrong, your influence diminishes. Think carefully before making your prediction.`
        : '';

    // P2.5: Theory of Mind — agent beliefs about other agents' positions
    const rtomBlock = rtomText ? `\n\n${rtomText}` : '';

    // P2.7: Strategy Fingerprinting — opponent strategy analysis
    const fingerprintBlock = fingerprintText ? `\n\n${fingerprintText}` : '';

    // P0.16: Causal Loop Mapping — systems thinking enforcement
    const causalBlock = causalText
        ? `\n\n### Systems Thinking — Causal Loop Mapping\n${causalText}`
        : '';

    // P0.15: Executable Evidence — write code to numerically verify claims
    const executableEvidenceBlock =
        isQ('executable-evidence', qualitySettings) && round > 1
            ? buildExecutableEvidencePrompt(language)
            : '';

    // P0.17: Hidden Incentives Mining — conflict of interest analysis
    const hiddenIncentivesBlock =
        isQ('hidden-incentives', qualitySettings) && round > 1 && hiddenIncentivesText
            ? buildHiddenIncentivesPrompt(hiddenIncentivesText, language)
            : '';

    // P1.28: Graph-of-Thoughts Deliberation — multi-branch reasoning
    const gotBlock =
        isQ('graph-of-thoughts', qualitySettings) && round > 1 && gotText
            ? buildGoTPrompt(gotText, language)
            : '';

    // P1.29: Semantic Concept Blending — new frameworks from deadlock
    const blendingBlock =
        isQ('semantic-blending', qualitySettings) && round >= 4 && blendingText
            ? buildBlendingPrompt(blendingText, language)
            : '';

    // P1.30: Outcome Forecaster — predicted judge score impact
    const forecasterBlock =
        isQ('outcome-forecaster', qualitySettings) && round > 1 && forecasterText
            ? buildForecasterPrompt(forecasterText, language)
            : '';

    // P2.4: Best-of-N Selection — variant chosen by best-of-N
    const bestOfNBlock =
        isQ('best-of-n', qualitySettings) && round > 1 ? buildBestOfNPrompt(language) : '';

    return `## Topic: ${sanitizeForPrompt(topic)}
${roleContext}${constraintBlock}${socraticBlock}${treePrompt}${strategyBlock}${angleBlock}${tempBlock}${entanglementBlock}${anchorsBlock}${vulnerabilityBlock}${adversarialBlock}${beliefConflictsBlock}${minimaxBlock}${tacticalBlock}${steelmanBlock}${bopBlock}${consistencyBlock}${credibilityBlock}${crossExBlock}${deltaBlock}${objectionBlock}${triangulationBlock}${criticBlock}${criticSelfBlock}${socraticPivotBlock}${changePivotBlock}${synthesizeBlock}${concessionBlock}${concessionEngineBlock}${counterfactualBlock}${synthesisBlock}${shadowBlock}${empathyBlock}${humilityBlock}${heatBlock}${sentinelBlock}${redundancyBlock}${driftBlock}${insightBlock}${replayBlock}${enthymemeBlock}${multiHopBlock}${dpoBlock}${uncertaintyBlock}${biasBlock}${interruptBlock}${stakeholderBlock}${calibrationBlock}${factCheckBlock}${personaMixBlock}${frameBlock}${expertBlock}${driftCalloutBlock}${rhetoricalBlock}${rhetoricBlock}${biddingBlock}${scratchpadBlock}${narrativeBlock}${levelBlock}${reversalBlock}${fogBlock}${evidenceBlock}${humorBlock}${statusBlock}${styleBlock}${adaptiveBlock}${personaBlock}${strategistBlock}${whisperBlock}${audienceBlock}${allianceBlock}${predictionBlock}${rtomBlock}${blindBlock}${fingerprintBlock}${causalBlock}${executableEvidenceBlock}${hiddenIncentivesBlock}${gotBlock}${blendingBlock}${forecasterBlock}${bestOfNBlock}

${statePrompt}

${participant.systemPrompt ? `\n### Your Character:\n${sanitizeForPrompt(participant.systemPrompt, 800)}` : ''}

CRITICAL RULE: Do NOT repeat or paraphrase arguments that other agents have already made. You must contribute a UNIQUE perspective from your specific area of expertise. If a point has already been covered, acknowledge it and ADD new reasoning or evidence that has not been mentioned before.

Respond in ${language}.`;
}

export function getDefaultSystemPrompt(
    role: 'pro' | 'con' | 'neutral',
    language = DEFAULT_LANGUAGE,
): string {
    if (role === 'pro') {
        return `You are a skilled debater arguing in favor of the given position.
- Present clear, logical arguments
- Use evidence and examples where possible
- Acknowledge valid counter-points briefly, then rebut them
- Stay focused on winning your case
- Respond in ${language}.`;
    }

    if (role === 'con') {
        return `You are a skilled debater arguing against the given position.
- Identify weaknesses in the opposing arguments
- Present alternative perspectives
- Highlight potential risks or downsides
- Stay focused on undermining the opposing case
- Respond in ${language}.`;
    }

    return `You are a neutral moderator and analyst.
- Provide balanced, objective analysis
- Identify strongest points from all sides
- Highlight areas of consensus
- Suggest potential resolutions
- Respond in ${language}.`;
}
