# MIGRATION SAFETY AUDIT — Council → DebateStore SSOT (без кода, без миграции)

> Дата: 2026-09-07. Источник: `D4.3 PRE-FLIGHT` + `D4.3 Contract Repair` + `explore` фикса `WeightedJudgeEvaluator`. Цель: можно ли DebateStore уже canonical SSOT.

---

## Вердикт

**🔴 NOT YET SAFE for SSOT cutover** — persistence hardened, но evaluator wiring + historical + rollback не готовы. `council*` остаётся SSOT, `DebateStore` secondary (dual-write).

---

## 1) DebateStore Contract vs Manager

- Contract `storage/debate-store:53` `saveSnapshot(record): Promise<number>` — version return hint, no CAS semantics defined; `DebateSessionRecordSchema:553` `version default 1`.
- `dexie-schema:1882` hook `creating/updating rejectHook(schema)` — every write validated.
- `DebatePersistenceManager:137` `attemptSave` `safeParse` + `MAX_RETRIES=3` loop `for 0..2` + `newVersion = saveSnapshot(parsed.data) → session.incrementVersion(newVersion) 154` + `HEAP 150/300 PRUNE_KEEP_ROUNDS=3 27` + `Timeline circular 5000 11 + persist RESEARCH bucket slice(-500) fallback 100 92`.
- CAS string match `if errStr includes 'version conflict' 172` → re-fetch `getSnapshot` `181` + `parsed.data.version = dbVersion 184` + backoff `100*2^attempt 186` — racy, relies on exact string, not Dexie CAS.
- **Safe only if** `StorageLayer.debates.saveSnapshot` actually throws `version conflict` + monotonic increment — contract does not enforce.

---

## 2) Evaluator Wiring — blocker

- `IDebateEvaluator scoreArguments/rankParticipants 269` — single interface.
- `DebateEvaluator` standard (`debate-evaluator:64`) registered `phase3:223` `register('debateEvaluator', () => new DebateEvaluator)` → `debateEngine evaluator: c.get('debateEvaluator') 585` — hard-wired standard.
- `WeightedJudgeEvaluator` D4.3 repair `implements IDebateEvaluator` but **NOT registered** in DI, holds `votes Map<sessionId,Map<judgeId,winnerId>>` + `audienceVotes Map` in-memory only `14`, methods `recordJudgeVote 19`, `tallyWinner 28`, `recordAudienceVote 43` — facade owns private instance `council-service-facade:20` `private weightedJudge = new...`, not engine's evaluator.
- `Phase handler` `debate-phase-handler:18` single `evaluator?: IDebateEvaluator` + `blindEval/bayesianJudge` branching `101` — no `councilMode` flag `getEvaluator(sessionId)` selector, no `phase3` factory reading `topology.metadata.councilMode` (mapper `30` sets it but engine never reads `topologyLabelById 58` only).
- **Facade votes volatile** — Map, not persisted to `DebateStore`, lost on reload.

**Fix needed:** Register `WeightedJudgeEvaluator` as selectable `IDebateEvaluator` in `phase3` via factory reading `topology.metadata.councilMode`.

---

## 3) Historical Council Records — 3 vs 1, no bulk migration

- `dexie-schema:915` v24 `councilSessions/Messages/Votes` indexed `sessionId`; `debateSessions:'id,phase,updatedAt,topic,folder,isArchived' 927` — **no `topologyType/version` index** → filter scan costly.
- `council-repository:132` `listSessions` N+1 `for r.getSession → 2*N queries` (1 scan + 2*N), no limit/pagination/bulk.
- Mapper `council-to-debate-mapper:58` pure `id same council-abc` + `topology council-${id}` + `version:1` + `arguments[]` sorted, but **no bulkPut/idempotency/checksum** — grep `bulkPut` only `key-migration/memory`, no `council→debate bulkPut`. Facade `createSession 38` single dual-write, not bulk historic; no `keyValue council:migrated:batch` flag (pattern exists `keys:migrated:v12`).
- Snapshot vs Record mismatch: mapper returns `Snapshot` (object), `DebateStore.saveSnapshot` expects `Record` (stringified `topology/participants/agentStates/arguments` + `DebateSessionRecordSchema` validation `142`) — bulk would need stringify loop per session.

---

## 4) Rollback — comments only

