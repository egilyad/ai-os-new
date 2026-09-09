# Debate Subsystem — Live-Run Audit

> Research-only. No source modified. Citations use `file:line` + **VERIFIED / INFERRED / OPINION**.
> Companion to `01_DEBATE_SYSTEM_MAP.md` (architecture) and `02_DEBATE_USER_JOURNEY.md` (journeys).

---

## 0. Scope

This document traces what happens on the wire (EventBus) during a live debate, maps every event the live UI store subscribes to, documents the streaming/thinking/emotion lifecycle, and lists the gaps between what the backend emits and what the UI surfaces.

---

## 1. Event Emission Chain During a Live Debate

The emission chain is split between two emitters:

- **Facade** `DebateSyncManager` — emits **domain** `debate:*` events and orchestrates lifecycle.
- **Pipeline** `DebatePipelineBuilder` — emits the **runtime** `debate:runtime:*` stream per round/turn.

### 1.1 Start

| Step                              | Emitter                               | Event                                                         | Line                             | Confidence |
| --------------------------------- | ------------------------------------- | ------------------------------------------------------------- | -------------------------------- | ---------- |
| Facade start orchestration begins | `DebateSyncManager.startDebate`       | (preflight → engine session)                                  | `debate-sync-manager.ts:199`     | VERIFIED   |
| Runtime session created           | `DebatePipelineBuilder`               | `DEBATE_SESSION_STARTED` (`'debate:runtime:session:started'`) | `debate-pipeline-builder.ts:90`  | VERIFIED   |
| Domain debate started             | `DebateSyncManager.emitDebateStarted` | `DEBATE_STARTED` (`'debate:started'`) + `NOTIFICATION`        | `debate-sync-manager.ts:388-393` | VERIFIED   |
| Chat↔debate link                  | `DebateSyncManager`                   | `sessionManager.link(...)`                                    | `debate-sync-manager.ts:397-400` | VERIFIED   |

> Note both a runtime session-started and a domain debate-started fire. The live UI store keys off the **runtime** events; the domain `DEBATE_STARTED` is mainly for external bridges.

### 1.2 Per-round / per-agent

For each round (`debate-pipeline-builder.ts`):

1. `DEBATE_ROUND_STARTED` — `:181` (payload `{sessionId, round, nodes}`).
2. For each agent turn:
   - `DEBATE_AGENT_THINKING` — `:192` (`{sessionId, agentId}`).
   - `DEBATE_AGENT_RESPONDED` — `:221` (`{sessionId, agentId, content, ...}`).
   - `DEBATE_AGENT_ERROR` — `:238` on failure.
   - generic extra event — `:329` (`engine.deps.eventBus.emit(name, payload)`) for strategy-specific emits.
3. `DEBATE_ROUND_ENDED` — `:246`.
4. `DEBATE_SESSION_PAUSED` — `:263` (if paused mid-round).
5. `DEBATE_ROUND_EARLY_EXIT` — `:286` (governor early exit).
6. `DEBATE_SESSION_FAILED` — `:105` / `:348` / `:464` (`emitOnce`).

**VERIFIED** — all lines confirmed by Grep in `debate-pipeline-builder.ts`.

### 1.3 Consensus & verdict

| Step                               | Emitter                                  | Event                                                                    | Line                                  | Confidence           |
| ---------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------- | -------------------- |
| Consensus reached (runtime)        | `DebatePipelineBuilder`                  | `DEBATE_CONSENSUS_REACHED` (`'debate:runtime:consensus:reached'`)        | `debate-pipeline-builder.ts:383`      | VERIFIED             |
| Governor stop check                | `DebateSyncManager`                      | (internal `governor.shouldStop()`)                                       | `debate-sync-manager.ts:726,746,1004` | VERIFIED             |
| Consensus (domain)                 | `DebateSyncManager`                      | `DEBATE_CONSENSUS` (`'debate:consensus'`)                                | `debate-sync-manager.ts:1012`         | VERIFIED             |
| Verdict generated (runtime→domain) | `DebatePipelineBuilder`                  | `DEBATE_VERDICT_GENERATED` (`'debate:verdict:generated'`) via `emitOnce` | `debate-pipeline-builder.ts:430`      | VERIFIED             |
| Verdict (facade fallback)          | `DebateSyncManager.emitHeuristicVerdict` | `DEBATE_VERDICT_GENERATED` (heuristic)                                   | `debate-sync-manager.ts:559,637`      | VERIFIED             |
| Finalize events                    | `debate-finalizer.emitFinalizeEvents`    | `DEBATE_ENDED` etc.                                                      | `debate-sync-manager.ts:839,892`      | VERIFIED (call site) |

