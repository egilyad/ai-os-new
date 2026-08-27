# 13 — DEBATE REPLAY (Live vs Replay vs Post-Mortem)

> RESEARCH-ONLY. Read-only. Subsystem: Debate (runtime + persistence + UI).
> Every claim carries `file:line` + `VERIFIED` / `INFERRED` / `OPINION`.
> Focus: the gap between the _real_ replay path (`DebateReplayPanel`) and what users expect.

---

## 0. Three modes at a glance

| Mode            | What it is                                    | Source of truth                               | Code                                                                                            |
| --------------- | --------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **LIVE**        | Watch a debate as it runs                     | `debateLiveStore` (event-stream, transient)   | `src/stores/debateLiveStore.ts`                                                                 |
| **REPLAY**      | Step/play back a finished debate              | `DebateTimeline` → localStorage (max 500)     | `src/components/DebateReplayPanel.tsx`, `src/kernel/services/debate-runtime/debate-timeline.ts` |
| **POST-MORTEM** | Analyze a finished debate's arguments/quality | `DebateSession.arguments` + quality collector | `src/components/DebateAnalysisPanel.tsx`, `DebateQualityPanel.tsx`                              |

Critical fact: **REPLAY and POST-MORTEM read different things**, and REPLAY's source is **disjoint** from the Dexie `debateTimeline` table. (VERIFIED below.)

---

## 1. LIVE (current, VERIFIED)

- Store: `useDebateLiveStore` subscribes to ~12 `debate:runtime:*` events (`debateLiveStore.ts:154-444`). Transient, no persistence (`debateLiveStore.ts:446`).
- Rendered by the live arena (`DebateArena`, per AGENTS.md shared evidence) reading `agentEvents`, `roundEvents`, `streamingContent`, `emotions`, `judgeWeights`, etc.
- This is the _projection_ described in `11_DEBATE_LIVE_DESIGN.md`. See that file for tiers.

---

## 2. REPLAY — what works (VERIFIED)

### 2.1 Surface

`DebateReplayPanel.tsx` is the real replay UI (do NOT confuse with the mislabeled "Replay" button in `DebatePanel.tsx:328-338`, which _re-runs_ a new debate — see §5).

### 2.2 Session list + polling

- Polls `debateEngine.getAllSessions()` every **5 seconds** (`DebateReplayPanel.tsx:33`, `usePolling`).
- On select: `debateEngine.getTimeline(id)` (`DebateReplayPanel.tsx:37`).

### 2.3 Transport — `TimelinePlayer`

`DebateReplayTypes.ts:59-190` implements `TimelinePlayer` with:

- `play()` (`:78`), `pause()` (`:87`), `stop()` (`:94`)
- `stepForward()` / `stepBackward()` (`:101`,`:113`) — single-event stepping
- `jumpTo(index)` (`:128`) — **jump to event INDEX** (numeric)
- `setSpeed(speed)` (`:138`) and `setStepMode('auto'|'manual')` (`:142`)
- `onEvent` / `onRewind` / `onStatusChange` callbacks (`:150-158`)

So: **play / pause / step / jump-to-event-INDEX / speed** all work. (VERIFIED)

### 2.4 Visible events rendered

`visibleEvents` (`DebateReplayPanel.tsx:104-182`) maps timeline entries to a feed. It handles: `round:start`, `agent:responded`, `round:end`, `session:completed/failed/cancelled`, `agent:error`. Round label is recomputed by scanning backward for `round:start` (`:191-200`).

---

## 3. REPLAY — what is broken (VERIFIED)

### 3.1 Source is localStorage, DISJOINT from Dexie `debateTimeline`

