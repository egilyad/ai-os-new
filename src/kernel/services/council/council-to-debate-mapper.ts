/**
 * Council → Debate Mapper — D4.1 (pure, no side effects).
 *
 * Pure mapper: CouncilSession (C) → DebateSessionSnapshot (A canonical).
 * No save — save is separate operation (D4.2 facade / bulk migration).
 * No Dexie write, no overwrite.
 */

import type { CouncilSession, CouncilPhase } from '../../types/council-types';
import type { DebatePhase, DebateTopology, ParticipantConfig } from '../../contracts/debate-runtime';
import type { DebateSessionSnapshot } from '../../contracts/debate-runtime';

// Ленивый require для разрыва циклов: tsconfig app без node-типов.
declare const require: (id: string) => any;

function councilPhaseToDebatePhase(phase: CouncilPhase): DebatePhase {
    switch (phase) {
        case 'proposal': return 'created';
        case 'fact_gathering': return 'deliberating';
        case 'debate': return 'deliberating';
        case 'consensus': return 'consensus';
        case 'completed': return 'completed';
        case 'aborted': return 'cancelled';
        default: return 'created';
    }
}

function councilToTopology(session: CouncilSession): DebateTopology {
    const nodes = session.participants.map((p) => ({
        id: p.id,
        label: p.name,
        role: p.kind as unknown as import('../../contracts/debate-types').DebateRole,
        config: {
            lensId: p.lensId,
            polarityId: p.polarityId,
            councilMode: true,
            doubleBlind: session.config.doubleBlind,
            aliases: session.aliases,
            allowAudienceVoting: session.config.allowAudienceVoting,
            factGathering: session.config.factGathering,
        } as Record<string, unknown>,
    }));
    const topology: DebateTopology = {
        id: `council-${session.id}`,
        type: 'roundtable' as unknown as DebateTopology['type'],
        nodes,
        edges: [],
        maxRounds: session.config.maxRounds ?? 3,
    };
    return topology;
}

function councilParticipantsToDebateParticipants(session: CouncilSession): ParticipantConfig[] {
    // D4.3 lenses: real systemPrompt via buildParticipantPrompt (shared lenses lib) — metadata-only propagation not enough
    // We lazily import to avoid circular at top
    let buildPrompt: ((p: { name: string; kind: string; lensId?: string; polarityId?: string }) => string) | undefined;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('./council-lenses') as typeof import('./council-lenses');
        const fn: unknown = mod.buildParticipantPrompt;
        if (typeof fn === 'function') {
            buildPrompt = fn as (p: { name: string; kind: string; lensId?: string; polarityId?: string }) => string;
        }
    } catch { /* ignore */ }
    return session.participants.map((p) => ({
        agentId: p.id,
        nodeId: p.id,
        role: p.kind,
        systemPrompt: buildPrompt?.({ name: p.name, kind: p.kind, lensId: p.lensId, polarityId: p.polarityId }),
    }));
}

/**
 * Pure mapper — no side effects.
 * Returns DebateSessionSnapshot view of CouncilSession (version 1, no persistence).
 */
export function councilToDebateSnapshot(session: CouncilSession): DebateSessionSnapshot {
    const topology = councilToTopology(session);
    const participants = councilParticipantsToDebateParticipants(session);
    // Map facts+messages → arguments (for ConsensusEngine)
    // D4.3 facts→arguments semantic mapper: preserve sources→citations/evidence, whisper not filtered, sorted timestamp, round not hard-coded
    const argsFromFacts = session.facts.map((f) => ({
        agentId: f.authorId,
        content: f.claim,
        round: 0, // fact_gathering round 0 — heuristic documented
        timestamp: f.createdAt,
        confidence: f.verdict === 'verified' ? 0.9 : f.verdict === 'disputed' ? 0.2 : 0.5, // heuristic documented
        evidence: f.sources?.[0],
        citations: f.sources ?? [],
        speaker: f.authorId,
        role: session.participants.find((p) => p.id === f.authorId)?.kind ?? 'researcher',
    }));
    const argsFromMessages = session.messages.map((m) => ({
        agentId: m.authorId,
        content: m.body,
        round: m.round ?? 0,
        timestamp: m.createdAt,
        confidence: 0.6, // heuristic
        evidence: undefined,
        citations: [],
        speaker: m.authorId,
        role: session.participants.find((p) => p.id === m.authorId)?.kind ?? '',
        // channel/toId preserved via payload in timeline (see §4 double-blind) — not dropped
    }));
    const args = [...argsFromFacts, ...argsFromMessages].sort((a, b) => a.timestamp - b.timestamp);

    return {
        id: session.id,
        topic: session.topic,
        topology,
        phase: councilPhaseToDebatePhase(session.phase),
        version: 1,
        round: session.phase === 'completed' ? (session.config.maxRounds ?? 3) : 0,
        agentStates: [],
        totalTokens: 0,
        totalCost: 0,
        startedAt: session.createdAt,
        updatedAt: session.updatedAt,
        language: 'en',
        arguments: args,
        participants,
        qualitySettings: undefined,
    } as DebateSessionSnapshot;
}

/** Reverse mapper for read fallback (DebateSnapshot → Council view, when kind='council') */
export function debateSnapshotToCouncilPhase(phase: DebatePhase): CouncilPhase {
    switch (phase) {
        case 'created':
        case 'queued':
        case 'initializing':
        case 'active': return 'proposal';
        case 'deliberating': return 'debate';
        case 'paused': return 'debate';
        case 'consensus':
        case 'summarizing': return 'consensus';
        case 'completed': return 'completed';
        case 'failed':
        case 'cancelled': return 'aborted';
        default: return 'proposal';
    }
}
