# 15_DO_NOT_BUILD_YET — Ideas to AVOID for `agent-writer`

> Guardrails. The system already has 25 agents and 7 cognitive modules. The biggest risk is **proliferating mini-frameworks**. Each item: why avoid, what to do instead.

1. **DO NOT create a `writer-service.ts` / `documentation-engine.ts`.**
   Why: There is no writer-specific logic; she is a topology node. A dedicated service duplicates `AgentService` + `ConversationOrchestrator` for no reason.
   Instead: drive her via Invocation + ConversationCore (existing). See 03/12.

2. **DO NOT add a 7th documentation agent (e.g. `agent-doc-strategist`).**
   Why: There are already 6 overlapping doc agents (`agent-writer` + 5 `doc-*`), with no coordination (problem #7). More agents worsen the redundancy.
   Instead: Form an `AgentGroup` of the existing six (M5) and a routing rule.

3. **DO NOT build a separate "Doc EventBus" or new `document:*` event family prematurely.**
   Why: The existing EventBus already carries `conversation:*`, `COGNITIVE_STEP_COMPLETED`, `DEBATE_CONSENSUS`, `invocation:*`. A parallel bus fractures observability.
   Instead: If docs need events, add ≤1-2 events reusing the `event-registry.ts` pattern (like Crystal's 5), only in Phase 3+ of Roadmap A/B.

4. **DO NOT give the writer her own memory subsystem.**
   Why: ~16 generic memory stores + `AgentJournalService` already record her steps. A bespoke memory store is the "25 mini-frameworks" trap.
   Instead: Query `AgentJournalService` + `MemoryEngine` by `nodeId`; add a `documents` store only if persistence/versioning is truly needed (M2).

5. **DO NOT auto-upgrade her model to 70B without cost review.**
   Why: She is pinned to `llama-3.1-8b-instant` (`agent-profiles.ts:219`) — cheap. Bumping to 70B (like `doc-architect`) multiplies cost for every doc task.
   Instead: Keep 8B for drafts; route heavy/accurate doc tasks to `doc-architect` (70B) via the group (M5). Right agent, right cost.

6. **DO NOT make the writer self-invoke or spawn doc agents.**
   Why: `AGENTS.md` D6 — "Authority = human; agents never self-invoke." Invocation Engine D3 forbids agent→agent calls.
   Instead: A human (or a Debate/Consensus event bridge, phase18 pattern) triggers documentation, never Clara herself.

7. **DO NOT build a doc-specific UI framework / new panel from scratch.**
   Why: `AgentsPanel`, `RoomPanel`, `DirectorPanel`, `CrystalVaultPanel` already exist. A greenfield DocStudio repeats them.
   Instead: Add a "Documents" tab to `AgentDetailPanel` (or reuse `CrystalVaultPanel` patterns) over the `documents` store.

8. **DO NOT implement specialization-aware routing by hardcoding `agent-writer` in the router.**
   Why: Hardcoding one agent breaks the generic topology model and the other 5 doc agents.
   Instead: Use `specializations` already on the node + `PersonaSelector`/`InvocationEngine.matches` expertise (Q5/Q2).

9. **DO NOT treat `COGNITIVE_DECISION_MADE` as a writer feature until its consumer is fixed.**
   Why: It is **dead at consumer** (`AGENTS.md`). Emitting it from Clara would be invisible.
   Instead: Fix the consumer first (Q4), then use it.

10. **DO NOT scope-creep into "AI that writes the whole product docs automatically" in v1.**
    Why: Grounding (M1), persistence (M2), QA loop (B1) are prerequisites; skipping to full automation produces unverified, drifting docs.
    Instead: Phase incrementally per Roadmap A; measure doc quality at each step.

**Summary rule:** Every writer enhancement should compose existing services (AgentService, Invocation, ConversationCore, Crystal/Forum bridges, AgentJournal, EventBus). If a proposal needs a _new_ service, table, or bus, it belongs in Roadmap B (subsystem) and must clear the "is docs a governed deliverable?" bar first.