- `debateEngine.getTimeline(id)` → `getContext(sessionId).timeline.getEntries(sessionId)` (`debate-engine.ts:705-707`).
- That `timeline` is a `DebateTimeline` instance whose `persist()` writes to **localStorage** via `BucketStorageAdapter.RESEARCH` (`debate-timeline.ts:45,63`), keeping **last 500 entries** (`:61`).
- Separately, `session-manager-service.ts:475-490` `addTimelineEntry()` writes to the **Dexie `debateTimeline` table** via `timelineRepo.put` (`:483`). That table is NOT what `DebateReplayPanel` reads.
- → **Two parallel, non-connected timeline stores.** Replay reads localStorage; the Dexie `debateTimeline` is populated but never consumed by the replay UI. (VERIFIED)

### 3.2 Consensus is a dead branch

- `DebateReplayPanel.tsx:170` reads `e.type === 'consensus:reached'` and renders "Consensus reached".
- But the timeline only ever records these types (pipeline-builder): `round:start`, `agent:responded`, `agent:error`, `round:end`, `session:completed/failed/cancelled` (`debate-pipeline-builder.ts:166-169,212-237`). The recorded `type` is `event.type` (e.g. `debate:runtime:consensus:reached` if it were emitted), **not** the bare `consensus:reached` the panel checks.
- Grep confirms **nothing records the literal `'consensus:reached'` string** in `debate-runtime/` (only `debate-memory-extractor.ts:87` _reads_ it, and `debate-timeline.ts` is the class). The `DEBATE_CONSENSUS_REACHED` event (`event-registry.ts:625-633`) updates the _live_ `judgeWeights` (`debateLiveStore.ts:390-403`) but is **never written into the replay timeline**.
- → The `consensus:reached` branch in the replay panel is **dead**. (VERIFIED)

### 3.3 Verdict & consensus bypass the replay timeline

- Verdict is generated and **cached in memory only** (`debate-sync-manager.ts:62,78,176-184`); it is _not_ appended to the timeline. `DEBATE_VERDICT_GENERATED` (`event-registry.ts:825-828`) is a domain event consumed by bridges (Crystal/Forum), not by the replay store.
- Consensus lives only in the live `judgeWeights` (§3.2). Once the session ends, neither verdict nor consensus is in the replayable timeline.
- → Replay cannot show the **outcome** of the debate, only the argument stream. (VERIFIED)

### 3.4 No semantic seek

- `TimelinePlayer.jumpTo(index)` accepts a **numeric index only** (`DebateReplayTypes.ts:128`). There is no `jumpToRound(n)`, `jumpToAgent(id)`, `jumpToCognitive()`, or `jumpToEvidence()`.
- `visibleEvents` computes a round label but provides no clickable seek-by-round/agent.
- → "Jump to event INDEX" works; "jump to round 3" / "jump to Agent-7's first claim" does not. (VERIFIED)

### 3.5 Content truncation

- `debate-timeline.ts:19-31` truncates `agent:responded` content to **500 chars** in persistence. Replay therefore shows abbreviated arguments. (VERIFIED)

---

## 4. POST-MORTEM (analysis, VERIFIED)

Two panels analyze a _finished_ debate, but they read the **session record**, not the replay timeline:

- **`DebateAnalysisPanel.tsx`** — calls `analyzeDebate(...)` from `kernel/utils/debate-analysis` (`:7`), feeding `session.arguments` (`:51`). Renders StatCards / FallacyCards / PersuasionCards / ToneChart (`:10`). Session selection falls back to `sessionManager.getDebateHistory()` (`:48`).
- **`DebateQualityPanel.tsx`** — quality-technique settings + impact metrics via `qualityImpactCollector` and `getTechniques()` (`:10-14`); toggles P0/P1/P2 techniques.

These are **capability-complete for argument/quality analysis** but are a _separate surface_ from Replay. A user must leave Replay to get the verdict/stance view. (VERIFIED)

---

## 5. The mislabeled "Replay" button (VERIFIED)

`DebatePanel.tsx:328` `handleReplay` → `:337` `queueMicrotask(() => handleStart())`. `handleStart` (`:221`) starts a **new** debate. So the button titled "Replay" actually launches a fresh run. The genuine replay surface is `DebateReplayPanel` (route `replay`). Recommendation: relabel + add a real "Open Replay" link (OPINION, UX-only).

