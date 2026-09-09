# DEBATE SYSTEM AUDIT D1 — Full Forensic Audit (STATICALLY VERIFIED)

> Дата: 2026-09-07. Scope: `Council`/`Debate`/`DebateEngine`/`CouncilService`/`FormatService`/`ArgTech`/`Judging`/`Evidence`/`Persistence`/`Events`/`UI` (~195 commits, 63 phases). Тип: **forensic audit, НИЧЕГО НЕ РЕАЛИЗОВЫВАТЬ**. Статус: `STATICALLY VERIFIED / RUNTIME-PENDING`.

---

## 1. Executive Summary

**Council** — additive aggregate over `councilSessions/Messages/Votes` (Dexie v24, 3 tables), 5-step lifecycle `proposal→fact_gathering→debate→consensus→completed`, 4 роли+Judge, `Proposal→Forum/Whisper double-blind`, **Maturity C (partial, no resume/retry)**. **Debate Engine** — mature `11-state machine` (`created→…→completed|failed|cancelled`, `StateMachine` guards, `distributedLock`, `paused resume`, `BucketStorageAdapter`), 30+ injected services, `streamMessage` + `DLQ` + `timeout/abort` — **Maturity A**.

**Критичные находки:** `ArgTech (Dung/Toulmin/Brier/Kialo)` код есть (`argtech-service.ts:50`) но **0 callers** (не вызывается из `debate-engine`/`council-service`/`graph`) — `F doc/code-only`; `CouncilPanel/FleetPanel` компоненты **не найдены на диске** (routes `fleet-councils` lazy без файлов) — `F doc-only`; `Evidence/Provenance` chain разорван (`FactPacket` как `vote kind=fact` truncated 280, `provenanceNodes/Edges` таблицы не wired); `Council lifecycle` без `FAILED/PAUSED/RESUME/CANCEL`.

**GAPs:** 11 GAPs (GAP-01 ArgTech dead code → GAP-11 duplicate stores). **P0×2, P1×4, P2×3, P3×2.** `PRE-RUNTIME` 5, `RUNTIME-PENDING` 6.

---

## 2. Current Architecture

**Wiring (проверено по коду, не по названию):**

```
User → Fleet → Councils (? missing panel)
  ↓ useCouncilStore.refresh → CouncilService (phase24: registers councilRepository + councilService)
  ↓ CouncilService.createSession → CouncilRepository.putSession → Dexie councilSessions/Messages/Votes
  ↓ CouncilService.postMessage (forum/whisper, double-blind alias) / submitProposal (LlmCouncilPort.draftStance advisory) / submitFact (FactPacket→vote)
  ↓ advancePhase (proposal→fact_gathering→debate→consensus→completed) → conclude (weighted tally)
  ↓ GraphService delegate runCouncil (node kind council → CouncilService) — fallback [label] council-simulated
  ↓ DebateEngine (parallel, mature, phase3:30+ injections) — separate path via ConversationBackedDebateOrchestrator (legacy DebateOrchestrator preserved not wired index.ts:24)
  ↓ LLM: Council LlmCouncilPort (draftStance/judgeRound via llm-task-executor) vs Debate debateCallLlm (providerResolver + streamMessage + cacheScope{agentId,sessionId,role} + entanglement + DLQ)
  ↓ Events: COUNCIL_* (10) + DEBATE_* (30+) → councilStore (6 subs) + debateLiveStore (12 subs) + Timeline (DebateTimeline via BucketStorage research)
```

| Hop | Caller | Callee | Data | State | Events | Gap |
|-----|--------|--------|------|-------|--------|-----|
| UI→Service | `councilStore:listSessions` | `CouncilService→Repository.getSession` | `CouncilSession` | Dexie + Engine Map | `council:*` 1577 | Panel missing |
| Service→Persist | `putSession` | `db.councilSessions|Messages|Votes` | `facts as votes kind=fact pickId=claim.slice(0,280)` | Dexie `super_agents_os_v4` | — | truncation lossy |
| Engine→LLM | `DebateEngine.callLLM` | `debateCallLlm→providerResolver→Adapter` | `AdapterMessage[] + cacheScope` | `_preflightingProviders, sessionAbortControllers` | `DEBATE_AGENT_*` | Council LLM advisory only |

