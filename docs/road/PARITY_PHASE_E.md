# Phase E — Паритет с CrewAI (DONE, без проверок)

Дата: 2026-09-05. Проверки отложены на финал. План: `GAPS_VS_CREWAI.md`.

## Что сделано

### E.1 Реальное LLM-исполнение
- `services/llm-bridge/llm-task-executor.ts` — 4 адаптера поверх
  `llmClientService`: `LlmCrewExecutor` (system из role+goal+backstory+guide,
  user из task+context), `LlmCouncilPort` (stance + JSON judge ballot),
  `LlmGraphPort` (task + reflection), `LlmFrontierExecutor` (benchmarks).
- Везде `cacheScope` (B-20), per-agent model override, echo-fallback при ошибке.
- Сеттеры `setExecutor/setLlmPort/setExecutor`, wiring в phase23/24/25/31
  (только если `llmClientService` есть — иначе офлайн-заглушки как было).

### E.2 Инструменты + Knowledge
- `services/parity/tool-runner-service.ts` — 8 built-in tools
  (workspace.list/read/search, http.fetch с SSRF-guard, time.now, math.calc
  на безопасном парсере, knowledge.search, mcp.call через реальный MCPService),
  policy-gate через ToolGovernance, agentic loop LLM→toolCalls→execute (до 5 кругов).
- `services/parity/knowledge-service.ts` — RAG: url/text источники, чанки,
  цитирование, best-effort fetch. События `tool:executed`, `knowledge:added`.

### E.3 Task-контракты + обучение
- Crew: `consensual` process (голосование до 3 ролей), `contextTaskIds`
  (CrewAI `context`), soft `outputSchema` (contains/minLength + 1 retry),
  `humanInput` → `awaiting_human` + crew `paused` + `submitHumanTask/resumeCrew`,
  событие `task:hitl`, `resetTasks` для replay.
- `services/parity/training-service.ts` — гайды per role (suggestions+quality,
  автоподмешивание в системный промпт через bridge), `replayCrew`, `testCrew`
  (N прогонов). Событие `training:recorded`.
- `IEmbeddingPort` + blend 0.6/0.4 в Knowledge (провайдерный embedder — отдельно).

### E.4 Fleet Console (Studio-паритет, стартовый)
- `components/FleetPanel/` — одна консоль, 9 табов всех новых модулей:
  forge+run crews, create/advance/conclude councils, build&run graphs с
  Approve/Reject, контексты/цели, миссии/уведомления, пиры/передачи,
  предложения/пакеты, бандлы/снапшоты, бенчмарки/орги.
- Роут `fleet`, nav, иконка, i18n en/ru. Mobile-first инлайн-стили.

### Wiring
- Dexie **v32** additive (knowledgeSources, trainGuides), `ParityRepository`
  (DAL `parity`), `phase32-parity` (toolRunner + knowledge + training),
  3 события, lazy-сервисы, `trainingService` в `_test-harness`.

## Остаток из GAPS (не закрыто, честно)
- E.8 Flow-DX (декораторный builder поверх графа) — граф уже покрывает
  семантику, остался сахар.
- E.10 Triggers + Agent Repository (триггеры частично есть через scheduler-мост).
- E.11 Deploy/export (export JSON/манифесты частично есть: cards, skills, bundles).
- Провайдерный `IEmbeddingPort` имплементация, per-agent tools из CrewAI
  (назначение tools агенту — сейчас tools на уровне раннера).

## Дальше — финальная проверка всего вместе, когда скажешь.
