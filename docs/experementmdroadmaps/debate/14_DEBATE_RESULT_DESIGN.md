# 14 — DEBATE RESULT DESIGN (Presentation & Downstream Flow)

> RESEARCH-ONLY. Read-only. Subsystem: Debate results (verdict) + downstream integrations.
> Every claim carries `file:line` + `VERIFIED` / `INFERRED` / `OPINION`.

---

## 0. Scope

How debate **results** (the verdict) are currently presented, and where they _should_ flow. Three parts:

1. Current result surfaces (panels, caches, Dexie).
2. The verdict object shape (from the conclusion engine).
3. Result distribution to Crystal / Forum / Invocation — and the _missing_ Notification path.
4. Design proposal: a unified "Debate Result" view + a result→integration router.

---

## 1. Current result surfaces (VERIFIED)

### 1.1 `DebateAnalysisPanel` (argument-level analysis)

- Imports `analyzeDebate` from `kernel/utils/debate-analysis` (`DebateAnalysisPanel.tsx:7`).
- Feeds `session.arguments` (`DebateAnalysisPanel.tsx:51`); falls back to `sessionManager.getDebateHistory()` (`:48`).
- Renders StatCard / FallacyCard / PersuasionCard / ToneChart (`:10`).
- **This is analysis of arguments, not the verdict object.** It does not display `DebateVerdict` directly. (VERIFIED)

### 1.2 `DebateQualityPanel` (quality techniques/impact)

- Reads `getTechniques()`, `qualityImpactCollector`, settings (`DebateQualityPanel.tsx:10-14`).
- Toggle UI for P0/P1/P2 quality techniques (`:31-41`).
- Quality _impact_ is also streamed live to `debateLiveStore.recentQualityEvents` (`debateLiveStore.ts:405-443`). (VERIFIED)

### 1.3 Verdict cache (in-memory, active session only)

- `debate-sync-manager.ts:62` `_verdictCache = new Map<string, DebateVerdict>()`; capped at `MAX_VERDICT_CACHE` (`:79-83`).
- `DEBATE_VERDICT_GENERATED` handler **only caches for the active session** (`:176-184` comment: "Only cache verdicts for the active session").
- `getCachedVerdict(sessionId)` (`:111-113`) reads it; `clearVerdictCache()` (`:116-118`) clears between tournament matches.
- → Verdict is **not** durably presented to the user by the sync manager; it lives in memory and is handed to bridges. (VERIFIED)

### 1.4 Dexie `debateVerdicts` table (durable store)

- `validateAndSaveVerdict(store, verdict)` → `store.saveVerdict(verdict)` (`debate-conclusion-engine.ts:573-583`), gated by `DebateVerdictRecordSchema.safeParse` (`:577`).
- Schema `DebateVerdictRecordSchema` lives in `types/schema-types` (`:11`).
- → The durable verdict record exists; the _UI_ that reads it back for presentation is the gap (see §5). (VERIFIED)

---

## 2. Verdict object shape (VERIFIED)

Produced by `DebateConclusionEngine.generateVerdict(snapshot, timeline)` (`debate-conclusion-engine.ts:60-84`):

```
DebateVerdict {
  sessionId:     string
  topic:         string
  summary:       string                       // human-readable outcome
  conclusionType:ConclusionType               // consensus|dominance|stalemate|partial_agreement|inconclusive
  stanceResult:  StanceResult                 // pro_wins|con_wins|balanced|no_clear_winner
  keyArguments:  VerdictKeyArgument[]         // winning/supporting arguments
  reasoning:     string
  confidence:    number                      // 0.3..0.95 heuristic
  generatedAt:   number
  roundsTotal:   number
  totalTokens:   number
}
```

