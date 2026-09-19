# 05 — CONVERSATION ROLE (ConversationCore / Director)

> Tags: **VERIFIED** / **INFERRED** / **OPINION**.

## CURRENT (VERIFIED/INFERRED)

- `agent-pm` is a valid **scenario participant**. `ConversationOrchestrator` resolves `TurnProposal.participantId === 'agent-pm'` through `agentService.resolveAgent` (`agent-service.ts:337-389`), and `ChatExecutor` speaks the turn using the node's `systemPrompt` + pinned model (`agent-profiles.ts:189` → `topology-defaults.ts:104-105` → `agent-service.ts:351-353`).
- The `DirectorService` (`ConversationDirectorService`, AGENTS.md B3–B6.2) drives `loadScenario → run → pause/resume/skip/override/abort`. `agent-pm` participates only if a scenario author lists it. There is **no PM-specific Director behavior** — `agent-pm` is one of N participants.
- ConversationCore emits `conversation:*` events (`turn:start/complete/error`, `paused`, `resumed`, `aborted`, `completed` — `event-registry.ts` per AGENTS.md B4/B6.2). `DirectorStore` observes them. `agent-pm` produces the same events any participant does.

**Net:** `agent-pm` is a first-class ConversationCore voice, but only when explicitly placed in a scenario. No PM-specific orchestration exists.

## POTENTIAL ROLES (OPINION)

1. **Scenario Facilitator (per `04_DEBATE_ROLE.md`).** A curated Director scenario where `agent-pm` opens with an agenda, runs timed rounds, and closes with a consensus/risk summary. Fully reachable with `ConversationDirectorService` + `HybridPolicy` + `ChatExecutionEngine`.
2. **Planning co-pilot in a multi-agent "brainstorm→plan" flow.** `agent-pm` takes a raw idea (from `agent-creative`/`agent-po`) and emits a milestone/dependency structure that `agent-architect` then validates. Today this requires a human-authored scenario; it could be a one-click template.
3. **Retrospective / standup generator.** `agent-pm` consumes a `forum` thread or `crystal` set as context and outputs a status + blockers summary. Reuses `ForumService`/`CrystalVault` reads + a Director scenario with `agent-pm` as the only active speaker.

## Scenarios (INFERRED)

1. **"Plan this feature"** — human invokes `agent-pm` from RoomPanel (mode: Scenario), provides a feature description; Director runs a single-participant `agent-pm` scenario that returns a milestone plan + risk list as turn output. _Reuses invocation→Director handoff (`phase21-invocation.ts:89-108`)._
2. **"Facilitate this debate as a plan"** — a debate concludes; `agent-pm` (separate Director scenario) ingests the debate transcript (via `DebateSyncManager`/event bridge) and produces an action-item list. _Needs a transcript→scenario context bridge (INFERRED gap)._
3. **"Weekly status"** — `agent-pm` reads recent `agent-journal` entries (or `forum` topics) and narrates progress/blockers. _Reuses `AgentJournalService` read API (`agent-journal-service.ts:249-277`)._

## Constraints / gaps (VERIFIED/INFERRED)

- `TurnProposal.objective.type` is an enum (`INTRODUCE` etc., AGENTS.md B5.3). A "facilitate" or "summarize" objective type does not exist; today you express it via free-text `description`/`constraints`. Adding `FACILITATE`/`SUMMARIZE` objective types would let `agent-pm`'s role be declarative rather than prompt-only.
- No persistence of _structured_ plan output — `agent-pm`'s plan is just turn text unless a downstream consumer (Crystal/Forum) ingests it.
- `conversation:completed` exists (AGENTS.md B6.2), so a PM-facilitated session can transition the store to `completed` and surface a "Completed" badge — good fit.
