# D3 — Council → Debate Engine Unification Implementation Plan (без кода)

> Дата: 2026-09-07. Источник: `docs/COUNCIL_DEBATE_CONSOLIDATION_AUDIT.md` + `DEBATE_SYSTEM_AUDIT_D1.md` GAP-02/03/07/08. Тип: **план миграции, без кода, без второго runtime**. Kernel/DI/Dexie — только ADAPTER/DEPRECATE где доказано.

---

## 1) CouncilSession → DebateSession (fields/tables/version)

**FROM** `CouncilSessionRecord {id,topic,config,phase,status,participants, judges, aliases, winnerId,summary,createdAt,updatedAt}` + `councilMessages + councilVotes(kind=fact|judge|audience)` (`types:125` + `dal/council-repository:25` N writes, `list N+1:132`)

**TO** `DebateSessionRecord {id,topic,topology,phase 11, round,version,agentStates JSON,arguments JSON,topology JSON,participants JSON,memory JSON,startedAt,updatedAt,createdAt,language,failedProviders}` + `DebateStore version CAS retry 3× + Bucket RESEARCH timeline` (`debate-persistence-manager:142`, `debate-session:19`)

**Migration plan (PRE-RUNTIME static + RUNTIME-PENDING Dexie):**

- Static: mapper `councilToDebateRecord(session:CouncilSession) → DebateSessionRecord` (pure function, no DB): `id` same, `topic` same, `topology={type:'roundtable', nodes: participants.map(p→{id:p.id, role:p.kind, label:p.name, config:{lensId,polarityId}}), edges:[] , maxRounds:config.maxRounds, metadata:{councilMode:true, doubleBlind, factGathering}}`, `phase: council 5→debate 11` via table §2, `round:0`, `version:1`, `participants: CouncilParticipant→ParticipantConfig`, `agentStates:[]`, `arguments: facts→Claim` (see §6).
- Dexie: keep 3 tables read-only during migration window; write new rows to `debateSessions` with `kind='council'` discriminator in `topologyType='council'` (exists in `dexie-schema:354` `topologyType` index) + `version:1`; old `council*` tables stay for rollback (see §15).
- Historical: `migrateHistories(listSessions → bulkPut debateSessions)` batched `Promise.all` not N+1 (fix GAP-08).

**Rollback:** keep old rows untouched until `snapshot('pre-unification')` + `exportConfig()` (see §15).

---

## 2) 5 Council phases → 11 Debate states

| Council | Debate | Mechanism (no engine rewrite) |
|---------|--------|-------------------------------|
| `proposal` | `created→queued→initializing→active` + first `BEGIN_ROUND` | `CouncilAdapter.createSession` → `DebateEngine.createSession({topology council, phase:created})` → `StateMachine.send('queued')→('initializing')→('active')` `debate-engine:375` |
| `fact_gathering?` | `deliberating` restricted to `researcher/fact_checker` nodes | `topology.nodes filter skipAgents` + `ragRetriever` labeling `deliberating` with `channel:fact` |
| `debate` | `active/deliberating` loop `generateRoundEvents` up to `maxRounds` | `buildPipeline` |
| `consensus` | `consensus/summarizing` via `ConsensusEngine` + `Evaluator` | `phaseChangeHandler DEBATE_CONSENSUS_REACHED` |
| `completed` | `completed` | `transition('completed')` |
| `aborted` | `cancelled/failed` | `CANCEL/FAIL` any phase |

**Guard:** Replace `CouncilService advancePhase map next{proposal→fact_gathering|debate…}:291` + `assertPhase includes:445` with `StateMachine.can(phase,event)` + `guard()` `state-machine:93,142` — prevents invalid `proposal→consensus` jumps (Council bugün allows via 2 calls). **PRE-RUNTIME static:** table mapping + adapter `councilPhaseToDebateEvent()`.

---

## 3) 6 Council formats → TopologyNode.config

**FROM** Council 6 formats implicit via `CouncilConfig maxRounds + proposal` (no explicit format id). **TO** `DebateStrategy/Topology` already per-phase `phase3-debate-runtime:281` `DebateSyncManager` + `TopologyTemplateService`.