- `VerdictKeyArgument` (`:101-107`): `{ agentId, agentName, content (≤500), stance: 'pro'|'con'|'neutral', strength }`.
- `conclusionType` derived in `determineConclusionType` (`:157-171`): `dominantRatio>0.75→dominance`; mixed `<0.6→partial_agreement`; both sides →`consensus`; else `stalemate`; empty/low-token →`inconclusive`.
- `stanceResult` derived in `determineStanceResult` (`:173-185`) from summed pro/con `strength`.
- LLM-enhanced variant `generateVerdictWithLLM` (`:244-353`) merges Pro/Con/Neutral judge perspectives but returns the same `DebateVerdict` shape (`:328-335`).
- Feedback log `recordFeedback` / `getFeedbackStats` (`:433-450`) exist but are **not** wired to any panel in the read files. (VERIFIED)

---

## 3. Result distribution (VERIFIED)

### 3.1 → Crystal (auto-propose)

- `CrystalDebateBridge.init()` subscribes to `DEBATE_VERDICT_GENERATED` (`crystal-debate-bridge.ts:27-36`).
- `onVerdict` (`:44-87`): skips if handled; requires `statement.length ≥ 24` (`:49`); splits `keyArguments` into pro/con (`:51-58`); calls `crystalVault.propose(...)` (`:61-73`) then `crystalVault.validate(...)` (`:75-81`).
- Confidence gate: comment at `:13` — verdicts with confidence **≥ 0.55** become a 'semi' (validated) crystal. (VERIFIED)

### 3.2 → Forum case-study

- `phase18-forum.ts:47-64` `wireForumBridge` subscribes to `DEBATE_VERDICT_GENERATED` (`:49`); on fire, `ensureTopic(forum,'case-study',...)` (`:53`) then `forum.postMessage(topicId, SYSTEM_AUTHOR, "Итог дебатов … вердикт (авто-пост)")` (`:54-58`).
- → A short auto-post, **not** the full verdict. (VERIFIED)

### 3.3 → Invocation `sessionRef`

- `phase21-invocation.ts:75-87`: when `mode === 'debate'`, `this.debate.startDebate(...)` is called and the delegate returns `{ kind: 'debate', ref: session.id }` (`:86`).
- → The invocation record's `sessionRef` points back at the debate session id; the verdict is reachable via that ref. (VERIFIED)

### 3.4 → NOT Notifications (start-only)

- `debate-sync-manager.ts:389` emits `EVENTS.NOTIFICATION` with message `"Debate started: …"` — **only on start** (`:389-392`).
- There is **no** notification emission on `DEBATE_VERDICT_GENERATED`. The verdict handler at `:176-184` only caches. (VERIFIED — verdict is intentionally not surfaced as a notification.)

### 3.5 Distribution flow (ASCII)

```
                 DEBATE_VERDICT_GENERATED  (event-registry.ts:825)
                                │
            ┌───────────────────┼───────────────────────┐
            ▼                   ▼                        ▼
   CrystalDebateBridge    ForumBridge            (none → Notifications)
   (crystal-debate-       (phase18-forum.ts:47)  debate-sync-manager.ts:389
    bridge.ts:27)                                    emits ONLY on start
            │                   │
   propose+validate       postMessage to
   (conf ≥0.55)           'case-study' topic
            │
   Dexie crystals table
            │
   Invocation (phase21:75-87) → startDebate → sessionRef = session.id
```

---

## 4. The presentation gap (VERIFIED → OPINION)

- The verdict is **generated, cached, persisted (Dexie `debateVerdicts`), and fanned out to Crystal/Forum/Invocation** — but there is **no single UI surface that shows the verdict + stances + key arguments + downstream links** together.
- `DebateAnalysisPanel` analyzes arguments but does not render `DebateVerdict` (§1.1). `DebateQualityPanel` is about techniques (§1.2). Replay cannot show the verdict (see `13_DEBATE_REPLAY.md` §3.3).
- → Users must manually cross-reference Crystal/Forum to see outcomes. (VERIFIED gap; OPINION to fix.)

---

## 5. Design proposal — unified "Debate Result" view (OPINION)

A single read-only view, fed entirely by **existing** data (no new engine/table):

