# 07 — COGNITIVE ROLE for `agent-content`

> Which cognitive events should surface for `agent-content`, and how to display/integrate them. VERIFIED event catalog in event-registry.ts:736-776.

## The 4 cognitive events (VERIFIED)

| Event                      | Emitted by                    | Carries `nodeId`? | Consumer status                                                                             |
| -------------------------- | ----------------------------- | ----------------- | ------------------------------------------------------------------------------------------- |
| `cognitive:trace:updated`  | CognitiveService/TraceService | via steps         | consumed by TraceService/CognitiveService                                                   |
| `cognitive:step:active`    | OrchestrationService          | ✅ `nodeId`       | AgentJournalService (agent-journal-service.ts:130)                                          |
| `cognitive:step:completed` | OrchestrationService:414      | ✅ `nodeId`       | **9 consumers** (stats, memory, journal, health, metrics, trace, policy, snapshot, advisor) |
| `cognitive:decision:made`  | CognitiveService:414          | —                 | ❌ **DEAD — zero consumers**                                                                |

## What `agent-content` surfaces today

- Every time `agent-content` runs a step, `COGNITIVE_STEP_COMPLETED` fires with `nodeId:'agent-content'`. This populates:
  - **AgentsPanel / AgentStatsDashboard** (calls, tokens, cost, latency) — agent-service.ts:184.
  - **AgentObservabilityTab / LiveActivityStream** — via generic step listeners.
  - **AgentHistoryTab** — via AgentJournalService (agent-journal-service.ts:150).
  - **Memory store** — generically (memory-engine.ts:181).
- So its cognitive activity is **already fully visible** in the generic agent UIs.

## The dead event: `cognitive:decision:made`

- VERIFIED: emitted at cognitive-service.ts:414, defined at event-registry.ts:776, **no `onSafe(COGNITIVE_DECISION_MADE)` anywhere** (grep returned only the definition + the emit). It is "dead-at-consumer" exactly as AGENTS.md states.
- OPINION: this is the natural hook for surfacing **content decisions** (e.g., "chose AP style", "flagged keyword stuffing"). Today it cannot surface anything.

## Recommended cognitive integration (DISPLAY/INTEGRATION ONLY — no new engine)

1. **Surface content decisions.** Make `agent-content` (or any agent) emit `cognitive:decision:made` when it makes a notable editorial choice, and add **one consumer** (e.g., a DecisionLog panel or the existing AgentObservabilityTab) that renders decisions per agent. This fixes a system-wide dead event and gives `agent-content` a content-specific trace — without forking the agent model.
2. **Step-level content metadata.** Extend `COGNITIVE_STEP_COMPLETED` payload (optional, backward-compatible) with `tags?: string[]` so `agent-content`'s steps can be tagged `editorial`/`seo`/`messaging` for filtering in LiveActivityStream. (Optional; today tags aren't in the schema.)
3. **Trace view.** `cognitive:trace:updated` already carries steps; ensure `agent-content`'s trace is filterable by `nodeId` in the Cognitive/Trace UI (reuse existing filtering).

## Display recommendations (OPINION)

- Add a **"Content Decisions"** sub-tab in AgentDetailPanel that subscribes to `cognitive:decision:made` filtered by `nodeId==='agent-content'`.
- In LiveActivityStream, allow filtering by agent + tag so Lena's editorial steps are distinguishable from, say, `agent-risk`'s.
- Show a **content-quality signal** (e.g., readability/SEO score) as a step annotation — but that requires a scorer (see 11_OPPORTUNITIES QW-1); the event plumbing is the prerequisite.

## Risks

- Adding a consumer to `cognitive:decision:made` is low-risk (read-only subscription).
- Extending the `COGNITIVE_STEP_COMPLETED` zod schema requires bumping the schema and is HOT_EVENT-bypassed at runtime (event-registry.ts:732-734 note) — so adding an optional field is safe.
