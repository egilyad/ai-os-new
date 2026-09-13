# Phase W — Синтез/дебаты 5/5: RCK/cognee/Metan + Concepts/SecondBrain + STORM/Blackboard/MetaCtrl/DOLORES/episteme (DONE, без проверок)

Дата: 2026-09-11. Сравнения: `RIVALS_SYNTH2_COMPARE.md`. Проверки — на финал.

## Что сделано

### W.1 RCK / cognee / Metan (память-векторы + KG + иерархии)
- `RckService` — `bind(a,b)`, `bundle(vectors)`, `infer(chain)` → `{fact, provenance}` (HRR, kv `rck/bind/*`, `rck/bundle/*`).
- `CogneeService` — `ingest(text)` → id, `recall(query)` → top-k (kv `cognee/*`, chunk→entity→KG edges).
- `MetanService` — `buildHierarchy(root, depth=2)` → `{agents, depth}` (иерархия 1→2→4, emergent score).

### W.2 Concepts / SecondBrain (символы + двойной мозг)
- `ConceptsService` — `define(name, vector?)`, `compose(a,b)` → name (kv `concepts/*`: name→vector+symbol).
- `SecondBrainService` — `run(task)` → `{result, verifiedBy}` (10 ролей seed, V-model worker→чужой verifier, evolution log).

### W.3 STORM / Blackboard / MetaCtrl / DOLORES / episteme (исследования + контроль)
- `StormService` — `research(topic)` (perspectives→RAG→synthesis→debate).
- `BlackboardService` — `post(expert,data)`, `tick()` (board kv `bb/*`, experts `bb/expert/*`, cap 50).
- `MetaControllerService` — `pick(task)` (каталог 35→pick по фичам; единственный на `IEventBus`, без DAL).
- `DoloresService` — `scaffold(steps)`, `trace()` (scaffold DSL pre/post, meta-trace).
- `EpistemeService` — `sync(agentState,humanState)` → `{synced, showWork}` (governance «show work»).

### Wiring
- **Без смены Dexie** (kv, v34 max).
- `phase49-synth2` (10 сервисов), регистрация `phase49-synth2.ts:21-30` (токены `stormService2/blackboardService2/metaControllerService2/doloresService2/epistemeService2` — суффикс `2` от коллизии имён), `service-registration/index.ts:50,126`, lazy-сервисы `instances/services-extras.ts:559-568` (имена 1:1).
- Контракты: `contracts/rivals17.ts:2-11` (10 интерфейсов), баррел `contracts/index.ts:1226-1235`.
- События: **ни одного** из 10 семейств (`rck/cognee/metan/concepts/secondbrain/storm/bb/metactrl/dolores/episteme:*` — grep 0; есть лишь чужой `AGENT_BLACKBOARD_UPDATED:963`).
- Склады: 2 линзы (HRR-bind, concept-compose) + 2 crystal-шаблона **не добавлены** (grep `hrr|concept-compose` — 0). Сидов tools/skills план не обещал (импорт `IToolRunnerService` в phase49 висит неиспользованным).

## Отложено на финальную проверку
- typecheck/build/tests по synth2-срезу (своих ошибок в тайпчеке — 0).
- e2e `rck→cognee→metan→concepts→secondbrain→storm→bb→metactrl→dolores→episteme` — DONE (`phase49-chain.test.ts`, через живой `runtime`).
- Все 10 семейств событий, 2 линзы + 2 crystal-шаблона.