```
┌──────────────────────────────────────────────────────────────┐
│  Debate Result — "Should we migrate to Rust?"                 │
├──────────────────────────────────────────────────────────────┤
│  Conclusion: consensus        Stance: pro_wins   Conf: 0.81  │
│  Summary: участники пришли к общему мнению…                   │
├──────────────────────────────────────────────────────────────┤
│  Winning arguments (pro)            Winning arguments (con)   │
│  • Agent-3: "borrow checker…"      • Agent-7: "rewrite cost" │
│  • Agent-9: "memory safety…"        (strength 0.7)            │
├──────────────────────────────────────────────────────────────┤
│  Stance comparison:  pro 62% │ con 24% │ neutral 14%         │
│  Evidence: keyArguments[].content (≤500)                      │
├──────────────────────────────────────────────────────────────┤
│  Downstream links:                                            │
│  💎 Crystal: <crystalId> (validated, conf 0.81)               │
│  💬 Forum: case-study/<topicId> (auto-post)                   │
│  🎬 Invocation sessionRef: <sessionId>                        │
└──────────────────────────────────────────────────────────────┘
```

**Data sources (all VERIFIED, reused):**

- Verdict: Dexie `debateVerdicts` (`debate-conclusion-engine.ts:573-583`).
- Stance %: derive from `keyArguments[].stance` + `stanceResult` (`:101-107,173-185`).
- Crystal link: from `CRYSTAL_FORMED` event / `crystal-debate-bridge.ts:83` log.
- Forum link: `phase18-forum.ts:53-58`.
- Invocation ref: `phase21-invocation.ts:86`.

---

## 6. Design proposal — result→integration router (OPINION)

A thin dispatcher that, given a `DebateVerdict`, exposes **explicit, user-triggered** redistribution without duplicating the existing auto-bridges:

```
function routeDebateResult(verdict, targets: ('crystal'|'forum'|'invocation')[]) {
  if (targets.includes('crystal')) crystalVault.propose+validate(verdict)   // crystal-debate-bridge.ts:61-81
  if (targets.includes('forum'))    forum.postMessage(case-study, verdict)   // phase18-forum.ts:53-58
  if (targets.includes('invocation')) invoke({mode:'debate', ref:verdict.sessionId}) // phase21:75-87
}
```

- The auto-bridges (§3.1–3.3) stay as the **automatic** path. The router adds a **manual re-send** (e.g. "also post to Forum", "create Crystal now") for cases where the auto-bridge was skipped (e.g. `statement.length < 24` guard at `crystal-debate-bridge.ts:49`).
- No new event, no new table — it re-invokes the same services already wired. (OPINION; substrate VERIFIED)

---

## 7. Recommendations summary

| #   | Recommendation                                                      | Reuses                            | Type    |
| --- | ------------------------------------------------------------------- | --------------------------------- | ------- |
| P1  | Add unified "Debate Result" view reading `debateVerdicts` + bridges | existing Dexie + events           | OPINION |
| P2  | Add stance-comparison strip from `keyArguments[].stance`            | verdict shape `:101-107`          | OPINION |
| P3  | Add manual result→integration router (re-send)                      | Crystal/Forum/Invocation services | OPINION |
| P4  | Surface verdict in Replay (link `debateVerdicts` into replay panel) | `13_DEBATE_REPLAY.md` R2/R4       | OPINION |
| P5  | Optional: notify on verdict (today only start notifies, `:389`)     | `EVENTS.NOTIFICATION`             | OPINION |

## 8. Non-recommendations

- Do **not** add a new verdict-storage engine — `debateVerdicts` + `DebateVerdictRecordSchema` already persist the full shape (`debate-conclusion-engine.ts:573-583`).
- Do **not** re-emit `DEBATE_VERDICT_GENERATED` for the router — the existing event (`:825-828`) is sufficient; the router calls services directly.
- Do **not** change the live store for results — verdict is a _post-hoc_ artifact, correctly separated from `debateLiveStore` (transient, `debateLiveStore.ts:446`).
