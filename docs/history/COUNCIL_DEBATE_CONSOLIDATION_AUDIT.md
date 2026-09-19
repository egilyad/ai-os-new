# Council ↔ Debate Engine CONSOLIDATION AUDIT (STATIC, без кода)

> Дата: 2026-09-07. Scope: `Council C (5 phases, 3 tables, 4 roles, 14 lenses, Forum/Whisper, tally)` vs `Debate Engine A (11 states, lock, pause/resume, 30+ deps, Bucket, DLQ, streaming)`. Цель: можно ли Council = режим Canonical Debate Runtime без переписывания зрелого A.

---

## Executive Summary

**Council path C** — additive: 5 phases `proposal→fact_gathering→debate→consensus→completed`, 3 Dexie tables `councilSessions/Messages/Votes` v24, 4 роли+Judge, 14 lenses+4 polarities data, Forum/Whisper double-blind, tally. **Debate Engine A** — 11 states `created→…→completed|failed|cancelled`, `StateMachine` guards, `distributedLock`, `paused resume`, `PersistenceManager version CAS`, `BucketStorageAdapter`, `Timeline 5000`, `ConsensusEngine/Evaluator` pluggable, `LLM Caller` 30+ deps + DLQ + streaming — mature.

**Вывод: Council может быть 100% адаптером Canonical Debate Runtime без переписывания зрелого Debate Engine.** Уникальное Council — data (lenses/polarities, Forum/Whisper channels, 6 форматов, double-blind alias) → adapter; дубликаты (tally, fact store 3 tables, 5-phase manual machine, councilStore) → deprecated за счёт `StateMachine + lock + versioned persistence + streaming`.

---

## 1) Unique Council Value vs Duplicate (file:line)

**KEEP as adapter data (engine-agnostic):**
- `council-lenses.ts:23` 14 lenses + `110` 4 polarities + `buildParticipantPrompt:160` — pure data, no deps (`6: no dependencies, so both can reuse`)
- `promptFor:423` per participant Lens+Polarity+Role
- `CouncilChannel forum|whisper` + `postMessage:238` validation `if whisper && !toId throw`, `if target.id===author throw`, auto-advance `phase→debate:254`
- `Fact gathering` gated `kind researcher/fact_checker/moderator only` + `FactPacket{claim,verdict,sources}` `types:61` + `submitFact:183`
- `Double-blind Speaker A..Z aliasFor:37` + `publicId:453` + `config.doubleBlind:97`
- `6 kinds` `types:23` `proponent/opponent/researcher/fact_checker/judge/moderator` + multi-judge weighted tally `308` + audience advisory `343` + `WeightedJudge` w `100`

**Duplicate of Debate (MIGRATE/DEPRECATE):**
- `tally` duplicates `DebateConsensusEngine.evaluate:44 + Evaluator.scoreArguments/rankParticipants:64` — Council trivial sum vs Debate FNV cosine ≥0.6 + contradictionDensity + DPO
- `Fact/evidence` duplicates `DebateRAGRetriever + FactCheckService` `debate-engine-types:132` + `debate-llm-caller:38`
- `Proposal→consensus` subset of Debate deliberation loop

**Debate strengths KEEP canonical (no rewrite):**
- 11 states `debate-types:15`, `TRANSITION_TABLE:10`, `TERMINAL:71`, `StateMachine:73` re-entrance block `124`, `guard reject:142`, `before/After:157`
- `distributedLock acquire('debate:${id}',ttl 60k) + release` `364` + zombie 5min `failed:204`, `pause:585` abort controllers + `saveSnapshot` + `RESUME→queued` `619`
- `PersistenceManager version CAS retry 3× backoff, prune keep 3, Heap 150/300, minimal fallback, zod:27`, `Bucket RESEARCH timeline:15 storageKey debate_timeline_${id}`, `DLQ push:641`, `Streaming adapter.streamMessage → CHUNK 374` + `debateLiveStore 100/10KB cap:237`

---

## 2) Lifecycle Mapping — 5 vs 11

