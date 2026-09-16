# QUICK WINS (Phase 14)

> Research-only. Concrete, low-effort / low-risk / high-value items. All reuse existing backend.
> Sorted by (value × ease). Each ties to an R-id and file:line proof in companion files.
>
> **Cycle 2 — quick wins.**

### Q1 — Scheduler → Invocation bridge · P1 · effort **S** · R-21

One subscriber for `SCHEDULE_TRIGGERED` (`scheduler-service.ts:300`) → `invocationEngine.invoke({target:{agentId}, reason:taskParams.prompt, context:{type:'scheduled'}, constraints:{mode:'chat'}})`. Turns a dead subsystem into periodic agents. ~30 LOC.

### Q2 — Forum vote / pin / moderate UI · P0 · effort **M** · R-02/R-22

`votePost` (:149), `pinTopic` (:237), `moderatePost` (:245) are implemented. Add buttons/menu to ForumPanel. Backend-ready, pure UI.

### Q3 — Forum consensus → Debate escalation · P0 · effort **M** · R-03/R-23

Register `forum:topic:escalated-to-debate` (currently absent from `event-registry.ts`), call `getConsensus` (:262); on `contested` → `invocationEngine.invoke({mode:'debate', context:{type:'forum-topic', ref}})`. Flagship cohesion win.

### Q4 — Research phases expose · P0 · effort **M** · R-01

Add tabs to research session view: systematic review, fact-check, anomalies, peer-review, citations (bibtex/apa/mla/chicago), knowledge graph. All computed in `research-engine-service.ts:374–544`.

### Q5 — Key-health AlertLayer · P1 · effort **S** · R-18

Subscriber for `KEY_COMPROMISED`/key-state events → dismissible banner (reuse `useNotificationStore`). Emitted today, unconsumed (nightly IN-06/UX-06).

### Q6 — Room feed scoping + honest status · P1 · effort **S–M** · R-06 / FE-07/06/UX-05

Shared `SessionScopedStore` keyed by `sessionRef`; split "Clear view" vs "Clear history"; map status to real target lifecycle.

### Q7 — Director checkpoint persistence + history · P1 · effort **M** · R-05

Dexie table; `directorStore.loadHistory()` like `invocationStore`. Fixes IN-04 + FE-09.

### Q8 — ComingSoon stub hygiene · P2 · effort **S** · R-17/C11

Collapse ~30 `ComingSoonPanel` debate sub-panels into one "Experimental" section. Reduces nav over-promise.

### Q9 — Command palette extend · P2 · effort **S–M** · R-11

Extend existing `CommandPalette` to jump to any panel/agent/debate/topic + fire common actions.

### Q10 — Template marketplace persist + import · P2 · effort **M** · R-19/R-27

Persist `SHARED_TEMPLATES` (`template-sharing-service.ts:11`); add import handlers (workflow/agent/topology/debate).

---

**Suggested first sprint (cheapest, highest cohesion):** Q1 → Q6 → Q5 → Q2 → Q3. These 5 make
Invocation the reliable hub and turn on the most "dark" backend. Q4 (Research) is the biggest
single expose and should follow.