**Files:** `phase24-council.ts:20`, `council-service.ts:47`, `council-types.ts:33`, `council-lenses.ts:23`, `council-graph-node.ts:27`, `llm-task-executor.ts:117`, `debate-engine.ts:49`, `debate-orchestrator.ts:114`, `graph-service.ts:475`, `event-registry.ts:1577`, `dexie-schema.ts:915`.

**Maturity:** Council B–C (isolated), Debate A, Council↔Graph C (optional fallback string).

---

## 3. Runtime Lifecycle

**Council DOCUMENTED vs IMPLEMENTED:**

- Doc: `proposal → fact_gathering → debate → consensus → completed|aborted` (`council-types.ts:13`).
- Implemented: `advancePhase:268` map `proposal→fact_gathering|debate` → `debate→consensus→completed` + auto `submitFact→fact_gathering→debate:202` + `postMessage→debate→consensus:233`. Guard `assertPhase:424` + `status!==running`. **No retry/resume/cancel/FAILED/PAUSED, no persisted snapshot.**
- Wire: `phase24` + `setLlmPort`, Runtime: `COUNCIL_*` + Dexie put, **no resume**.

**Debate Machine (mature):**

- Contract `debate-types.ts:15` 11 states `created→queued→initializing→active→deliberating↔paused→consensus→summarizing→completed|failed|cancelled`, `StateMachine:73` guards `addGuard:222`, `can:93`, `send re-entrant block:124`, `onBefore/After:190`, timeout `sessionTimeoutTimers:357`, `distributedLock:365`, `pause:585` aborts agents, `cancelSession:655`, zombie restore `_restoreOrphanedSessions:204`.

|  | Doc | Impl | Wired | Runtime |
|---|---|---|---|---|
| Council | 6 phases | 5-step +3 auto | phase24 | `COUNCIL_PHASE/COMPLETED` + Dexie, **no resume** |
| Debate | 11 phases | full SM + hooks | phase3 | `DEBATE_SESSION_* + CONSENSUS_REACHED` + `PersistenceManager` + paused restore |

**GAP:** Council no `FAILED/PAUSED/RESUME/retry/distributedLock` — `throw` or `abort` only.

---

## 4. Participant / Role Model

**Define:** `CouncilRoleKind proponent|opponent|researcher|fact_checker|judge|moderator` (`council-types.ts:23`), default 4 participants `council-service.ts:84`, lens 14 (`council-lenses.ts:23`) + polarity 4 (`110`), `CouncilJudge weight,dimensions` (`43`), `buildParticipantPrompt:160` = `[Lens]+[Polarity]+[Role] you are ${name}`.

| Kind | Evidence | Classification |
|------|----------|----------------|
| `proponent/opponent` | same codepath, lens `steelman vs devil` | **C partial** (B config) |
| `researcher/fact_checker` | only ones can `submitFact` guard `189` | **C** |
| `judge` | multi-judge weight default 1 `100`, blind alias `432` | **C** (trivial tally) |
| `moderator` | can submit facts, no moderation logic | **D stub** |

**Tools:** Council none (only `forum|whisper`); Debate 35+ via `LlmCallerDeps:102` wired `phase3:587`. **Memory:** Council `facts[]+messages[]` arrays `113`, Debate `DebateMemory + RAG + InsightBus`. **Model:** Council `modelFor(agentId)` optional `llm-task-executor.ts:52`, Debate `providerResolver + Budget`.

**Wire:** No per-role LLM selection UI. **Maturity C.**

---