---

## 6. Gap analysis table

| #   | Gap                                                               | Severity    | Evidence                                                          |
| --- | ----------------------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| G1  | Replay source (localStorage) disjoint from Dexie `debateTimeline` | High        | `debate-timeline.ts:45,63`; `session-manager-service.ts:483`      |
| G2  | `consensus:reached` dead branch in replay                         | High        | `DebateReplayPanel.tsx:170`; `debate-pipeline-builder.ts:166-237` |
| G3  | Verdict/consensus absent from replay                              | High        | `debate-sync-manager.ts:62,78,176-184`                            |
| G4  | No semantic seek (round/agent/cognitive/evidence)                 | Medium      | `DebateReplayTypes.ts:128`                                        |
| G5  | Argument content truncated to 500 chars                           | Low         | `debate-timeline.ts:19-31`                                        |
| G6  | Mislabeled "Replay" button re-runs debate                         | Medium (UX) | `DebatePanel.tsx:328,337`                                         |
| G7  | Post-mortem is a separate surface from replay                     | Medium      | `DebateAnalysisPanel.tsx:7,51`                                    |

---

## 7. Recommendations (REUSE existing tables/events — no new engine)

### R1 — Unify replay source onto Dexie `debateTimeline` + `eventLog` (addresses G1)

- Make `DebateReplayPanel` read `sessionManager.getTimeline(id)` (`session-manager-service.ts:486-490`) instead of `debateEngine.getTimeline(id)`.
- Continue populating `debateTimeline` via `addTimelineEntry` (already wired at `:483`). This removes the localStorage/Dexie split with **zero new storage**. VERIFIED substrate; wiring is OPINION.

### R2 — Record consensus & verdict into the timeline (addresses G2, G3)

- In the phase/verdict handler, call `sessionManager.addTimelineEntry(sessionId, 'consensus:reached', ...)` when `DEBATE_CONSENSUS_REACHED` fires, and `'verdict:generated'` with a verdict summary when `DEBATE_VERDICT_GENERATED` fires (`debate-sync-manager.ts:637`, `event-registry.ts:825-828`).
- This makes `DebateReplayPanel.tsx:170`'s branch **live** and adds an outcome marker — no new event, just new timeline `type` strings consumed by the existing `visibleEvents` switch (`:104-182`). VERIFIED types; addition OPINION.

### R3 — Add semantic seek (addresses G4)

- Extend `TimelinePlayer` with `jumpToRound(n)` / `jumpToAgent(id)` that scan `entries` and call existing `jumpTo(index)` (`DebateReplayTypes.ts:128`). Pure logic on already-stored `round`/`agentId` fields. VERIFIED fields (`debate-pipeline-builder.ts:212-219` records `round` + `agentId`).

### R4 — Stance comparison in replay (addresses G3)

- The verdict already carries `stanceResult` + `keyArguments[].stance` (`debate-conclusion-engine.ts:60-83,173-185`). A "stance comparison" strip can be derived from the verdict record (Dexie `debateVerdicts`) without new storage. OPINION view; data VERIFIED.

### R5 — Fix the mislabeled button (addresses G6)

- Relabel `handleReplay` to "Run again"; add "Open Replay" navigation to `DebateReplayPanel`. OPINION/UX.

### R6 — Link Post-Mortem from Replay (addresses G7)

- Add a "Analyze" button in `DebateReplayPanel` that opens `DebateAnalysisPanel` for the selected `sessionId`. Both already exist; only navigation glue. OPINION.

---

## 8. Non-recommendations

- Do **not** build a new replay engine. `TimelinePlayer` (`DebateReplayTypes.ts:59-190`) already covers play/pause/step/speed/jump.
- Do **not** add new Dexie tables. `debateTimeline` + `debateVerdicts` + `eventLog` suffice for R1–R4.
- Do **not** change the live store (§1) — LIVE and REPLAY are correctly separated (transient vs persisted).
