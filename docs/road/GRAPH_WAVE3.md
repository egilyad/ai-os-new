# Wave 3 — State Graph + Checkpointing + HITL (DONE, без проверок)

Дата: 2026-09-05. Проверки отложены на финал.

Новый **State Graph runtime** — additive слой, Builder/EventSourcing/TimeMachine
не тронуты (граф их переиспользует как концепции, не меняя код).

## Что сделано

### 3.1 Graph runtime + 6 режимов
- `types/graph-types.ts` — `GraphNodeDef` (task/crew/council/reflection/gate/human),
  `GraphEdge` с `condition` (`key=value`, `key!=value`, truthy), `GraphDefinition`,
  `GraphRun`, `HitlRequest`, `GraphCheckpoint`, `DecisionEntry`.
- `services/graph/graph-service.ts` — синхронный драйвер: очередь узлов,
  conditional routing, maxSteps-guard (default 50), fan-out для swarm-корней.
- `services/graph/graph-modes.ts` — `buildModeGraph()` для 6 режимов:
  **sequential, hierarchical, council, swarm, graph, forge**.
- `phase25-graph` делегирует crew-узлы → реальный `CrewService.startCrew`,
  council-узлы → реальный `CouncilService` (create→advance→conclude),
  forge-черновики → `AgentForgeService.propose`. Без делегатов — детерминированные заглушки (офлайн).

### 3.2 Checkpointing + Time-travel + HITL
- Чекпоинт после **каждого** узла (полный снапшот state, JSON) + событие
  `graph:checkpoint`. Dexie v25: `graphs/graphRuns/graphCheckpoints/graphDecisions`.
- Time-travel: `restoreCheckpoint(runId, checkpointId)` → state/visited/шаги
  откатываются, run встаёт на паузу с HITL «Approve to resume» (безопасно).
- HITL: `interrupt` (пауза + `graph:hitl`), узлы kind `human` и `requireApproval`
  встают на паузу сами; `approve(runId, editedState?)` продолжает драйвер;
  `reject(reason)` — abort с записью в decision log; `editState(patch)` —
  просмотр/правка состояния; `abortRun`.

### 3.3 Reflection + Decision Log
- `reflectEvery: N` — авто-рефлексия каждые N шагов + ручной `reflect()`;
  `IGraphLlmPort` опционален, иначе детерминированный суммарайзер
  (visited → state keys → last output). Событие `graph:reflected`.
- Decision Log: каждая нода пишет `decision/why/rejected[]`
  (отклонённые ветки условий фиксируются — «от чего отказались»),
  читается через `decisionLog(runId)`.

### События и wiring
- 12 событий `graph:*`: defined/started/node/checkpoint/reflected/hitl/
  approved/rejected/completed/failed/aborted/restored.
- DAL `graph`, lazy `graphService`, `stores/graphStore.ts` (только читает события).

## Отложено на финальную проверку
- typecheck/build/tests/lint по graph-срезу, e2e
  define→run→hitl→approve→checkpoint→restore→reflect→decisions→store.

## Следующий шаг (Wave 4)
Память (Letta-style + graph), Person/Voice Profile, Shared Context, Goals.