## 5. Argumentation / ArgTech (Dung/Toulmin/Brier/Kialo)

**Defined:** `argtech-service.ts:50` `IArgTechService` (`debateplus.ts:27`): `Dung grounded/preferred, Toulmin, Brier forecast/resolve, Kialo plantThesis/branchClaim/treeScore`.

**Called?** **0 imports** outside `phase39-debateplus.ts:36` — not referenced in `debate-engine.ts`, `council-service.ts`, `graph-service.ts`. Only self events `DUNG_ATTACK:106`, `TOULMIN_CARD:242`, `BRIER_RESOLVED:271`.

**Influences result?** **No.** `groundedExtension:110` fixed-point, `preferredExtensions:137` brute `≤12` **DUPLICATED** copy-paste `137` vs `173` (second wins dead code), `createToulmin:210` weights `0.3+0.25+0.15+0.1+0.2`, `forecast:250` Brier `Σ(p-o)²/n`, `treeScore:322` `weight=(impact/5)*(1+min(votes,10)/10)+0.5*score(child)`.

**Persisted?** **KV-only** `dal.kv.set('dung/*|toulmin/*|brier/*|claimtree/*')` — no Dexie tables (`dexie-schema.ts` has none). **UI:** none.

**Maturity:** Dung B–C but **Wire F doc/code-only, Runtime false** — classic dead code. Evidence duplicate lines `137-208`.

---

## 6. Judging / Consensus

**Council:** 1 default Blind Judge `council-service.ts:100` dimensions `logic,evidence,clarity`, `submitJudgeScore:287` stores `JudgeScore{blind, winnerId}`, `conclude:338` weighted tally `tally.set(winnerId, +w)` + audience tie-break `352` counts `pickId`, tie `best===0 → draw` else first max wins — no tie resolver, **no confidence**.

**Debate:** `DebateConsensusEngine.evaluate:53` `debate-consensus.ts:44` — embeddings `FNV+cosine≥0.6` agreements, antonym/negation conflicts, `confidence=(agreementScore+avgClaimConf)/2 -0.3*unresolvedRate +0.1*resolvedBonus`. `DebateEvaluator.scoreArguments:67` keyword regex steelman/rebuttal + DPO sampler — heuristic not LLM. **Kialo treeScore:322 not used** in `conclude` nor `consensus`.

**Maturity C** — no isolation, no Brier calibration, no treeScore influence.

---

## 7. Evidence / Fact-Checking / Provenance

**Chain `Claim→Evidence→Source→FactCheck→Verdict`:**

- Council: `FactPacket{claim,verdict:verified|disputed|unverifiable,sources:[]} ` (`61`) via `submitFact:179` → `councilVotes(kind=fact).payload{verdict,sources}` `repository:29` + `pickId=claim.slice(0,280):36` — **truncation lossy, provenance URL collapsed, no verification**.
- Debate: `FactCheckService` wired `phase3:248` via LLM + `Triangulation/Revelation/ExecutableEvidence` registered `489` but **not called** from `llm-caller enrichment`. `ProvenanceService` wave10 (`trust.ts:64`) `provenanceNodes/Edges` tables unused by debate.

**Break:** Claim(null)→Evidence(blob)→Source(string[] no validation)→FactCheck(isolated)→Verdict(none for council, `DebateVerdict` separate `223`). **Maturity:** Council D stub, Debate fact-check C not on critical path, Provenance F doc unwired. **Wire false.**

---

## 8. LLM / Tool Boundary

**Council Port:** `LlmCouncilPort draftStance:124` advisory try/catch swallow `168` + `judgeRound:133` JSON parse fallback draw `167`, per-agent `modelFor:30`.

**Debate Port:** `debateCallLlm:136` iterations ≤50 `166` + `getMaxRetries:185` + `rejectedCombos Set` + `providerResolver.deleteLlmFailureCount`, backoff `debate-llm-backoff.ts`, `validateEntanglement:514`, `isCrossAgentDuplicate:451`, `getModelTimeout:298` + abort merging `221`, timeout + DLQ.

