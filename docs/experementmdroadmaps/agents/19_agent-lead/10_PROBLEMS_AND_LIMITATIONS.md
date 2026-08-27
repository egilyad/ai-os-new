# 10_PROBLEMS_AND_LIMITATIONS — Concrete, VERIFIED issues

> Every item cites `file:line`. No fabrication. "N/A" where not applicable.

## P1 — "Team Lead" is cosmetic (VERIFIED)

`agent-lead` has no coordinator/manager logic. Its `specializations` (Mentoring/Coordination/Architecture) are never read to alter routing, persona, or grouping. Evidence: `persona-selector.ts:251-308` keys on topic keywords; `debate-meta-agent-controller.ts:21-102` keys on graph stats; `topology-defaults.ts:106` sets `lensIds:[]`. **Impact:** a user expecting a "lead" to coordinate gets a generic agent.

## P2 — Specializations are display-only (VERIFIED)

`AGENT_PROFILES['agent-lead'].specializations` (`agent-profiles.ts:210`) surfaces only in `AgentCard.tsx:68-78` and identity. `AgentResolverDirectory` exposes them to RoomPanel (`phase21-invocation.ts:54`) but nothing routes on them. **Impact:** wasted semantic signal.

## P3 — No lenses bound (VERIFIED)

`normalizeAgentIdentity` forces `lensIds:[]` when undefined (`topology-defaults.ts:106`); `LENS_LIBRARY` (`lens-library.ts`) has no lead/coordination/architecture lens. agent-lead runs lens-less while peers (e.g., synthesis) use `lens:meta-meta`. **Impact:** lead can't apply a coordination lens in Synthesis/Cognitive flows.

## P4 — Debate cognitive-event claim discrepancy (VERIFIED — needs resolution)

AGENTS.md: _"Debate emits NO cognitive events."_ But `orchestration-service.ts:414` emits `COGNITIVE_STEP_COMPLETED`, and if debate turns route through orchestration, agent-lead-in-debate WOULD emit it. Conversely if debate bypasses orchestration (via `debate-llm-caller`), it would not. **This is a contradiction between doc and code that must be verified before any cognitive surfacing (07) is trusted.** Impact: unreliable observability/journey for lead-in-debate.

## P5 — No auto-coordination in groups (VERIFIED)

`executeGroup` treats all agents equally (`agent-service.ts:688-762`); there is no "leader" execution pattern that lets agent-lead sequence/moderate. Patterns are parallel/sequential/consensus/pipeline/debate only (`agent-service.ts:25`). **Impact:** a "Team Lead" in a group is just another parallel worker.

## P6 — Invocation can't express "coordinate" intent (VERIFIED)

`InvocationExecutionDelegate.start` builds a flat 1-turn `INTRODUCE` scenario per agent (`phase21-invocation.ts:89-108`); there is no mode that spins up a _coordinated multi-agent_ session led by agent-lead. **Impact:** "lead my team on this" is not expressible via Room today.

## P7 — Meta-agent has no coordinator role (VERIFIED)

`TacticalRole` enum (`debate-meta-agent.ts:6-7`) lacks `coordinator`/`moderator`. `MetaAgentController` can only reach `synthesizer` (`debate-meta-agent-controller.ts:97-99`). So even graph-driven lead behavior is capped at synthesis. **Impact:** debate moderation by lead is partial.

## P8 — Stats can age out lead history (VERIFIED, minor)

`MAX_AGENT_STATS = 500` (`agent-service.ts:72`); heavy coordinator use could evict older lead stats. Journals cap at 1000 (`agent-journal-service.ts:37`). **Impact:** low; historical continuity loss only under heavy use.

## P9 — AgentIdentityEditor can desync from topology (INFERRED)

Identity is normalized at boot from `AGENT_PROFILES` (`topology-defaults.ts:91-118`); editing via `AgentIdentityEditor` writes node config (`agent-service.ts:432 updateAgent`) but a topology remount could re-normalize. **Impact:** possible silent revert of edits. Verify remount behavior.

## N/A items

- **Health/auto-recovery specific to lead:** N/A — `agent-health-monitor.ts:66` is generic; no lead-specific recovery exists or is needed.
- **Scheduler coupling:** N/A — no scheduler-agent seam found; treat as POTENTIAL not a problem.
