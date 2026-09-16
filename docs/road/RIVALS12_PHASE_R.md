# Phase R — Экзотика: Constitutional/Voyager/Smallville + AlphaCode/WorldModels/NeuroSymbolic + Swarm/ALife/Curiosity/Quantum (DONE, без проверок)

Дата: 2026-09-11. Сравнения: `RIVALS12_COMPARE.md`. Проверки — на финал.

## Что сделано

### R.1 Constitutional / Voyager / Smallville (выравнивание + навыки + симы)
- `ConstitutionalService` — kv-конституция, `critique` → violations, `revise` (+эмитит `CONSTIT_*`).
- `VoyagerService` — kv skill-library (`voyager/*`), curriculum queue, `proposeGoal/verify/step` (+эмитит `VOYAGER_*`).
- `SmallvilleService` — kv stream (`smallville/<agent>`), importance, `observe/stream/reflect` + `planDay` (рефлексия каждые N).

### R.2 AlphaCode / WorldModels / NeuroSymbolic (код-семплы + миры + логика)
- `AlphaCodeService` — `generate(task, samples=5)` → `{candidates, best}` (N семплов через LLM, фильтр CodeExec-тестами, кластер по output-hash).
- `WorldModelService` — kv `world/*`, `record/predict/imagine` (train from Gym).
- `NeuroSymbolicService` — предикаты P(x) + fuzzy axioms, `setPredicate/addAxiom/query`.

### R.3 Swarm / ALife / Curiosity / Quantum (рой + эволюция + любопытство + QUBO)
- `SwarmService` — ACO (pheromones) + PSO, stateless, без DI.
- `ALifeService` — kv genomes, `seed/tick` (copy+mutation, fitness, selection).
- `CuriosityService` — `bonus/pickAction` (bonus = predictor error, опц. WorldModel).
- `QuantumDeepService` — `defineQubo/anneal` (QUBO в kv, annealing, best pick). **Имя отличается от плана** (`QuantumService`) — зафиксировано как есть.

### Wiring
- **Без смены Dexie** (kv + `agentLoops`, v34 max).
- `phase44-rivals12` (10 сервисов), регистрация `phase44-rivals12.ts:20-31`, `service-registration/index.ts:45,121`, lazy-сервисы `instances/services-extras.ts:497-506` (+типы `:172`), баррел `contracts/index.ts:1164`, каталог `data/rivals-catalog.ts:183` (id `rivals12`).
- Контракты: `contracts/rivals12.ts:1-65` (10 интерфейсов, 1-к-1 с планом).
- События: только 4 из ~10 семейств — `CONSTIT_CRITIQUE/REVISE`, `VOYAGER_SKILL/STEP` (`event-registry.ts:2254-2258`); нет `smallville/alphacode/world/neuro/swarm/alife/curio/quantum:*`.
- UI: 3 кнопки в табе `rivals` (constitution check, voyage step, smallville reflect) **не сделаны** — `components/**` не ссылается ни на один из 10 сервисов (только i18n `fleet.tab_rivals`).
- Сиды tools/skills: отдельных нет (Voyager пишет skills только через свой kv на `step()`).

## Отложено на финальную проверку
- typecheck/build/tests по rivals12-срезу (тестов `services/rivals12/*.test.ts` — 0; своих ошибок в тайпчеке — 0, остаются общие логгер-паттерны ядра).
- e2e `constit→voyager→smallville→alphacode→world→neuro→swarm→alife→curio→quantum` — DONE (`phase44-chain.test.ts`, через живой `runtime`).
- Недостающие 6 семейств событий, 3 UI-кнопки в табе `rivals`.
