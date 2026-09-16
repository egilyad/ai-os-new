# 15_DO_NOT_BUILD_YET — Recommendations & "Do Not Build" Verdict

**VERIFIED conclusion:** `agent-doc-auditor` (Felix Moreau) is **100% generic infrastructure** — a topology node + curated profile, resolved everywhere through `agentService` / `resolveAgentIdentity`, with **zero agent-specific code** in Debate, Conversation Core, Invocation, Memory, Cognitive, Lenses, Crystal/Forum/Workflow/Scheduler, UI, or Routing.

## What already works (do NOT rebuild)

1. **Identity & model pin** — `nvidia`/`meta-llama-3.3-70b-instruct`, 🔍, specializations, auditor prompt. Fully resolved via `agent-profiles.ts` + `topology-defaults.ts:normalizeAgentIdentity`. ✅
2. **Participation** — doc-auditor can be a Debate participant, a Conversation/Director turn speaker (via `ChatExecutionEngine` B-seam, `conversation-execution-engine.ts:40`), and a human-invoked Room agent (`phase21-invocation.ts`, `RoomPanel.tsx`). ✅
3. **Observability** — stats (`agent-service.ts:184` cognitive hook), journal (`agent-journal-service.ts`), live board, ELO. ✅
4. **UI** — fully rendered by generic AgentsPanel + RoomPanel + avatar consumers. ✅

## Candidate enhancements (INTENTIONALLY NOT BUILT — research-only)

These are _gaps_, not bugs. Listed so future work knows what is missing:

- **A. Audit-trail store.** Doc-auditor finds contradictions but has no dedicated store to persist "defect reports" (see `07_MEMORY.md`). Would need a new Dexie table + repository — out of scope for this research.
- **B. Architect→Auditor→Checker pipeline.** The natural doc-QA flow is not wired (`10_DOC_CLUSTER.md`). A Director scenario or topology pipeline could encode it without code.
- **C. Scheduled re-audit.** No Scheduler→Invocation policy exists (`12_CRYSTAL_FORUM_WORKFLOW_SCHEDULER.md`).
- **D. Lens binding.** `lens:critical` is topically perfect but unassigned (`09_LENSES.md`); binding it changes Synthesis behavior and should be a deliberate product call, not an implicit one.
- **E. Knowledge-module integration.** Not wired into Knowledge Generator peer-review / Crystal validation (`11_RESEARCH_KNOWLEDGE.md`).
- **F. Debate role guard.** Doc-auditor can be assigned `pro`/`con` where its "reject" prompt conflicts with advocacy (`04_DEBATE.md`) — a design gap, not an error.

## Verdict

**Do NOT build any doc-auditor-specific code.** The agent is correctly a data-only citizen. Any of A–F should be implemented as _generic capability_ (new store, new scenario, new policy) consumed by doc-auditor _by id_, preserving the "agents are topology nodes; behavior is shared infra" invariant (AGENTS.md). No file in this research recommends creating an `agent-doc-auditor`-named module, service, event, or route.

## Evidence index (file:line)

- Profile: `agent-profiles.ts:232-241`
- Topology node/edges: `topology-defaults.ts:408-419, 494-498, 546-550, 91-119`
- Resolver/identity: `agent-service.ts:306,337-390`; `agent-identity.ts:62-144`
- Conversation: `conversation-execution-engine.ts:23-43`; `phase20-director.ts:36`
- Invocation: `phase21-invocation.ts:43-58,125-144`
- Cognitive: `event-registry.ts:736,755,763,776`; `agent-service.ts:184`
- Lenses: `lens-library.ts:11-313`; `topology-defaults.ts:106`
- UI/Routes: `AgentsPanel/*`; `RoomPanel.tsx:89,117`; `route-registry-system.ts:10-11`; `route-imports.ts:188,242`