| Council | Debate | Mechanism |
|---------|--------|-----------|
| `proposal` | `created/queued/initializing` + first `round:start` | `transition('queued')→('initializing')→('active') 375` |
| `fact_gathering?` (`factGathering` flag) | `deliberating` restricted to `researcher/fact_checker` nodes + `ragRetriever` | Topology 2 nodes gated by `skipAgents` |
| `debate` | `active/deliberating` loop `generateRoundEvents` up to `maxRounds` | `buildPipeline` |
| `consensus` | `consensus/summarizing` via `ConsensusEngine` + `Evaluator` | `phaseChangeHandler DEBATE_CONSENSUS_REACHED` |
| `completed` | `completed` | `transition('completed')` |
| `aborted` | `cancelled/failed` | `CANCEL/FAIL` any phase |

Council `advancePhase:291` deterministic `next{proposal→fact_gathering|debate, fact_gathering→debate, debate→consensus, consensus→completed}` + `assertPhase:445` `includes` only, no guards, no pause — vs Debate `StateMachine.send(event) + can()/guard()` prevents invalid `proposal→consensus` jumps. **Council as mode** = `DebateTopology type='roundtable' + metadata.councilMode=true + config:{doubleBlind,factGathering,maxRounds,allowAudienceVoting}` + `LensPromptAdapter` — zero engine rewrite.

---

## 3) Persistence Models

**CouncilSession** `types:103` `{id,topic,config,phase,status,participants:CouncilParticipant[], judges:CouncilJudge[], aliases?, facts:FactPacket[], messages:CouncilMessage[], scores:JudgeScore[], votes:AudienceVote[], winnerId?,summary?,createdAt,updatedAt}` + `CouncilSessionRecord` (same minus arrays) + `MessageRecord + VoteRecord{kind:judge|audience|fact}`

**DebateSession** `debate-runtime:52` `Snapshot {id,topic,topology{topology,nodes,edges,maxRounds}, phase 11, round, version:1, agentStates Map, totalTokens/Cost, startedAt, updatedAt, language, arguments[], failedProviders/Models[], participants:ParticipantConfig[], qualitySettings}`

**Tables:**
- Council v24 `councilSessions:'id,phase,status,createdAt'`, `councilMessages:'id,sessionId,channel,authorId,createdAt'`, `councilVotes:'id,sessionId,kind,voterId,createdAt'` (`dexie-schema:952`, `database:393`)
- Debate v9-11 `debateSessions:'id,phase,updatedAt,topic,folder,isArchived'`, `debateVerdicts:'sessionId'`, `debateTimeline:'id,sessionId,timestamp,type'` + `Bucket RESEARCH` `debate_timeline_${id}:15` + `keyValue distlock:` `database:185`

**Re-attach/N+1/Version:**
- Council `putSession:31` destruct `{facts,messages,scores,votes,...rest}` → 1 `councilSessions.put` + N `councilVotes.put` (fact pickId=hash `fix 280 → hash` D2.3) — **no transaction**; `getSession:82` `Promise.all(Messages+Votes where sessionId)` reconstruct; `listSessions:132` **N+1** `for r of rows await getSession => 2*N` queries.
- Debate `saveSnapshot:142` single `debateStore.saveSnapshot(record)` + `version` CAS retry 3× backoff + `timeline.persist` fire-and-forget `159`, `restoreSession:336` safeParse + safeTopic/Topology fallback; Council no version (last-write-wins), no prune, no lock, no visibility checkpoint (`debate-engine:131` + `database:179` cleanupStaleLocks).

---

## 4) Stores Duplicate

- `councilStore:1` zustand `{sessions, activeSessionId, loading, error, refresh()->listSessions(), select()}` subscribes `6 council:*` `24`, no cap, no multi-session governor.
- `debateLiveStore:1` transient streaming `agentEvents[500],roundEvents[200],streamingContent 100/10KB:237, emotions[200]` lazy `metrics 30s + countdown 1s:177`, 12 `DEBATE_*` subs, `clearSession/clearAll:544`, HMR dispose.
- `activeDebateStore:1` multi-session `sessions:Record<id,{session,governorState}>` + `upsertSession` + `select`
- `debate-session-store` (`BucketAdapter + keyValue + Dexie`) `sessionToRecord:46`, `persistActiveSession`

