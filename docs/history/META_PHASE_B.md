# Phase B — Meta-cognition + Advanced Memory (DONE, без проверок)

Дата: 2026-09-05. Проверки отложены на финал.

Аддитивный **Meta-слой** — MetaLearning, Crystals, LtMemory, SkillMarket
не тронуты (переиспользуются через делегаты).

## Что сделано

### B.1 Meta-агент + эволюция + диагностика (Волна 8.12/8.13/8.15)
- `services/meta/meta-agent-service.ts` — `analyze({subject, observations})`
  → proposal (kind авто-инференс prompt/team/skill/param/workflow,
  confidence растёт с числом наблюдений), lifecycle
  proposed→accepted→applied (+rejected) с guard'ами.
- `evolveSkill()` — дистилляция паттерна в SkillMarket-манифест через
  реальный `skillMarketService` (`author: 'meta-agent'`); без делегата —
  draft-ref. Событие `meta:evolved`.
- `reportHealth/listHealth` — сигналы degradation/loop/cost/quality
  с severity 0..1. Событие `meta:health`.

### B.2 Стратегии + декомпозиция (Волна 8.14/8.16)
- `services/meta/strategy-service.ts` — `recordStrategy(taskClass, steps, success)`
  со скользящим successRate, `bestFor/replay` (лучшие шаги класса задач).
- `decompose(goal, depth≤4, breadth 2..5)` — дерево подцелей
  (split по разделителям + fallback Research/Execute/Verify),
  `markNode(done/failed)` с поиском по дереву.

### B.3 Unified memory + governance + counterfactual + packages (Волна 9)
- `services/meta/cog-memory-service.ts` — 4 вида
  (episodic/semantic/procedural/identity) × 3 scope
  (private/team/shared) в одном API: `write/read` (token-overlap +
  importance-boost, shared виден всем), `setPolicy/govern`
  (expiry, importance floor, over-quota по importance+recency).
- Counterfactuals: `recordCounterfactual(whatHappened/whatIf/lesson)`.
- Knowledge compilation: `compilePackage({name, taskClass})` — лучшая
  стратегия → playbook + top procedural/semantic memories, версионирование.
- События `cog:written/governed/counterfactual/compiled`.

### Wiring
- Dexie **v29** additive (8 таблиц), `MetaRepository` (DAL `meta`),
  `phase29-meta` (3 сервиса, evolve→реальный SkillMarket),
  8 событий `meta:*/cog:*`, lazy-сервисы, `stores/metaStore.ts`.

## Отложено на финальную проверку
- typecheck/build/tests/lint по meta-срезу, e2e
  analyze→accept→apply→evolve→strategy→decompose→cog→govern→package→store.

## Следующая — Фаза C
Волна 10 (безопасность и доверие) + Волна 11 (экосистема).
