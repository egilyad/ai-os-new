# Wave 1 — Crew + Task + Process + Agent Card + Forge (DONE, без проверок)

Дата: 2026-09-05. Проверки (typecheck/build/tests) отложены по просьбе пользователя
(слабый ПК) — выполнить в самом конце вместе со всеми волнами.

## Что сделано

### 1.1 Crew + Task + Process
- `src/kernel/types/crew-types.ts` — `AgentRole`, `CrewTask`, `Crew`,
  `CrewProcess` (sequential/hierarchical), `CrewStatus`, Dexie records.
- `src/kernel/contracts/crew.ts` — `ICrewService`, `ICrewTaskExecutor`,
  `IAgentForgeService`, `ForgeProposal`, high-level API.
- `src/kernel/dal/crew-repository.ts` — DAL над Dexie `crews` + `crewTasks`.
- `src/kernel/services/crew/crew-service.ts` — CRUD + `startCrew`/`abortCrew`
  (sequential + hierarchical с delegation-контекстом от manager),
  topological ordering по `dependsOn`, события на каждый переход.
- События `crew:created/started/completed/failed/aborted/deleted`,
  `task:started/completed/failed`, `forge:proposed` в `event-registry.ts`
  (автоматом в EVENTS/EventMap/Validators).
- Персистентность: Dexie **v23** (`crews`, `crewTasks`), additive, без `.upgrade()`.
  `database-service`, `IDatabaseService`, `_test-harness`, DAL (`crew`),
  `phase23-crew`, регистрация в `service-registration/index.ts`,
  lazy-сервисы `crewService/crewRepository/agentForgeService`.

### 1.2 Agent Card / Identity
- `AgentCard` в `crew-types.ts` (name/role/style/voice/skills/limitations/goal/backstory).
- `CrewService.cardFromRole/roleFromCard/exportCard/importCard/validateCard`
  — экспорт/импорт JSON (`{ kind: 'agent-card', version: 1, card }`).

### 1.3 Agent Forge
- `src/kernel/services/crew/agent-forge-service.ts` — `propose({goal,constraints})`
  + `materialize(proposal)`. Сейчас: детерминированные keyword-эвристики
  (research/code/content/design/critic/strategy + fallback-команда),
  auto sequential/hierarchical, `__role:N__` плейсхолдеры.
  `ForgeLlmPort` — точка для LLM-предложений позже без смены вызывателей.

### 1.4 High-level API + шаблоны
- `src/kernel/services/crew/crew-templates.ts` — 4 шаблона:
  `research-team`, `code-review-council`, `content-forge`, `debate-prep`.
- `createCrewFromTemplate/listTemplates` в `ICrewService`.
- `src/stores/crewStore.ts` — Zustand-наблюдатель над `crew:*`
  (mirror directorStore/invocationStore, только читает события).

## Принципы соблюдены
- local-first (Dexie), только через EventBus, ядро не тронуто
  (только additive: новые таблицы/события/фаза), Kernel→Services→Panels.

## Отложено на финальную проверку
- `npm run typecheck:fast`, `typecheck`, `build`, `vitest run` (crew-срез),
  `lint` по новым файлам, e2e прогон create→forge→start→events→store.

## Следующий шаг (Wave 2 начало)
Усиление Debate Arena: линзы/полярности, Forum/Whisper, Multi-Judge,
Fact-Checker, Double-blind — поверх текущего `debateService`, не ломая его.