**ToolRunner:** `LlmCrewExecutor` gated `if(hasTools && toolRunner):88` `runWithTools({agentId,system,maxRounds:2}):93` — **only for Crew**, not Council/Debate. **Search/Web:** `RAGRetriever` hash embed `simpleEmbedText:171` (not vector DB) + `ExpertWitness` heuristic.

**Fallback:** Council echo `[Name] completed: task` `112`, Debate throws `All LLM providers unavailable:281` + `handleDebateCallError:614` alternate keys/model fallback.

**Maturity:** Crew/Council C (tool gate + echo), Debate A (stream, retry, dedup, abort).

---

## 9. Persistence / Resume

**Tables:** Dexie `councilSessions:'id,phase,status,createdAt'`, `councilMessages:'id,sessionId,channel,authorId,createdAt'`, `councilVotes:'id,sessionId,kind,voterId,createdAt'` `dexie-schema.ts:952` v24 `database.ts:393`.

**Session:** `CouncilSessionRecord{participants,judges,aliases,winnerId,summary}` `125`, `putSession:25` splits facts/messages/scores/votes, `getSession:71` re-attaches, `delete:135`, `listSessions:124` **N+1** loop `for r.getSession`.

**Debate contrast:** `DebatePersistenceManager:48` `attemptSave` CAS retry `172`, `pruneArgumentsForSave` heap-aware `96`, `BucketStorageAdapter RESEARCH` `timeline:15`, `saveSnapshot:198` per phase, `_restoreOrphanedSessions:204` + visibility/beforeunload LSM + `deadLetterQueue` + `distributedLock`.

**Resume:** Council **none** (no `restoreSession`, no `pause/resume`, no `version`). Browser reload = Dexie stays but no worker. Debate resumes `resumeSession:619`.

**Maturity:** Council persistence C, Resume D missing.

---

## 10. EventBus / Timeline / Observability

**Bus:** `EventBus` `event-bus.ts:54` — `emit:235` fire-and-forget LOSSY, recursion FIFO `MAX_DEFER_CHAIN=1000:356`, `MAX_PENDING=5000:358`, `strictMode Zod:246` blocks + `pushDeadLetter:320`, `onSafe validation:333`.

**Council events (10):** `COUNCIL_CREATED 1578, PROPOSAL 1588, FACT 1592, MESSAGE 1601, WHISPER 1605, PHASE 1609, JUDGED 1613, VOTE 1622, COMPLETED 1626, ABORTED 1635` — emits `council-service.ts:126,207,251,282,313,330,375,390`.

**Debate events (30+):** `DEBATE_SESSION_* 543`, `ROUND 588`, `AGENT_* 600`, `CONSENSUS_REACHED 629`, `QUALITY_* 1211`, `FORMAT/DUNG 2117`.

**Timeline:** `DebateTimeline:IDebateTimeline` `debate-timeline.ts:34` circular `5000:11`, `truncatePayload 500:20`, `BucketStorage research` `debug only`; **No TIMELINE_MAP**, Council has no timeline class (only `messages[]`). **Subscribers:** `councilStore:23` 6 subs, `debateLiveStore:230` 12 subs, `format/argtech` emit no subs.

**Gaps:** Lossy + `MAX_TIMELINE_CONTENT=500` hides LLM content; Council alias leaks `authorId` real in repo `46`. **Bus A, Council wiring C.**

---

## 11. UI → Runtime Wiring

**Routes:** `CORE_SECTIONS` `route-registry-core.ts:137` `debate`, `debate-live`, `argument-graph` etc, `CONTENT_SECTIONS` `135` `fleet-councils` lazy `gitCompare`.

