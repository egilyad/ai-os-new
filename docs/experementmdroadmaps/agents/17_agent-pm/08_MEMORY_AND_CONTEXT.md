# 08 — MEMORY & CONTEXT

> What memory `agent-pm` has / saves / reads; continuity improvements. Tags: **VERIFIED** / **INFERRED** / **OPINION**.

## Current memory posture (VERIFIED)

- **No agent-pm-owned memory.** The ~16 memory stores (AGENTS.md) are **subsystem-scoped** (e.g. `memory-engine`, debate sync, agent journal, crystals). None is keyed to or owned by `agent-pm`. `agent-pm` has no `memory` config and no `lensIds` (`topology-defaults.ts:106` sets `lensIds:[]`).
- **What it can read transitively:**
  - `AgentJournalService` entries _about_ `agent-pm` (by `agentId`) — `agent-journal-service.ts:253` (`listByAgent`). But this is a _global_ journal, not a private scratchpad.
  - `CrystalVault`, `Forum`, `Junction`, `Synthesis` — only if a scenario/invocation explicitly passes their content as context. There is **no automatic** "agent-pm remembers past plans" wiring.
- **What it saves:** only implicit telemetry — `AgentStats` (KV) and journal entries (KV `agent_journal_v1`). No structured plan/decision memory.

## Continuity gaps (VERIFIED/INFERRED)

1. **No cross-session plan memory.** If a human asks `agent-pm` to "continue the Q3 plan from yesterday," there is no retrieval path — the prior plan lives only as turn text in a Director session or a forum post, not in a queryable store.
2. **No specialization-aware retrieval.** Even though `agent-pm` is "Risk/Planning," it does not preferentially recall risk or plan artifacts.
3. **Debate turns are not journaled** (see `07_COGNITIVE_ROLE.md`) — so `agent-pm`'s debate contributions are not even in the journal, weakening any future recall.

## Improvements (OPINION, reuse-first)

| Idea                                                                                                                      | Reuse                                                                                                          | Effort | Risk                                 |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------ |
| A. Auto-journal PM decisions to `CrystalVault` (risk/plan crystals) when `agent-pm` emits a plan/risk turn                | `CrystalVault.propose` (AGENTS.md Module 2), `AgentJournalService`                                             | M      | Low — event-driven bridge            |
| B. "Recall my last plan" — query `agent-journal`/`crystals` by `agentId:'agent-pm'` + plan keywords and inject as context | `AgentJournalService.listByAgent`/`search` (`agent-journal-service.ts:253,262`), `CrystalRepository`           | M      | Low                                  |
| C. Give `agent-pm` a `lensIds:['meta-consensus','meta-uncertainty']` so its turns are filtered through synthesis lenses   | `lens-engine` (`agent-identity.ts:116-124`), `normalizeAgentIdentity` already copies `lensIds`                 | S      | Low (lens assignment is config-only) |
| D. Debate→journal bridge so PM debate turns are recallable                                                                | `agent-journal-service.ts:174` already subscribes to `debate:runtime:agent:error`; extend to `debate:argument` | S      | Low                                  |

## Recommended (OPINION)

Start with **D** (cheap, fixes the observability gap) and **C** (config-only lens assignment that gives `agent-pm` a consistent analytical framing). **A/B** are the higher-value continuity features but need a small bridge service; defer to `13_ROADMAP.md` Phase 2–3.

## Non-goals (OPINION)

Do **not** create a dedicated `agent-pm` Dexie table or a "PM memory" subsystem. The repo's memory layer is deliberately subsystem-scoped; injecting an agent-owned store fragments it. Reuse `agent-journal` + `crystals` instead.