**Plan:** Store `formatId ∈ {oxford,ld,popper,deliberative,munk,adversarial}` (existing `FormatService` 6 formats, `debateplus:FormatService run`) into `topology.metadata.formatId` + `TopologyNode.config.formatId` per node. `LensPromptMiddleware` (see §4) reads it. **No new format runtime** —Reuse `FormatService` as strategy selector for `CouncilAdapter`.

**Rule:** `уникально? 6 форматов уникальны Council → KEEP as adapter data, not engine` (per §4a5e0v).

---

## 4) Роли/lenses → engine (LensPromptMiddleware)

**FROM** `council-lenses:23` 14 lenses + `110` 4 polarities + `buildParticipantPrompt:160` pure data (`6: no dependencies`).

**TO** `DebateRole pro|con|neutral|judge|attacker|defender` + `ParticipantConfig.role/systemPrompt` + `qualitySettings` `debate-engine-types:99` — engine KEEP generic.

**Plan:** **MIGRATE** data to shared `src/kernel/lenses/` (move `COUNCIL_LENSES/POLARITIES` without logic). **ADAPTER** `CouncilLensAdapter implements IPromptMiddleware` registered in `registerPhase24` → `PipelineEngineDeps` `buildDebateSystemContent` reads `node.config.lensId/polarityId` → `buildParticipantPrompt`. `MIGRATE` not `KEEP duplicate` — `debate-archetypes/historical` deduplicate via same lenses lib (GAP-11).

**Checklist:** `уникально? lens data unique → KEEP/ADAPTER : есть эквивалент in Debate archetypes? → MIGRATE to shared lib`.

---

## 5) Double-blind Speaker A

**FROM** `aliasFor:37 Speaker A..Z` + `publicId:453` + `config.doubleBlind:97` + `aliases: Object.fromEntries:110` — stored in `CouncilSession.aliases`.

**TO** `WhisperChannelAdapter` — add `channel` to `TimelineEntry.payload` (`forum|whisper`) + anonymize `TimelineEntry.payload` for judge view.

**Plan:** **ADAPTER** — move `aliasFor+publicId` into `WhisperChannelAdapter` (new file `src/kernel/services/debate-runtime/whisper-channel-adapter.ts` in plan only). `CouncilService postMessage` → `DebateEngine post entry with channel` → `publicId` filter in `DebateLiveStore` judge view. No new table, no `councilMessages` separate (see §8).

---

## 6) Fact Gathering → existing lifecycle

**FROM** `FactPacket:61` `fact_gathering` gated `researcher/fact_checker/moderator only:193` + `FactPacket sources[]`.

**TO** `deliberating` pre-round with `researcher` nodes + `RAGRetriever` → `Claim` mapper.

**Plan:** **ADAPTER** — Council `fact_gathering` as pre-round `deliberating` where only `researcher` nodes `skipAgents` not skipped, `FactPacket → Claim{text:claim, confidence: verdict→0.9/0.2/0.5, speaker:authorId}` feeds common `ConsensusEngine.gatherClaims → evaluate` (see D2.2 bridge). **No second Fact service.**

**D2.3 reuse:** `pickId hash + provenance addNode/link` stays via adapter's `submitFact → provenance` (shared pipeline §12).

---

## 7) CouncilPanel → facade (без поломки Fleet — Councils D2.1)

**FROM** `CouncilPanel:1 Fleet — Councils` list→detail→act via `councilStore → CouncilService → Dexie` (D2.1 wiring, `route-imports fleet-councils → CouncilPanelLazy`, `ResponsiveShell stacked`).

**TO** Facade `CouncilService` delegating to `DebateEngine.createSession` with `council topology` (see §13). Panel **unchanged** — still calls `councilService.createSession/listSessions/getSession/postMessage/submitFact/advancePhase/conclude` — facade maps to Debate APIs internally.