**Components:** Glob `**/CouncilPanel|FleetPanel` → **0 files** — **doc vs missing**. `councilStore.ts:46` `useCouncilStore {sessions, activeSessionId, refresh:listSessions, select}` only list/select via events `18`, never `postMessage/judge`. `debateLiveStore:230` fully wired live streaming.

**Real vs Seed:** `strawPoll:113` deterministic hash fake, `submitProposal` LLM advisory ignored `168` echo, `FactPacket sources` unverified strings.

**Duplicate:** `register-debate-store-adapters.ts:1` bridges stores.

**Maturity:** Route B, Store C, Panel **F doc-only — file not found**, Fleet **D stub route without component**. **Wire partially (list), post/judge missing.**

---

## 12. Duplicate / Legacy Map

| Artifact | Location | Rec | Rationale |
|----------|----------|-----|-----------|
| `DebateOrchestrator` legacy | `debate-orchestrator.ts:26` comment `index.ts:24 legacy preserved not wired` | **DEPRECATE** keep 1 wave then delete | `createDebateOrchestrator` returns `ConversationBacked` only |
| `DebateSyncManager(debateService)` vs `DebateEngine` | `phase3:281` | **ADAPTER** | Dual-path wrap engine + `EMPTY_DEBATE_STORE` throw shim `187` |
| 4 stores `debateLiveStore/activeDebateStore/debate-session-store/councilStore` | `stores/*` | **MIGRATE** to single `DebateStore` + adapter | `register-debate-store-adapters` already adapter |
| `Council lenses` vs `Debate archetypes/historical` | `council-lenses vs debate-archetypes` | **KEEP** dedup prompt helper | Both B data-only, overlap → shared `lens-engine` Phase13 |
| `ArgTech preferredExtensions` double | `argtech-service.ts:137` vs `173` | **MIGRATE** fix duplicate then KEEP | Brute copy-paste dead code |
| `Trust/Provenance/Ecosystem` vs unused facts | `trust.ts`, `provenanceNodes` | **ADAPTER** | Wire council facts → provenance or deprecate |
| `QualityImpactCollector+ExperimentEngine` | `phase3:233` | **KEEP** | wired `debateLiveStore:485` |

---

## 13. Capability Matrix (A runtime verified → G missing)

| Capability | Exists | Integrated | Runtime | Persistence | UI | Maturity | Evidence |
|------------|--------|------------|---------|-------------|----|----------|----------|
| **Council create/configure** | B | B | C | B | D | C | `council-service.ts:72`, `phase24`, panel missing |
| **Council proposal** | B | B | D (advisory LLM ignored) | B | D | C | `submitProposal:145` echo |
| **Council fact gathering** | B | C | D | B (vote kind=fact) | D | C | `submitFact:179` |
| **Council debate (Forum/Whisper)** | B | B | C | B | D | C | `postMessage:217` double-blind |
| **Council judging (multi-judge)** | B | C | C | B | D | C | `submitJudgeScore:287` weight |
| **Council consensus/conclude** | B | B | C | B | D | C | `conclude:334` tally |
| **Debate engine lifecycle** | A | A | A | A | B | A | `debate-state-machine:10` 11 states |
| **Participants/roles** | B | C | C | B | D | C | `council-types:23` |
| **Dung semantics** | B | F (0 callers) | F | F (KV) | G | D | `argtech:110` |
| **Toulmin** | B | F | F | F | G | D | `argtech:210` |
| **Brier forecast** | B | F | F | F | G | D | `argtech:250` |
| **Kialo treeScore** | B | F | F | F | G | D | `argtech:322` |
| **Fact-check** | B | C | C | D | D | C | `phase3:248` |
| **Provenance** | B | F | F | F | G | D | `trust.ts:64` |
| **MCP/Tool grounding** | C | C | C | B | D | C | `LlmCallerDeps:102` |
| **Persistence/resume** | B | C | D (council no resume) | C | D | C | `council-repository:124` N+1 |
| **EventBus/Timeline** | B | C | C | C | C | C | `event-registry:1577`, `debate-timeline:34` |
| **UI Fleet Councils** | F | D | F | D | F | F | `route lazy missing file` |

