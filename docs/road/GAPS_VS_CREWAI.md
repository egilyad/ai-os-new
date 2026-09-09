# GAPS vs CrewAI (+ LangGraph/AutoGen/Mem0) — бэклог паритета

Дата: 2026-09-05. Честный список «у них есть, у нас нет», упорядоченный по
влиянию на разработку. Закрываем сверху вниз, без проверок до финала.

## Приоритет 0 — без этого всё остальное декорации

- [x] **E.1 Реальное LLM-исполнение.** Crew/Council/Graph/Eval работают на
  echo-заглушках. Завайрить `llmClientService`:
  `llm-bridge/llm-task-executor.ts` (CrewExecutor, CouncilPort, GraphPort,
  FrontierExecutor) + инъекция в phase23/24/25/31, `cacheScope` на каждый
  вызов (паттерн B-20). Per-agent model override.
- [x] **E.2 Исполнение инструментов.** Сейчас только governance (`check()`).
  Нужен `tool-runner-service`: встроенные tools (read/write файлов workspace,
  http fetch, code-python через SandboxBroker-тикет), мост к `MCPService`,
  вызов из LLM- systemic loop (toolCalls → run → повторный chat, max 3 круга).

## Приоритет 1 — ядро фреймворка

- [x] **E.3 Consensual process + task-контракты.** `Process='consensual'`
  (голосование по задаче), `context=[taskId]` автоподстановка выходов,
  валидация `outputSchema`, async tasks, callbacks.
- [x] **E.4 Guardrails + human_input на task.** Валидатор выхода
  (retry до N раз), `human_input=True` → пауза crew с HITL через graph.
- [x] **E.5 Knowledge RAG.** Источники (url/pdf/text) на агента/crew:
  `knowledge-service` (fetch + чанки + token-overlap retrieval сейчас,
  embeddings позже), цитирование источников в выходах.
- [x] **E.6 Векторная память.** `IEmbeddingPort` + blend 0.6/0.4 в Knowledge
  (провайдерный embedder — отдельная интеграция, порт готов).

## Приоритет 2 — DX и CLI

- [x] **E.7 Train/Replay/Test.** `training-service` (гайды per role,
  автоподмешивание в системный промпт через bridge), `replayCrew`,
  `testCrew`; `resetTasks` в CrewService; событие `training:recorded`.
- [ ] **E.8 Flow-DX.** Декораторный стиль поверх графа: `defineFlow()`
  builder (start/listen/router/human), Pydantic-подобные схемы состояния
  (Zod уже в проекте), `plot()` → mermaid/dot экспорт структуры.

## Приоритет 3 — Studio/платформа

- [x] **E.9 UI-панели новых модулей.** Единая `FleetPanel` (консоль флота,
  9 табов: Crews/Councils/Graphs/Persona/Ops/Interop/Meta/Trust/Frontier),
  роут `fleet`, i18n en/ru, mobile-first (кнопки Approve/Reject с телефона).
- [ ] **E.10 Triggers + Agent Repository.** Триггеры (расписание/webhook →
  payload в crew/graph; мост уже есть scheduler→invocation — расширить),
  org-репозиторий переиспользуемых агентов (поверх SkillMarket/bundles).
- [ ] **E.11 Deploy/export.** Export crew/graph как standalone JSON +
  «Export as MCP» (манифест для MCPService), проектный ZIP-дамп
  (конфиг + гайды + пакеты).

## Что НЕ гонимся повторять

- Масштаб/комьюнити CrewAI (звёзды, курсы) — не кодовая задача.
- Их цифры throughput — маркетинг, не спецификация.
- Python-экосистема — мы TypeScript-first, это осознанно.

## Порядок закрытия (план фаз)

**Фаза E (паритет):** E.1 → E.2 → E.3 → E.4 → E.5 → E.6 → E.7 → E.8 →
E.9 → E.10 → E.11. Каждый пункт — additive, ядро не ломаем.
Финальная проверка всего (typecheck/build/tests) — после E.11.
