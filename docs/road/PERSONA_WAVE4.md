# Wave 4 — Memory, Persona, Shared Context, Goals (DONE, без проверок)

Дата: 2026-09-05. Проверки отложены на финал.

Аддитивный слой **Persona & Context** — Memory Mesh, роли и workspace
не тронуты.

## Что сделано

### 4.1 Long-term Memory + tiers + graph
- `services/persona/lt-memory-service.ts` — `remember/recall/forget`,
  `coreContext()` (ядро для промпта), `promote/demote`
  (core↔recall↔archival), `summarize`.
- Поиск — детерминированный token-overlap + boost core (офлайн);
  `IPersonaLlmPort` — точка для эмбеддингов/LLM-саммари позже.
- Графовая память: `link(from,to,relation)` (supports/contradicts/elaborates/
  caused_by/relates), `neighbors(id, depth)` через BFS по `memoryLinks`.
- События `memory:remembered/promoted/forgotten/linked`.

### 4.2 Person / Voice Profile + глубокая персона
- `services/persona/persona-service.ts` — `distillPerson({ownerId,displayName,samples})`:
  style (длина/вопросы/списки/код), judgments (маркерные глаголы),
  phrases (частые биграммы); LLM-порт опционален.
- `distillVoice` (tone/vocabulary), `setDepth/getDepth`
  (traits 0..1, beliefs, values, commStyle, quirks — TinyTroupe-style),
  `promptFor(ownerId)` — AgentCard-совместимый промпт-блок.
- Событие `persona:distilled`.

### 4.3 Shared Context + Goals
- `services/persona/shared-context-service.ts` — контексты со scope
  (crew/council/graph/room), `addEntry` (note/file/credential_ref/history/decision),
  `shareWith`, `listEntries`.
- Безопасность: `credential_ref` хранит ТОЛЬКО имя референса — тело,
  похожее на секрет, отклоняется с ошибкой.
- Goals: team/agent уровни, `updateProgress` (100 → auto-achieved),
  `setGoalStatus`, события `goal:created/progress/completed`.

### Wiring
- Dexie **v26** additive (8 таблиц: ltMemories, memoryLinks, personaProfiles,
  voices, personaDepths, sharedContexts, contextEntries, goals).
- `PersonaRepository` (DAL `persona`), `phase26-persona` (3 сервиса),
  10 событий, lazy `ltMemoryService/personaService/sharedContextService`,
  `stores/personaStore.ts` (контексты + цели, только читает события).

## Отложено на финальную проверку
- typecheck/build/tests/lint по persona-срезу, e2e
  remember→recall→promote→link→distill→context→goal→store.

## Следующий шаг (Wave 5)
Иерархия, бюджеты, MCP, песочницы, мониторинг, Skills, Mobile & Remote Access.