**Legend:** A runtime verified, B implemented runtime pending, C partial, D stub, E mock, F doc only, G missing.

---

## 14. Strengths (code-verified, not marketing)

- **Six Council formats:** Council + `FormatService` 6 formats (`Oxford/LD/Popper/deliberative/munk/adversarial`) — one runtime, not six engines.
- **Debate engine maturity:** 11-state SM + guards + distributedLock + paused resume + DLQ + BucketStorage — production-grade.
- **Multi-judge + double-blind + weighted tally:** `aliases + blindMap + weight` (`council-service:432`, `llm-task-executor:135`).
- **Lens/polarity prompt system:** 14 lenses +4 polarities = 42 combos data-driven (`council-lenses:23`).
- **Graph→Council delegation:** `GraphService council node:475` additive.
- **EventBus lossy but observable:** 10 council +30 debate events, `Timeline` circular 5000, `TIMELINE_MAP 60` (phase56).
- **Dexie additive v24** (`98 tables`), `DatabaseService` v24, `DAL` re-attach.

---

## 15. Weaknesses

**Architecture:** No council fail/paused state, no second ArgTech wire, no Provenance wire.
**Runtime:** Council advisory LLM ignored, no timeout/budget/abort, no resume.
**Debate quality:** ArgTech dead code, no Brier→confidence, no treeScore→verdict.
**Argumentation:** Support/attack graph only KV `dung/attacks`, not linked to `DebateMemoryGraph`.
**Evidence:** Truncated claim 280, sources unverified, no web grounding in council.
**Judging:** Tie = first max wins, no Brier calibration, no audience isolation.
**Persistence:** N+1 `listSessions`, no version/migration, no snapshot.
**Observability:** No Council timeline class, truncated 500 hides LLM, alias leaks real id.
**UI:** `fleet-councils` route без компонента, store read-only, 4 duplicate stores.
**Evaluation:** `QualityImpactCollector` wired but ArgTech not feeding `confidence`.
**Failure handling:** Council `throw` only, Debate `handleDebateCallError` not used by council.
**DX:** Lens vs archetype duplicate, 2× `preferredExtensions` copy-paste, `Trust` stub confusion.

---

## 16. GAP Register

| GAP | Title | Category | Current | Evidence | Why matters | Severity |
|-----|-------|----------|---------|----------|-------------|----------|
| **GAP-01** | ArgTech dead code (0 callers) | ArgTech | Code exists `argtech-service.ts:50` → 0 callers | `grep argtech` 0 outside phase39 | Formal semantics never used | **P0** |
| **GAP-02** | CouncilPanel missing | UI | Route `fleet-councils` lazy → file not found | `Glob CouncilPanel 0`, `route-registry-content:135` | UI looks functional but not wired | **P0** |
| **GAP-03** | Council no resume/failed/paused | Runtime | Only `assertPhase` guard | `council-service:268` 5-step only | Browser reload loses in-flight? Stateless but no worker | **P0** |
| **GAP-04** | Evidence provenance broken | Evidence | `pickId slice 280`, no source verify, `provenanceNodes` unwired | `council-repository:36`, `trust.ts:64` | Cannot trace verdict origin | **P1** |
| **GAP-05** | Brier/Kialo not feeding judging | Judging | `forecast/treeScore` KV-only | `argtech:250,322` not in `conclude:334` | Confidence & treeScore ignored | **P1** |
| **GAP-06** | Council LLM advisory ignored | LLM | `draftStance` try/catch swallow + `submitProposal stance.slice(0,500)` | `council-service:168`, `llm-task-executor:124` | LLM result truncated, not persisted as real proposal | **P1** |
| **GAP-07** | Duplicate stores (4) | Duplicate | `councilStore/debateLiveStore/activeDebateStore/debate-session-store` + adapter | `stores/*`, `register-debate-store-adapters:1` | Confusion, double persist | **P2** |
| **GAP-08** | N+1 listSessions | Persistence | `for r of sessions: getSession` | `council-repository:124` | Perf + no version | **P2** |
| **GAP-09** | Timeline truncated + alias leak | Observability | `truncatePayload 500:20` + `authorId` real persisted | `debate-timeline:20`, `council-repository:46` | LLM content lost, double-blind leak | **P2** |
| **GAP-10** | Toulmin duplicate copy-paste | Code quality | `preferredExtensions` defined twice | `argtech:137 vs 173` | Dead code, brute `≤12` | **P3** |
| **GAP-11** | Lens vs archetype duplicate | DX | `council-lenses` vs `debate-archetypes` both B | `phase13 lens-engine` exists | DRY violation | **P3** |

