# 12 — FUTURE AGENT CONCEPT (realized from EXISTING capabilities)

> A concrete "PM agent" concept built ONLY from capabilities already present in the repo. No new framework. Tags: **VERIFIED** / **OPINION**.

## Vision (OPINION)

`agent-pm` (Dana Whitfield) becomes the **default human-facing coordinator** for any planning, roadmap, risk, or retro request — realized entirely by wiring existing seams, not by writing new agent logic.

## Building blocks already in the repo (VERIFIED)

| Capability needed                  | Existing source                                                 | Citation                             |
| ---------------------------------- | --------------------------------------------------------------- | ------------------------------------ |
| Named PM identity                  | `AGENT_PROFILES['agent-pm']`                                    | `agent-profiles.ts:182`              |
| Resolvable node + pinned 70B model | `normalizeAgentIdentity`                                        | `topology-defaults.ts:91-119`        |
| Human invocation                   | `RoomPanel` + `InvocationEngine`                                | `phase21-invocation.ts:43-167`       |
| Orchestrated multi-turn runs       | `ConversationDirectorService` + `HybridPolicy` + `ChatExecutor` | AGENTS.md B3–B6.2                    |
| Scenario persistence               | `ScenarioRepository.create`                                     | AGENTS.md B5.2/B5.3                  |
| Structured artifacts               | `CrystalVault`, `ForumService`                                  | AGENTS.md Modules 2,6                |
| Recall                             | `AgentJournalService`, `CrystalRepository`                      | `agent-journal-service.ts`; Module 2 |
| Analytics framing                  | `lens-engine` (`meta-consensus`,`meta-uncertainty`)             | `lens-library.ts` (lenses exist)     |

## The realized concept (OPINION)

1. **Identity** — already Dana Whitfield, 🧩, `#3b82f6`, PM prompt, 70B `openrouter` (live pin, per `02`/`10` P2 correction).
2. **Default coordinator** — in `RoomPanel`, planning/risk/retro human mentions suggest `agent-pm` as the default target (reuses `AgentResolverDirectory.specializations`, `phase21-invocation.ts:47-57`).
3. **Facilitator scenario** — a one-click "PM facilitation" Director template where `agent-pm` opens with an agenda, runs timed rounds, and closes with a consensus + risk summary (reuses `ConversationDirectorService`).
4. **Structured output** — PM plan/risk turns can be saved to `CrystalVault` (risk/plan crystals) or posted to `Forum` (reuses Module 2/6), so the plan is queryable and recallable.
5. **Continuity** — "continue my last plan" queries `agent-journal`/`crystals` by `agentId:'agent-pm'` and injects as context.
6. **Framing** — `agent-pm` carries `lensIds:['meta-consensus','meta-uncertainty']` so its turns are consistently synthesis-framed.

## What this concept deliberately does NOT add (OPINION)

- No new agent service, no new Dexie table, no new event (the `invocation:*`/`conversation:*`/`cognitive:*` events already exist).
- No separate `ProjectManagerPanel` — it lives in `RoomPanel` + `DirectorPanel` + `AgentsPanel` (shared infra).
- No autonomous PM — human authority only (D6), consistent with the Invocation Engine design.

## Success metric (OPINION)

A user can: open Room → type "plan the Q3 launch" → `agent-pm` is pre-selected → one click → a facilitation scenario runs → produces a milestone plan + risk list → saved as a Crystal → reopenable next session. **Every step uses verified existing code.**
