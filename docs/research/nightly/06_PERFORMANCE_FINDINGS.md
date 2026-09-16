# PERFORMANCE FINDINGS — Nightly Research

> Research-only. Proven or well-justified performance concerns.

## PE-01 (CONFIRMED, Medium) — Observer stores subscribe globally at module load and never unsubscribe

- Category: Performance / Leak
- Location: `stores/invocationStore.ts:73-199` (`void subs`), `stores/directorStore.ts` (same pattern, EB-12/FE-02).
- Evidence: subscriptions to `INVOCATION_*`/`CONVERSATION_*`/`CONVERSATION_*` are created once at import and discarded (`void subs`). No teardown.
- Why it matters: in long-lived sessions and especially under HMR (dev), handlers accumulate. Each emitted event runs every accumulated handler; two of the same store → double work. Memory grows unbounded with dev reloads.
- Confidence: High.
- Related: FE-02, FE-03, EB-12.

## PE-02 (LIKELY, Medium) — `invocationStore` live-output feed is unscoped and possibly unbounded

- Category: Performance / Memory
- Location: `stores/invocationStore.ts` (the `feed`/live-output array appended on `CONVERSATION_*` events).
- Evidence: the store keeps a `feed` of live execution output keyed only by module-level arrays; from the Cycle 6 trace, the store applies ALL `conversation:*` events globally (FE-03) without trimming or scoping to the active invocation's `sessionRef`.
- Why it matters: a long-running debate (hundreds of chunk/complete events) appends to an unscoped array that is never pruned → unbounded memory growth in the store, and every render maps over the whole feed.
- Confidence: Medium-Likely (global subscription confirmed; feed pruning not verified — needs one more read of the store's feed reducer).
- Related: FE-03.

## PE-03 (CONFIRMED, Low-Medium) — Debate sync pushes a large, partially-mutated session object to Zustand every cycle

- Category: Performance / Rerender
- Location: `debate-sync-manager.ts:696-744` (`_syncSessionImpl` → `activeDebateStore.setSession(this.activeSession)`; 256KB truncation at :735).
- Evidence: each sync cycle builds/merges a full `DebateSession` (all arguments) and calls `setSession`, triggering React re-render of every subscriber; a 256KB-truncation guard exists but only kicks in above 256KB.
- Why it matters: for large debates the per-cycle full-object push + re-render is O(arguments) each tick; the truncation guard is a band-aid, not a structural fix (pagination/virtualization of the argument graph would help).
- Confidence: High.
- Related: EB-18.

## PE-04 (CONFIRMED, Low) — Global `'*'` subscriptions and per-event handlers multiply event-handler work

- Category: Performance
- Location: `event-bus.ts` `on('*', ...)` (subscribeAll) + every `on(event)`; multiple stores subscribe to overlapping event sets.
- Evidence: `rawEmit` iterates `handlers` + `globalHandlers` for every emit; with ~many subscribers (directorStore, invocationStore, debateLiveStore, chat store, alert layers) each global emit fans out to all.
- Why it matters: any high-frequency event (e.g. `chat:stream:chunk`, `cognitive:trace:updated`) pays N-handler cost per emit. Hot events are exempted (HOT_EVENTS) but cold high-volume events still fan out.
- Confidence: Medium.
- Related: PE-01.

---

_Next areas appended as research continues._