**Status all `OPEN` — will be prioritized D2.**

---

## 17. External Reference Patterns (only where GAP)

| Gap | Reference | Pattern | Why relevant | What NOT to copy |
|-----|-----------|---------|--------------|------------------|
| GAP-01 ArgTech dead | None needed — internal wire first | Wire `Dung→ConsensusEngine` before borrowing | Avoid copying ArgTech paper architecture wholesale |
| GAP-02 Panel missing | CrewAI Studio (Councils as Fleet tab) | One canonical `Fleet — Councils` list→detail→act (already 5 canons `USER_CONTROL_MAP`) | Don't copy CrewAI YAML crews |
| GAP-04 Provenance | Pydantic Logfire spans | `ProvenanceService.trace(runId)` linked to `FactPacket sources` | Don't copy Logfire infra |
| GAP-05 Brier/Kialo | Mastra evals | `scorerRegistry + Brier calibrate` already phase61, feed `conclude` confidence | Don't copy Mastra cloud |
| GAP-03 Resume | LangGraph checkpoint | `DebatePersistenceManager` parity — already A for Debate, reuse for Council | Don't copy Pregel super-steps |

---

## 18. Priority Matrix

| Priority | GAPs | Pre-runtime (static) vs Runtime-pending |
|----------|------|-----------------------------------------|
| **P0** | GAP-01 ArgTech wire/doc, GAP-02 Panel, GAP-03 Resume state machine | **Pre-runtime:** GAP-01 doc/mark experimental, GAP-02 route→panel stub + store wiring (Fleet — Councils map already exists), **Runtime-pending:** GAP-03 resume needs strong PC (Dexie restore + timeline) |
| **P1** | GAP-04 Provenance, GAP-05 Brier/Kialo→judging, GAP-06 LLM advisory | **Pre:** GAP-04 fix truncation + wire provenance `addNode` static, GAP-05 wire `treeScore` to tally static, **Runtime:** GAP-06 LLM judge needs provider |
| **P2** | GAP-07 stores, GAP-08 N+1, GAP-09 timeline | **Pre:** GAP-07 adapter dedup static, GAP-08 batch `bulkGet` static, GAP-09 remove truncate + fix alias persist static |
| **P3** | GAP-10/11 DRY | **Pre:** copy-paste fix, merge lens helpers |

---

## 19. PRE-RUNTIME Opportunities (без сильного ПК, без ядра)

- **DOC:** Mark ArgTech as `experimental/doc` until wired (GAP-01).
- **Panel stub:** Create `Fleet — Councils` list→detail `postMessage/submitJudgeScore` wiring via `councilStore` (GAP-02) — reuse 5 canons.
- **Provenance static:** Wire `FactPacket sources` → `provenanceService.addNode` + fix `pickId` 280 → full claim hash (GAP-04).
- **N+1 static:** `listSessions` → `Promise.all(getSession)` batch (GAP-08).
- **Duplicate fix static:** `argtech preferredExtensions second` delete + extract lens helper (GAP-10/11).