**VERIFIED** — consensus threshold logic at `debate-governor.ts:14` (`CONVERGENCE_THRESHOLD = 85`), `:187` (all recent > 85), `:196` (`shouldStop`).

---

## 2. The `debateLiveStore` Subscription Map

`src/stores/debateLiveStore.ts` — `useDebateLiveStore = create<DebateLiveState>(...)` at `:153`. Every subscription uses `eventBus.onSafe(...)` (VERIFIED).

| Event subscribed                   | Handler line | UI state mutated                                                                    | Confidence |
| ---------------------------------- | ------------ | ----------------------------------------------------------------------------------- | ---------- |
| `DEBATE_AGENT_CHUNK`               | `:155-168`   | streaming buffer per agent (capped 10240 chars, `:168`)                             | VERIFIED   |
| `DEBATE_AGENT_THINKING`            | `:173-208`   | `emotions`/`currentDebater` → 'thinking'; append `agentEvents` (`:201`)             | VERIFIED   |
| `DEBATE_AGENT_RESPONDED`           | `:209-245`   | append `agentEvents` (`:237`, content capped, `:217`); emotion 'responded' (`:232`) | VERIFIED   |
| `DEBATE_AGENT_ERROR`               | `:246-277`   | append `agentEvents` status 'error'; emotion 'error' (`:265`)                       | VERIFIED   |
| `DEBATE_AGENT_TIMEOUT`             | `:279-310`   | append `agentEvents` status 'timeout'; emotion 'timeout' (`:298`)                   | VERIFIED   |
| `DEBATE_AGENT_FALLBACK`            | `:312-346`   | append `agentEvents` status 'fallback'; emotion 'fallback' (`:335`)                 | VERIFIED   |
| `DEBATE_ROUND_STARTED`             | `:348-362`   | `roundEvents` push `{round, nodes}`; `currentRound`                                 | VERIFIED   |
| `DEBATE_ROUND_ENDED`               | `:364-370`   | `roundEvents` push                                                                  | VERIFIED   |
| `DEBATE_MEMORY_CLAIM`              | `:372-389`   | `memoryBoard` map                                                                   | VERIFIED   |
| `DEBATE_CONSENSUS_REACHED`         | `:395-404`   | `consensus = true`, store `set({...})`                                              | VERIFIED   |
| `DEBATE_QUALITY_TECHNIQUE_APPLIED` | `:412-424`   | `appliedQualityAgents` counter (`aqa`, `:417`)                                      | VERIFIED   |
| `DEBATE_QUALITY_IMPACT_COMPUTED`   | `:431-443`   | quality impact map                                                                  | VERIFIED   |

**VERIFIED** — every subscription line above was confirmed by Grep in `debateLiveStore.ts`. Note the store subscribes to **runtime** events (`DEBATE_AGENT_*`, `DEBATE_ROUND_*`, `DEBATE_CONSENSUS_REACHED`) — it does **not** subscribe to the domain `DEBATE_STARTED`/`DEBATE_VERDICT_GENERATED`/`DEBATE_CONSENSUS` directly. Those domain events are surfaced through other stores/components (e.g., `DebateVerdictPanel`, `activeDebateStore`).

---

## 3. Streaming / Thinking / Emotion Lifecycle

**Streaming:** `DEBATE_AGENT_CHUNK` (`:155`) appends to a per-agent string buffer, capped at 10240 chars (`:168`). The chunk event is part of the runtime 24-event set (`event-registry.ts:601`, `'debate:runtime:agent:chunk'`). **VERIFIED.**

**Thinking:** On `DEBATE_AGENT_THINKING` (`:173`) the store sets `currentDebater = agentId` and `emotions[key]='thinking'`, then calls `computeEmotion(ek,'thinking',s.agentEvents)` (`:193,196`). **VERIFIED.**

**Responded:** On `DEBATE_AGENT_RESPONDED` (`:209`) the agent event is appended (content explicitly **not rendered** — only stored/capped, `:217`), and emotion transitions to `'responded'` (`:232`). **VERIFIED.**

**Error / Timeout / Fallback:** each appends an `agentEvents` entry with the respective `status` and updates `emotions` (`:265`,`:298`,`:335`). A derived `DEBATE_UPDATED` emit (`:454-457`) reports counts (`agentEventCount`, error/timeout/fallback counts). **VERIFIED.**

