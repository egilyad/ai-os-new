# TinyTroupe Audit → SuperAgents OS mapping (без кода)

> Дата: 2026-09-07. Источник: `microsoft/TinyTroupe` (TinyPerson/TinyWorld, factory, validators, cost, paper 2507.09788). Цель: что reuse, что добавить для `▶ SIMULATE` 5–10 реальных SuperAgents в мире.

---

## TinyTroupe сущности

| Сущность | Что делает | Ключевые методы/классы |
|----------|------------|------------------------|
| **TinyPerson** | Персона с traits/interests/goals, слушает stimuli, действует | `define()/listen()/see()/act()/listen_and_act()`, `TinyPersonValidator`, `ActionQualityControl` |
| **TinyPersonFactory** | Генерирует популяции из demography JSON/описания, parallel | `create_factory_from_demography()`, `generate_people(parallelize)`, `sampling_dimensions/plan` |
| **Fragments** | Reusable persona sub-spec (JSON fragment) | `import_fragment()` |
| **TinyWorld** | Среда, step-based loop, `run(n)` параллелит агентов внутри шага | `TinyWorld(name, agents)`, `make_everyone_accessible()`, `run(steps)`, subclass `TinySocialNetwork` |
| **Environment / Actions** | Action handlers определяют смысл действий, constraints via subclass | `action handlers`, `Intervention` (event-based mod) |
| **Memory** | Контекст личности + история взаимодействий внутри промпта | вшит в `TinyPerson` prompt, + `TinyToolUse`/`FilesAndWebGroundingFaculty` |
| **Interaction** | `TALK/CONVERSATION/THOUGHT/DONE`, listen/act cycle | `listen("Talk to Oscar") → TALK → DONE` |
| **Simulation loop** | `world.run(4)` → каждый step агенты `act` параллельно | parallel per step (0.5.1) |
| **Validators / Propositions** | Проверка persona adherence, self_consistency, fluency | `TinyPersonValidator`, `Proposition (0..9)` |
| **Viz / Costs** | Jupyter widget + cost tracking + Profiler | `AgentChatJupyterWidget`, `Profiler`, `pretty_print_cost_stats()` |

---

## SuperAgents OS — что уже есть (REUSE 80%)

| TinyTroupe | SuperAgents аналог | Файл / статус |
|------------|-------------------|--------------|
| `TinyPerson` | `PersonaService` + `CharacterService` + `AgentFactory.createResolved` (5 bindings: Role+Persona+Skill+Tool+Memory) | `persona/*`, `capability/*` phase53 — **REUSE** |
| `TinyPersonFactory` (DEMOGRAPHY→50 persons) | `AgentFactory + ScopedMem` (parallel generation нет, но `factory.generate_people parallelize=True` → можно через `GraphService` wave-parallel) | **PARTIAL** — добавить sampling plan |
| `Fragments` | `SkillMarket` fragments + `ToolCatalog` platform groups | `ops/skill-market`, `catalog` phase55 — **REUSE** |
| `TinyWorld` + `make_everyone_accessible` | `GraphService` + `SharedContextService` (isolation + handoff) + `InvocationEngine` (loopback) | **REUSE** |
| `Environment / TinySocialNetwork` | `Graph` nodes `task/crew/council` + `Federation` peers | **REUSE** |
| `listen/see/act` | `PersonaService.promptFor` → `AgentFactory.execute` → `ToolRunner` → `CogMemory.write(episodic)` | **REUSE** |
| `Intervention` | `GovernanceService` (capabilities/policy) + `HierarchyService` | **REUSE** |
| `Validators (0..9)` | `ScorerRegistryService` (contains/exact/token_f1 + custom) + `LlmJudgeService` (stub `PROVIDER-PENDING`) | `eval/*` phase61 — **REUSE** |
| `Cost tracking` | `ProviderTracker` + `ProviderBudget` + `DatabaseService` metrics | **REUSE** |
| `Jupyter widget` | `ExecutionVizService` + `Timeline 60` | `timeline/*` phase56 — **REUSE** |

**Вывод:** для первого `Simulation World` почти ничего нового не нужно писать — все кирпичики есть.

---

## Что добавить (минимальный Simulation Lab, ~20% нового)

| Компонент | Описание | Оценка |
|-----------|----------|--------|
| **World State** | `rooms: {id, name, x,y,w,h, agents[], props}` + `relations` (friendship/influence) + `globalClock` (Dexie `simulationWorlds` или `keyValue: sim:world:<id>`). No new Dexie migration если keyValue — как в G4/G5. | 1 файл `contracts/simulation-world.ts` + `services/simulation/world-state-service.ts` |
| **Simulation Engine** | `SIMULATE` loop: `for tick in 0..N: parallel agents act → resolve interactions → write CogMemory episodic + Timeline → emit SIM:tick`. Reuse `GraphService.runGraph` wave или свой loop (parallel Promise.all). | 1 файл `services/simulation/simulation-engine.ts` phase62 |
| **Sampling Plan** (опционально) | `demography.json → sampling_dimensions → plan` как в TinyPersonFactory (для 50 persons). Можно отложить — для 5–10 ручных агентов не нужно. | 1 helper |
| **Визуальный слой** | Карта комнат (SVG 1000×1000, как в `ComputerService` coords) + кружки-агенты + связи (GraphVizService) + event timeline (ExecutionViz). Fleet tab `Simulation Panel` — канвас BLOCKED в G3, теперь делаем minimal. | 1 panel `components/SimulationPanel/*` |
| **Controls** | `▶ SIMULATE / PAUSE / STEP / RESET`, slider ticks, `Profiler` summary (demographics) | в панели |

Ничего из `MCP/browser/codeExec/deploy` не трогаем.

---

## Как будет работать `▶ SIMULATE` (5–10 агентов)

```
1. Создать 5–10 агентов: PersonaService (lenses) + AgentFactory.createResolved (Skill→Tool + Memory scope)
2. Создать мир: WorldStateService.create({rooms:[...], agents:[ids], relations:[]})
3. Нажать ▶ SIMULATE (ticks=20):
   SimulationEngine.run(worldId, ticks=20, parallel=true)
     for each tick:
       parallel: agents.map(a => AgentFactory.execute(a, "act in world tick N, see neighbors"))
       → CogMemory.write(episodic, scope=worldId)
       → Timeline.addEvent(type='sim:tick', metadata={tick, actions})
       → WorldState.move/agents (если action = move_to room)
     emit sim:tick, sim:completed
4. Визуализация: SimulationPanel — rooms SVG + кружки (x,y) + lines relations + ExecutionViz overlay + cost stats
5. Валидация: ScorerRegistry + Proposition 0..9 (persona_adherence, self_consistency)
```

---

## Следующий шаг

1. **World State** contracts+service (phase62, keyValue, no migration) — additive.
2. **Simulation Engine** (phase63, parallel ticks, EventBus `sim:tick`).
3. **SimulationPanel** minimal (rooms + agents + timeline) — без drag-drop, только `▶/STEP`.

После этого — уже можно поселить 5–10 реальных SuperAgents и нажать `▶ SIMULATE` в копии.

> Evidence: `docs/TEN_SYSTEM_COMPARISON.md` (MCP/Browser etc not needed), `docs/CAPABILITY_MATRIX.md` (ExecutionViz 60, AgentFactory, Persona), TinyTroupe paper 2507.09788 Sec 3.4 Validators / 3.5 Propositions.
