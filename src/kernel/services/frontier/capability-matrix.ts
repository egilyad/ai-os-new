/**
 * Capability Matrix registry — Wave 12.35 (static source of truth).
 *
 * The system maintains its own matrix: which patterns/protocols are
 * implemented and where. `IEvalService.capabilityMatrix()` serves this
 * (statuses updated as phases land — all Phase A–D entries are done).
 */
import type { CapabilityMatrixEntry } from '../../types/frontier-types';

export const CAPABILITY_MATRIX: CapabilityMatrixEntry[] = [
    // Wave 1 — teams
    { area: 'teams', capability: 'Crew + Task + Process (sequential/hierarchical)', status: 'done', ref: 'phase23' },
    { area: 'teams', capability: 'Agent Card / Identity + JSON exchange', status: 'done', ref: 'phase23' },
    { area: 'teams', capability: 'Agent Forge (goal → team draft)', status: 'done', ref: 'phase23' },
    // Wave 2 — council
    { area: 'debate', capability: 'Lenses + polarities (10 + 4)', status: 'done', ref: 'phase24' },
    { area: 'debate', capability: 'Forum + Whisper channels', status: 'done', ref: 'phase24' },
    { area: 'debate', capability: 'Double-blind + fact-gathering + blind judge', status: 'done', ref: 'phase24' },
    { area: 'debate', capability: 'Multi-judge + audience voting', status: 'done', ref: 'phase24' },
    // Wave 3 — orchestration
    { area: 'orchestration', capability: 'State Graph + conditional routing (6 modes)', status: 'done', ref: 'phase25' },
    { area: 'orchestration', capability: 'Durable checkpoints + time-travel', status: 'done', ref: 'phase25' },
    { area: 'orchestration', capability: 'HITL interrupt/approve/reject/edit + reflection + decision log', status: 'done', ref: 'phase25' },
    // Wave 4 — memory/persona
    { area: 'memory', capability: 'Long-term tiers core/recall/archival + graph links', status: 'done', ref: 'phase26' },
    { area: 'memory', capability: 'Person/Voice distillation + deep persona', status: 'done', ref: 'phase26' },
    { area: 'memory', capability: 'Shared context + goals', status: 'done', ref: 'phase26' },
    // Wave 5 — ops
    { area: 'governance', capability: 'Hierarchy + budgets + hash-chained audit', status: 'done', ref: 'phase27' },
    { area: 'governance', capability: 'MCP governance + sandbox tickets + skills + fleet + mobile HITL', status: 'done', ref: 'phase27' },
    // Phase A — interop
    { area: 'interop', capability: 'A2A + gateway + translation + federation + handoff', status: 'done', ref: 'phase28' },
    { area: 'interop', capability: 'Market/auction, contract-net, capability routing, contracts', status: 'done', ref: 'phase28' },
    // Phase B — meta
    { area: 'meta', capability: 'Self-improvement + skill evolution + health + strategies', status: 'done', ref: 'phase29' },
    { area: 'meta', capability: 'Unified episodic/semantic/procedural/identity + packages', status: 'done', ref: 'phase29' },
    // Phase C — trust
    { area: 'trust', capability: 'Capabilities + trust + policy + human roles + provenance', status: 'done', ref: 'phase30' },
    { area: 'trust', capability: 'Extensions + bundles + surfaces + OS config + snapshots', status: 'done', ref: 'phase30' },
    // Phase D — frontier
    { area: 'eval', capability: 'Agent benchmarks + A/B + red-team', status: 'done', ref: 'phase31' },
    { area: 'frontier', capability: 'Simulations + norms + orgs + intent + multimodal registry', status: 'done', ref: 'phase31' },
];