> OPINION: The `agentEvents[].content` is capped and explicitly "not rendered anywhere" (`:217`). This means the live transcript text the user actually reads must come from elsewhere (the arena component reading the engine/active store, or the chunk buffer), not from `agentEvents`. This is a subtle data-flow split worth a follow-up: the live store carries _signals_ (emotion/status) but not the rendered transcript.

---

## 4. Gaps — Events Emitted but Not Surfaced

| Gap                                                                            | Evidence                                          | Confidence                                            |
| ------------------------------------------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------- |
| `DEBATE_AGENT_CHUNK` buffered but render path unclear                          | `debateLiveStore.ts:155-168`                      | VERIFIED buffer; INFERRED render path external        |
| Domain `DEBATE_VERDICT_GENERATED` not directly consumed by live store          | live store subscribes only to runtime events (§2) | VERIFIED                                              |
| `DEBATE_QUALITY_TECHNIQUE_APPLIED` only increments a counter                   | `:412-424`                                        | VERIFIED (no detail UI in store)                      |
| `DEBATE_MEMORY_CLAIM` stored in `memoryBoard` but no verified viewer component | `:372-389`                                        | VERIFIED store; INFERRED viewer (`DebateMemoryPanel`) |

---

## 5. Backend Capabilities With No UI (Live Audit Perspective)

During a live run these engine methods execute but are **never user-triggered**:

| Method           | Line                                                 | Called by                                       | UI entry             | Confidence                              |
| ---------------- | ---------------------------------------------------- | ----------------------------------------------- | -------------------- | --------------------------------------- |
| `saveSnapshot`   | `debate-engine.ts:697` (facade calls `:543,752,946`) | auto on stop/finalize                           | none (auto only)     | VERIFIED                                |
| `restoreSession` | `debate-engine.ts:701`                               | nowhere in UI                                   | **0 component refs** | VERIFIED (grep `src/components` → none) |
| `dumpSizes`      | `debate-engine.ts:719`                               | `debate-sync-manager.ts:963` (internal metrics) | none                 | VERIFIED                                |

**VERIFIED** — `grep` for `restoreSession|engine.saveSnapshot|dumpSizes` across `src/components` returned no matches.

> INFERRED: Because `restoreSession` is never called from the UI, the "resume a crashed debate from its last snapshot" capability is effectively dead from a user standpoint — snapshots are written (on stop/finalize) but never read back through any screen.

---

## 6. Latency / Heap Notes

- **Streaming load:** Per the AGENTS.md runtime-hardening log, `event-recorder.ts` now filters noisy streaming events (`debate:runtime:agent:chunk`, `agent:thinking`, `stream:*`, `chat:stream:*`) from WAL/Dexie and caps the WAL tail at 300 events with 1000ms debounced persistence. This directly reduces the live-debate heap (was ~1.2GB OOM during 10-agent debates). **VERIFIED via AGENTS.md** (cited as runtime fix).
- **Chunk buffer cap:** `debateLiveStore.ts:168` caps per-agent streaming at 10240 chars — bounds store memory growth during long generations. **VERIFIED.**
- **`agentEvents` cap:** `MAX_AGENT_EVENTS` slice (`:201`,`:237`,`:270`,`:303`,`:340`) bounds the event log. **VERIFIED.**
- **Provider timeout:** debate LLM caller uses `getLargeModelTimeoutMs` window; adapters now set HTTP timeout ≥120s so the caller's own retryable `RequestTimedOut` wins (AGENTS.md provider-timeout fixes). **VERIFIED via AGENTS.md** — relevant to live-run latency/turn-loss.

> OPINION: The live store is well-bounded for memory, but the split between "signals in live store" and "transcript elsewhere" (§3) makes it hard to reason about end-to-end latency of the _visible_ text. A single source of truth for the live transcript would simplify both the store and the arena.

---

## 7. Summary of Verified Findings

1. Live emission chain is **two-tier**: facade `debate:*` domain + pipeline `debate:runtime:*` stream; both verified with exact lines.
2. `debateLiveStore` subscribes to **12** runtime event types (§2 table), all `onSafe`, all VERIFIED.
3. Streaming/thinking/emotion lifecycle is fully mapped and VERIFIED; transcript render path is INFERRED external.
4. `restoreSession`/`saveSnapshot`/`dumpSizes` have **no UI entry** — VERIFIED by grep.
5. Heap/latency hardening is real (AGENTS.md) and the live store has explicit caps (VERIFIED).

---

_Confidence legend: VERIFIED = confirmed by Read/Grep this session; INFERRED = deduced; OPINION = recommendation._