- `ecosystem snapshot pre-unification` — `osSnapshots: 'id,createdAt' 258` exists but no `snapshotEcosystem()` call in `phase24` or facade — comment `phase24:38 old persistence kept read-only for rollback`.
- `keep council* read-only 2 releases` — header `facade:5` but code still `repo.putSession` `council-service:129` all 8 methods write old tables — **not read-only**.
- `Map councilId→debateId` — facade now uses same `council-abc` via `createSessionWithId` (D4.3 P0 fix), so map identity `councilId===debateId` — no separate map, no `keyValue council:map` lookup.
- `version(28) drop` — `dexie-schema:1120` v28 additive `a2aAgents/fedPeers`, drops nothing — safe (no data loss) but contradicts expectation drop after 2 releases.
- `keyValue rollback flag` — grep `rollback` only `provider-migration`, no `council:migrated` flag.
- `verifyIntegrity` — no function; closest `validateMigrations 1986` drift check + `DebateSessionRecordSchema` validation in manager.
- `zombie` `_restoreOrphanedSessions 192` for debates `active/deliberating → failed/paused` after 5min, **no equivalent for Council** — council `proposal/debate` stuck forever.

Immediate rollback = uninstall facade, keep old service — data still there (nothing dropped) — safe today; unified SSOT rollback (snapshot/map/flag) insufficient.

---

## 5) Static Equivalence `CouncilSession ↔ DebateSnapshot` — mapper losses (D4.3 partially fixed, still lossy)

| Council field | DebateSnapshot | Lost |
|---|---|---|
| `id/topic` | `id/topic` `58,103` | ✅ equal |
| `status` `running|completed|aborted` | `phase` only | ❌ `status` lost |
| `phase` 5 vs 11 | `phase` via `councilPhaseToDebatePhase 13` | Lossy `fact_gathering/debate→deliberating`, `proposal→created` collapse |
| `participants[]` | `participants + topology.nodes` `26,60` role cast `as DebateRole` | Partial `systemPrompt` now via `buildParticipantPrompt` D4.3 fix, but `edges:[]` synthetic |
| `judges[]` weight/dimensions | `WeightedJudgeEvaluator judgeWeights Map 15` memory only, not snapshot | ❌ lost from SSOT |
| `aliases` double-blind | `topology.nodes[].config.aliases` `35` | Partial fix, but reverse not re-derived |
| `facts` | `arguments[]` `76` `claim→content, verdict→confidence 0.9/0.2/0.5, sources→citations/evidence, authorId→agentId/speaker` | Lossy heuristic confidence |
| `messages` | `arguments[]` `87` `body→content, round, confidence 0.6` | Whisper now included `70` fixed, but `id/sessionId/toId/channel` dropped |
| `scores: JudgeScore[]` | `WeightedJudgeEvaluator.votes Map` | ❌ `scores Map/rationale/blind` lost, tally only winnerId |
| `votes: AudienceVote[]` | `audienceVotes Map` | ❌ pickId only, not in `arguments` |
| `winnerId/summary` | no winner field in snapshot | ❌ forked, old `CouncilService.conclude 386` vs `DebateVerdictRecord` separate table never populated |
| `config doubleBlind/factGathering/maxRounds/allowAudienceVoting` | `topology.config + maxRounds 38` | Partial `qualitySettings undefined` |
| `provenance` | `provenanceNodes/Edges` via `council-service:212` `addNode/link` | Not mapped |

No hash/checksum or bulk migration to prove bijection.

---

## Overall: NOT YET SAFE

- Persistence hardened (Zod, 3x retry, prune, Bucket, zombie) but not transactional.
- Evaluator wiring blocker — facade votes in-memory only, not `DebateStore`, engine still standard evaluator → cutover would lose all future votes on reload.
- No bulk historic migration (no flag, bulkPut, checksum, idempotency).
- Rollback comment-only, old tables still mutating despite “read-only” claim.

**Minimal safe steps before migration (observed gaps):**

1. Register `WeightedJudgeEvaluator` as selectable `IDebateEvaluator` in `phase3` via `topology.metadata.councilMode`.
2. Persist `votes/audienceVotes/judgeWeights` to `DebateStore` (`debateVerdicts` or `keyValue` with checksum) rather than facade Map.
3. Add `CouncilMigrationService` with `keyValue council:migrated:batch`, idempotent `saveSnapshot` loop, `verifyIntegrity` hash compare.
4. Index `debateSessions.topologyType` or `folder='council-migrated'` to avoid scan.
5. Snapshot `ecosystemService.snapshot('pre-unification')` + `Map councilId→debateId` in `keyValue`, then set council tables true read-only 2 releases before drop.

Until then, keep dual-write via `CouncilServiceFacade` (D4.2/4.3) and **do not drop** `councilSessions/Messages/Votes`.

С богом — audit без кода, только контракт. Следующий этап — выбрать: `D4.4 Judge migration` (one method at a time) vs ждать сильного ПК.