**Verdict:** `councilStore` duplicates `activeDebateStore` shape without multi-session/governor/streaming. Council should reuse `activeDebateStore.upsertSession + select` + `debateLiveStore` streaming; merge `refresh N+1` into single `DebateStore` row.

---

## 5) Где 6 форматов / lenses жить

**Engine KEEP generic:** `DebateRole pro|con|neutral|judge|attacker|defender` + `ParticipantConfig.role/systemPrompt` + `TopologyNode.role/label/config` + `qualitySettings:Record<string,boolean>` `debate-engine-types:99` — no lens ids inside engine.

**Adapter layer:** Lenses/polarities as `PromptDecorator` via `PipelineEngineDeps` (like `buildDebateSystemContent`, `enrichment`). Council `buildParticipantPrompt` → `CouncilLensAdapter implements IPromptMiddleware` registered in `registerPhase24` or `debate-strategy-registry`. Move `COUNCIL_LENSES/POLARITIES` to `src/kernel/lenses/` shared — both `CouncilAdapter` and Debate `STEELMAN/BiasProfiler` use; channel `forum/whisper` → add `channel` to `TimelineEntry.payload` + filter in `record()`, avoid separate `councilMessages` table.

---

## 6) ArgTech + Provenance Common Pipeline (D2.2/2.3 уже wiring)

**Today forked:**
- Debate `ConsensusEngine setArgTechBonus:52` + `bridge computeArgTechBonus` + `dung:attack|toulmin:card|brier:resolved` events; Council `council-service:211` wires `addNode(data Claim) → link Source→Claim informed_by → verdict derived_from → session prompt` (D2.3).

**Common pipeline:**
```
Debate: Memory.steps → gatherClaims() → ConsensusEngine.evaluate → ConfidenceGraph
Council: CouncilSession.facts/messages → FactPacket/Claim mapping → same ConsensusEngine
                                    ↓
                              ArgTech (Dung grounded / Toulmin completeness / Brier)
                              ↓ setArgTechBonus(±0.2) clamped
                                    ↓
                              ProvenanceService addNode/link (claim,source,verdict,decision) → provenanceNodes/Edges
                                    ↓
                              Result: winnerId + summary + confidence 0..1 clamp
                              (Debate Evaluator.rankParticipants / Council WeightedJudgeStrategy selectable via topologyType/councilMode)
```
Single `IConsensusPipeline { gather→evaluate→argTechEnrich→provenanceWire→result }` injected into both `DebatePersistenceManager phaseChangeHandler` and `CouncilService.conclude()`; Council tally becomes one `EvaluatorStrategy` alongside Debate `BayesianJudge`.

---

## 7) Legacy DebateOrchestrator Preserved Not Wired

`debate-runtime/index.ts:13` explicit: `Step A is closed: exclusively ConversationBackedDebateOrchestrator (DebatePolicy+AgentExecution+ConversationOrchestrator) via IDebateOrchestrator anti-corrosion. Legacy DebateOrchestrator preserved (not deleted) as regression reference but is no longer wired.` `createDebateOrchestrator()` returns `ConversationBacked` only. `debate-orchestrator.ts:26` full legacy `participationCount, bidScores 32, computeBid 41, generateRoundEvents 120` not instantiated in prod — validates canonical adapter premise.

---

## 8) Can Council Be Adapter/Mode Without Rewriting Mature Engine? — YES

