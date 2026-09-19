# Wave 2 — Council / advanced debate (DONE, без проверок)

Дата: 2026-09-05. Проверки отложены на финал (слабый ПК).

Слой **Council** — additive над существующим Debate Runtime (не тронут):
`DebateSyncManager`, `debate:*` события, линзы, форум — всё как было.

## Что сделано

### 2.1 Линзы + полярности + роли + фазы
- `services/council/council-lenses.ts` — 10 линз (Socrates, Feynman, Sun Tzu,
  Popper, Kahneman, Steelman, Devil's Advocate, Systems, Empiricist, Historian)
  + 4 полярности (optimist/skeptic, builder/critic, visionary/accountant,
  tradition/disruption), `promptFor()` собирает промпт участника.
- Роли: `proponent / opponent / researcher / fact_checker / judge / moderator`
  (`council-types.ts`). Дефолтная сессия: Proponent + Opponent + Researcher + Fact Checker.
- Фазы: `proposal → [fact_gathering] → debate → consensus → completed/aborted`
  (`advancePhase` + событие `council:phase`).

### 2.2 Forum/Whisper + Double-blind + Fact-gathering + слепой судья
- Каналы: `forum` (broadcast) + `whisper` (private author→to, валидация получателя),
  события `council:message` / `council:whisper`.
- Double-blind: `config.doubleBlind` → алиасы `Speaker A/B/…`, все исходящие
  события (proposal/message/whisper/judged/completed) несут алиас вместо id.
- Fact-gathering: `submitFact` только для researcher/fact_checker/moderator,
  вердикты `verified/disputed/unverifiable` + sources, событие `council:fact`.

### 2.3 Multi-Judge + Audience Voting + State-Graph node
- `submitJudgeScore` — N независимых судей, свои dimensions + weight,
  `blind` флаг из конфига, событие `council:judged`.
- `castAudienceVote` — голос пользователя mid-debate (когда
  `allowAudienceVoting`), событие `council:vote`.
- `conclude` — взвешенный tally судей + audience как tie-break, winner + summary,
  событие `council:completed`.
- `services/council/council-graph-node.ts` — `createCouncilGraphNode(council)`:
  `{ nodeType: 'council', run({topic, stances}) → { winnerId, summary, sessionId } }`
  — задел под Wave 3 State Graph, импортируется без знания внутренностей.

### Персистентность и wiring
- Dexie **v24** additive: `councilSessions/councilMessages/councilVotes`
  (сессия хранит участников/судей/алиасы, факты/судейские/аудитория — в `councilVotes`
  с kind fact/judge/audience для единого аудита).
- `CouncilRepository` (DAL `council`), `phase24-council`, события `council:*` ×10,
  lazy `councilService`, `stores/councilStore.ts` (только читает события).

## Отложено на финальную проверку
- typecheck/build/tests/lint по council-срезу, e2e
  create→proposal→fact→debate→judge→vote→conclude→store.

## Следующий шаг (Wave 3)
State Graph runtime + Durable Checkpointing/Time-travel + мощный HITL
поверх Cognitive Builder + Event Sourcing.
