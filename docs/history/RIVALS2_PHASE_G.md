# Phase G — Паритет со следующими 10 проектами (DONE, без проверок)

Дата: 2026-09-05. Сравнения 1-к-1: `RIVALS2_COMPARE.md`. Проверки — на финал.

## Что сделано

### G.1 LangChain / LlamaIndex / Haystack
- `ReactService` — явный ReAct-цикл со скретчпадом (thought/action/observation,
  JSON-протокол, экшены в ToolRunner, событие `react:step`).
- `LoaderService` — text/url/workspace-лоадеры + рекурсивный сплиттер
  (параграфы → предложения → окна с overlap) + `toDoc` конвертер.
- `RagService.answer()` — rewrite→retrieve→synthesize→critique→refine
  (до 2 кругов), цитаты из Knowledge-хитов, событие `rag:answered`.
- Метрики Haystack: `exact|token_f1` в BenchmarkCase (рядом с contains,
  partial credit, порог 0.5); `plan_and_execute` в PlannerService
  (план → исполнение → синтез).

### G.2 OpenHands / SWE-agent / Aider / Roo
- `RuntimeService` — action-поток exec/browse/read/edit/note с observations,
  тикет-скоуп SandboxBroker, микро-промпты coder/browser/researcher,
  персист в `agentLoops`.
- `SweService` — виртуальный ACI поверх workspace (find/open/edit/create),
  тесты → sandbox-тикет, unified-diff патч, траектория.
- `AiderService` — repoMap (дерево + символы через grep), apply whole/diff,
  commit message через LLM, test-чеклист по типу изменения.
- `ModesService` — architect/code/debug/ask + custom CRUD в DAL kv
  (без смены схемы!), toolkit-gating, событие `modes:switched`.

### G.3 Mem0 / Composio / Eliza
- `ScopedMemService` — скопы `user:|agent:|run:|app:`, CRUD + история версий
  (cap 20), таблица `scopedMem`.
- `IntegrationsService` — каталог 20 приложений, connections в kv
  (только имя референса — секреты запрещены валидацией), trigger →
  gateway envelope + событие.
- `CharacterService` — импорт character.json в реальный стек
  (PersonProfile + Voice + Depth), реестр клиентов в kv, route через gateway.

### Wiring
- Dexie **v34** additive (только `scopedMem`; моды/коннекты/клиенты — kv),
  `phase34-rivals2` (10 сервисов), 9 событий, lazy-сервисы,
  ReAct/RAG-кнопки в табе `rivals` (+i18n en/ru).

## Отложено на финальную проверку
- typecheck/build/tests/lint по rival2-срезу, e2e
  react→rag→runtime→swe→aider→modes→smem→integration→character.

## Дальше — финальная проверка всего вместе, когда скажешь.