---

## 20. RUNTIME-PENDING Items (сильный ПК, LLM/provider/device)

- **GAP-03 Resume:** `restoreSession` + `distributedLock` parity with Debate — needs `strong PC` Dexie + `timeline` replay.
- **GAP-06 LLM advisory:** `draftStance` real LLM → proposal persisted not truncated — needs `provider + model + key`.
- **GAP-05 Brier:** Real `forecast/resolveClaim` live calibration → `conclude confidence` — needs LLM judge.
- **All ArgTech live:** Dung grounded/preferred on real `claimtree/*` with >12 args — needs real `treeScore` + `Brier` eval.

---

## 21. Recommended Next Phases (после D1, выбирать 3–5)

```
D2.1 CouncilPanel + Store wiring (GAP-02) — PRE-RUNTIME
D2.2 ArgTech wire OR mark experimental (GAP-01) — PRE-RUNTIME
D2.3 Evidence provenance fix (GAP-04) — PRE-RUNTIME
D2.4 Resume state machine parity (GAP-03) — RUNTIME-PENDING (strong PC)
D2.5 Brier→confidence live (GAP-05) — RUNTIME-PENDING
```

**Не выбирать более 5 до Захода 2.**

---

## 22. Evidence Index

- Council: `src/kernel/types/council-types.ts:13`, `src/kernel/contracts/council.ts:64`, `src/kernel/services/council/council-service.ts:47`, `src/kernel/dal/council-repository.ts:25`, `src/kernel/services/dexie-schema.ts:915`, `src/kernel/services/database-service.ts:393`, `src/kernel/service-registration/phase24-council.ts:20`, `src/kernel/services/council/council-lenses.ts:23`, `src/kernel/services/council/council-graph-node.ts:27`, `src/kernel/services/llm-bridge/llm-task-executor.ts:117`, `src/kernel/events/event-registry.ts:1577`, `src/stores/councilStore.ts:18`, `src/kernel/services/debateplus/argtech-service.ts:50`, `src/kernel/contracts/debateplus.ts:27`.
- Debate: `src/kernel/contracts/debate-types.ts:15`, `src/kernel/services/debate-runtime/debate-state-machine.ts:10`, `src/kernel/services/debate-runtime/debate-engine.ts:49`, `src/kernel/services/debate-runtime/debate-orchestrator.ts:114`, `src/kernel/services/debate-runtime/debate-consensus.ts:44`, `src/kernel/services/debate-runtime/debate-evaluator.ts:64`, `src/kernel/services/debate-runtime/debate-llm-caller.ts:136`, `src/kernel/services/debate-runtime/debate-timeline.ts:34`, `src/kernel/services/debate-runtime/index.ts:18`.
- Graph: `src/kernel/services/graph/graph-service.ts:475`, `src/kernel/services/debate-runtime/debate-llm-caller-deps.ts:51`.
- Trust/Provenance: `src/kernel/contracts/trust.ts:64`, `src/kernel/services/trust/provenance-service.ts:1`.
- UI/Routes: `src/route-registry-core.ts:137`, `src/route-registry-content.ts:135`, `src/route-imports.ts:1`, `src/routes.tsx:15`.

---

## STOP — D1 complete

**Summary:** исследовано `~120` файлов (`council/*`, `debate-runtime/*` (30+), `debateplus/*`, `dal/council-repository`, `dexie-schema`, `event-registry`, `stores`, `route-registry`), найдено `2` runtime paths (Council aggregate `C` + Debate SM `A`), `18` capabilities (matrix §13), `7` duplicates/legacy ( §12), `11` GAPs (P0×2 P1×3 P2×3 P3×2), `PRE-RUNTIME` 5, `RUNTIME-PENDING` 6.

Следующий этап — выбрать **3–5 из рекомендованных D2.1–D2.5** после просмотра D1. С богом — audit closed, без реализации.