**Canonical architecture:**
```
                        ┌──────────────────────────────────────────────────────┐
                        │          Canonical Debate Runtime (KERNEL)           │
                        │  ConversationCore + StateMachine (11)               │
                        │  + DebateEngine (lock/pause/resume/Budget)          │
                        │  + PersistenceManager (version CAS, prune, Bucket)  │
                        │  + Timeline (circular 5k, Bucket RESEARCH)          │
                        │  + ConsensusEngine / Evaluator (pluggable)          │
                        │  + LLM Caller (30+ deps, DLQ, streaming, fallback)  │
                        └────────────────┬───────────────────────────────────┘
                                         │ IDebateEngine / IDebateOrchestrator
                ┌────────────────────────┼────────────────────────┐
                │                        │                        │
   ┌────────────▼──────────┐  ┌──────────▼──────────┐  ┌─────────▼─────────┐
   │ CouncilAdapter (MODE) │  │ Debate Modes        │  │ ArgTech/Provenance│
   │ - maps 5→topology     │  │ - templates         │  │ - Common pipeline │
   │ - doubleBlind/forum   │  │ - red-blue/judge    │  │   Claim→ArgTech → │
   │   whisper              │  │ - linear            │  │   Provenance→Ver. │
   │ - LensPromptAdapter   │  │                     │  │                   │
   │ - WeightedTallyEval   │  │                     │  │                   │
   └───────────────────────┘  └───────────────────┘  └───────────────────┘
                │
   ┌────────────▼──────────┐
   │ Unified Stores        │
   │ activeDebateStore (multi) + debateLiveStore (streaming) │
   │ DebateStore Dexie + BucketAdapter (single)               │
   └──────────────────────────────────────────────────────────┘
   CouncilService façade retained for backward compat, delegates to DebateEngine.createSession(startSession) with council topology.
```

**KEEP/MIGRATE/ADAPTER/DEPRECATE:**

| Item | Verdict | Action |
|------|---------|--------|
| `council-lenses` 14+4 + `buildParticipantPrompt` | **MIGRATE** to `src/kernel/lenses/` shared lib | Keep data, move prompt decoration to `LensPromptMiddleware` |
| `CouncilRoleKind` 6 kinds / 6 formats | **ADAPTER** | Map to `DebateRole` + lens per `TopologyNode.config` |
| `Forum/Whisper` channel | **ADAPTER** | Add `channel` to `TimelineEntry.payload`, filter in `record()`, remove `councilMessages` table |
| `Fact gathering` + `FactPacket` | **ADAPTER** | Pre-round `deliberating` with researcher nodes + `ragRetriever` → `Claim` mapper to common `ConsensusEngine` |
| `Multi-judge weighted tally` + audience | **ADAPTER** | `WeightedJudgeEvaluator implements IDebateEvaluator` alternative to `BayesianJudge` selectable via `councilMode` flag |
| `Double-blind alias` | **ADAPTER** | Move `aliasFor + publicId()` into `WhisperChannelAdapter` |
| `CouncilService` 5-phase manual machine | **DEPRECATE (façade)** | Thin delegate to `DebateEngine`, deprecate internal `advancePhase` map `291` in favor of `StateMachine` guards |
| `CouncilRepository` 3 tables + N+1 | **DEPRECATE** | Migrate to single `DebateStore` rows `kind='council'` + `version` CAS |
| `councilStore` | **DEPRECATE → activeDebateStore+debateLiveStore** | Merge `refresh N+1` into `upsertSession` |
| `Council graph node` | **KEEP as ADAPTER** | `council-graph-node:27` run via Adapter → DebateEngine |
| `Provenance D2.3` | **MIGRATE to common pipeline** | Move `provenance.link` into shared `Consensus→ArgTech→Provenance` service |
| `Debate Engine 11 states` | **KEEP canonical** | No rewrite — all improvements accrue via adapter |
| `Legacy DebateOrchestrator` | **KEEP frozen** not wired | Per `index.ts:13` |

S PENDING: Council `restoreSession` + lock parity needs strong PC Dexie + timeline replay.

С богом — audit static, без кода. Следующий этап — выбрать unification path 1 фасад делегат (рекомендован) vs 2 отдельные tables (не рекомендуется) — после просмотра этого файла.