**Plan:** Keep `CouncilPanel.tsx` 100% as is (no panel rewrite). **ADAPTER** — `CouncilService` becomes thin facade (see §13) — panel not aware of migration. **PRE-RUNTIME static:** facade interface 100% same (`ICouncilService:64`).

---

## 8) council* 3 tables N+1 → DebateStore kind='council' + CAS

**FROM** `councilSessions/Messages/Votes` 3 tables + `putSession:31` destruct + N `put`, `getSession:82` `Promise.all(Messages+Votes where sessionId)`, `listSessions:132 N+1`.

**TO** `DebateStore` single row `version` CAS retry 3× + `Bucket RESEARCH timeline:15 storageKey debate_timeline_${id}` (`debate-persistence-manager:142`).

**Plan:** **DEPRECATE** old 3 tables (keep for rollback, read-only after migration). **MIGRATE** write path: `facade.putSession → debateStore.saveSnapshot(record)` single row `kind='council'` + `version:1` + `zod safeParse:142` + `retry 186`. **Batch** `listSessions` → `debateStore.listSessions(kind='council')` single query (fix GAP-08). **PRE-RUNTIME static:** mapper + facade; **RUNTIME-PENDING:** Dexie migration batch `bulkPut` on strong PC with `snapshot('pre-unification')` (see §15).

---

## 9) Stores без поломки Debate UI

**FROM** `councilStore:1` `{sessions, activeSessionId, refresh→listSessions, select}` 6 `council:*` subs `24` vs `debateLiveStore:1` streaming 500/200 + `activeDebateStore:1` multi-session `upsertSession`.

**TO** Unified: `activeDebateStore` + `debateLiveStore`.

**Plan:** **DEPRECATE** `councilStore` → adapter: `councilStore.refresh` delegates to `activeDebateStore.list(kind='council')` + `useCouncilStore` becomes alias to `useActiveDebateStore` selector (no panel rewrite). **MIGRATE** streaming `council:*` 6 subs into `debateLiveStore` 12 `DEBATE_*` subs via `channel` filter (§5). **PRE-RUNTIME static:** adapter store file `council-store-adapter.ts` re-exporting `useActiveDebateStore`.

**Rule:** `есть эквивалент in Debate? YES → MIGRATE` (per `4a5e0v`).

---

## 10) Исторические Council sessions

**Plan:** `migrateHistories` batch `Promise.all(getSession → councilToDebateRecord → debateStore.saveSnapshot)` with `version:1` + `createdAt` preserved. Keep old `councilSessions` rows until `snapshot:rollback` window (7 days or 1 wave). **PRE-RUNTIME static:** mapper; **RUNTIME-PENDING:** batch run on strong PC + `verify listSessions` counts match.

---

## 11) WeightedJudgeEvaluator

**FROM** `CouncilService conclude:343` `Map winnerId→weight judge.weight??1` tally + audience advisory `355` → `winnerId + summary`.

**TO** `IDebateEvaluator` alternative to `BayesianJudge` `debate-engine:279`.

**Plan:** **ADAPTER** — `WeightedJudgeEvaluator implements IDebateEvaluator` (`scoreArguments → tally weights`, `rankParticipants → winnerId`) selectable via `topology.metadata.councilMode=true` or `topologyType='council'`. **No second judging pipeline** — one `Evaluator` interface, two strategies (per GO constraint).

---

## 12) ArgTech + Provenance → общий pipeline (D2.2/2.3 reuse)

**FROM** D2.2 `DebateConsensusEngine setArgTechBonus:52` + `bridge computeArgTechBonus` + ` Dung attack:106 | Toulmin card:242 | Brier resolved:271` events; D2.3 `council-service:211 provenance addNode/link` + `pickId hash:36`.

**TO** Single `IConsensusPipeline { gather(claims) → evaluate → argTechEnrich(bonus ±0.2) → provenanceWire(claim/source/verdict→session) → result{confidence, contradictionDensity, winnerId} }` injected into both `DebatePersistenceManager phaseChangeHandler` and `CouncilService facade conclude` (see §1 scheme).

