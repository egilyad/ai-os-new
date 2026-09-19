# 04 — DEBATE ROLE

> CURRENT / POTENTIAL / RECOMMENDED + scenarios. Tags: **VERIFIED** / **INFERRED** / **OPINION**.

## CURRENT (VERIFIED)

- `agent-pm` is a routable debate participant: `router → agent-pm → aggregator` edges (`topology-defaults.ts:482,534`).
- During a debate, `PersonaSelector.selectForTopic` (`persona-selector.ts:251-308`) assigns it a **generic** variant based on the topic's keyword match against 11 hardcoded variants and its assigned debate role (`pro`/`con`/`neutral`). It does **not** consult `agent-pm`'s `Planning/Agile/Risk` specializations (grep: no `specializations` in `persona-selector.ts`).
- `debate-agent-executor.ts:78` records token usage per `participant.agentId`.
- Debate emits **no** `cognitive:*` events (AGENTS.md); so `agent-pm` accrues stats in debate only via `STREAM_END` (`agent-service.ts:211-244`), not `COGNITIVE_STEP_COMPLETED`.
- Nothing promotes `agent-pm` to a coordinator/meta role in debate (`debate-meta-agent-controller.ts` has no `agent-pm` branch — grep verifies).

**Net:** in debate, `agent-pm` is an interchangeable domain voice. Its PM identity is cosmetic.

## POTENTIAL (OPINION / INFERRED)

Two roles fit `agent-pm`'s specializations naturally and are reachable with _existing_ seams (no new framework):

1. **Synthesizer / Integrator.** PMs are natural "summarize the threads, find the consensus, flag the open risks" voices. The `diplomat` persona variant already exists (`persona-selector.ts:172-193`, `suitableRoles: neutral/pro/con`, `minRound:3`) — it is the closest match. We could add a `pm_synthesizer` variant whose `triggerKeywords` include `plan/roadmap/milestone/dependency/risk/timeline` and bias it toward `neutral`/late rounds. **Reuse:** `PersonaSelector` extension only.
2. **Coordinator / Facilitator.** PMs run the meeting: set agenda, enforce turns, call for vote, surface blocking items. The ConversationCore `DirectorService` already orchestrates turns and emits `conversation:*` lifecycle events (`AGENTS.md` B4/B6.2). A `agent-pm`-led Director scenario is a coordinator role with zero new runtime — just a scenario template.

## RECOMMENDED (OPINION)

Adopt **Synthesizer-first, Coordinator-second**:

- **Short term:** add a `pm_synthesizer` persona variant + bias `agent-pm` (by `baseRole === 'Project Manager'`) toward `neutral`/late-round synthesis. Cheap, isolated, reversible.
- **Medium term:** ship a curated **"PM facilitation" Director scenario** (agenda→rounds→consensus call→risk summary) that any human can launch from RoomPanel, with `agent-pm` as facilitator. Reuses `ConversationDirectorService` + `HybridPolicy` + `ChatExecutionEngine` (all VERIFIED in AGENTS.md B3–B6.2).

## Scenarios (INFERRED, illustrative)

1. **Release-readiness debate.** Topic: "Should we ship v5.0 now?" Router routes `agent-architect`, `agent-risk`, `agent-security`, `agent-pm`. `agent-pm` (neutral, round 3+) synthesizes: outstanding blockers, dependency risks, suggested go/no-go criteria. _Today it would get a generic `diplomat`/`pragmatic_economist` voice; with the variant it speaks as PM._
2. **Cross-team roadmap conflict.** Two workstreams disagree on sequencing. `agent-pm` facilitates: proposes a merged milestone map, calls out the critical path, requests a vote. _Director scenario, `agent-pm` as facilitator._
3. **Post-mortem / retro.** `agent-pm` (neutral) consolidates arguments into action items + owners + dates — a natural PM deliverable, today only achievable if the human writes that instruction manually.

## Risk / guardrails (OPINION)

- Persona variants are **global** (shared across agents). Biasing by `baseRole` must be a _soft_ preference, not a hard lock, to avoid stealing the variant from other agents. Keep it keyword + role driven.
- Do **not** auto-promote `agent-pm` to meta-agent in _adversarial_ debates — a PM facilitator is inappropriate when the goal is win/lose. Gate coordinator role to `Director` scenarios and consensus-seeking debates only.