**Plan:** **MIGRATE** `council-service:211 provenance.link` into shared `Consensus→ArgTech→Provenance` service called by both phase handlers. **D2.2 + D2.3 already wired** — reuse, not duplicate.

---

## 13) CouncilService facade/adapter/deprecated methods

**FROM** `ICouncilService:64` 8 methods `createSession/get/list/submitProposal/submitFact/postMessage/advancePhase/submitJudgeScore/castAudienceVote/conclude/abort` + `listLenses/listPolarities/promptFor:103`, 5-phase machine `291`.

**TO** Thin facade delegating to `DebateEngine` + `LensAdapter` + `WeightedJudgeEvaluator` + `Provenance` pipeline.

**Plan:**

| Method | Facade | Deprecated internal |
|--------|--------|---------------------|
| `createSession` | → `DebateEngine.createSession({topology council, config})` + `LensAdapter` | `advancePhase map:291` → `StateMachine.send` |
| `getSession/listSessions` | → `activeDebateStore` + `DebateStore list(kind='council')` mapper `debateToCouncil` | `council-repository:31` no-tx + N+1 |
| `postMessage` | → `DebateEngine post TimelineEntry channel forum|whisper` | `councilMessages` separate table |
| `submitFact` | → `FactPacket→Claim` mapper + `provenance` shared pipeline (§12) | `pickId slice 280` fixed D2.3 |
| `advancePhase` | → `StateMachine.send('BEGIN_ROUND'|'CONSENSUS')` with `guard()` | manual `next` map |
| `submitJudgeScore/castAudienceVote/conclude` | → `WeightedJudgeEvaluator` via `Evaluator` + `provenance.trace` | inline tally `355` |

**Status:** `ICouncilService` stays public (panel not rewritten), impl becomes adapter — `KEEP facade`, `DEPRECATE internal`.

---

## 14) Legacy DebateOrchestrator preserved not wired

**FROM** `debate-runtime/index.ts:13` `Step A is closed: exclusively ConversationBackedDebateOrchestrator ... Legacy DebateOrchestrator preserved (not deleted) as regression reference but is no longer wired` + `createDebateOrchestrator() returns ConversationBacked only` + `debate-orchestrator.ts:26` full legacy `participationCount/bidScores 32, computeBid 41, generateRoundEvents 120` not instantiated.

**TO** **KEEP frozen** not wired — no action until removal scheduled (as in consolidation audit §7). Council unification does not touch it.

---

## 15) Rollback strategy (необратимость)

**Pre-migration:** `ecosystemService.snapshot('pre-unification')` + `exportConfig()` + `DatabaseService backup` (existing `Phase 11` snapshot). **Write window:** new writes go to `DebateStore kind='council'` with `version:1`; old `councilSessions/Messages/Votes` kept read-only for rollback.

**Rollback trigger:** Any `version conflict` CAS fail >3 retries or `safeParse` fail `242` → fallback to old `getSession` path; Panel can toggle `USE_LEGACY_COUNCIL_STORE=true` env (adapter switch).

**Rollback procedure:** `importConfig(snapshot docs) + restore old tables from backup + clear DebateStore kind='council' rows + delete Bucket timeline keys` → `councilStore` re-enabled. Window 7 days / 1 wave, then `DEPRECATE` old tables after `listSessions` counts match.

**Invariant:** No irreversible `DELETE FROM council*` until `snapshot rollback` window passed + `verify` on strong PC.

---

## Что дальше (без кода до завершения этого плана)

**После просмотра этого плана — выбрать unification path 1 (фасад делегат, рекомендован) — и только потом GO на D4 Migration Implementation (первый batch: D4.1 CouncilSession mapper + D4.2 facade, без Dexie mass migration).**

Per `4a5e0v` rule: каждое `Council thing` → `уникально? KEEP/ADAPTER : есть эквивалент? MIGRATE : контракт`.

С богом — план без кода, только карта + KEEP/MIGRATE/ADAPTER/DEPRECATE + PRE-RUNTIME vs RUNTIME-PENDING.
