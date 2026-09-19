# Сравнение 1-к-1, следующие 10 проектов + что дописываем

Дата: 2026-09-05. Фаза G. Без проверок до финала. (Agno/ADK частично уже
покрыты волнами 1–4: teams, loop-агенты, parallel fan-out — отдельно не дублируем.)

## 1. LangChain (классика)
- **У них:** ReAct-исполнитель (thought→action→observation), callbacks/tracer
  хуки, document loaders + text splitters, Plan-and-Execute.
- **Было у нас:** `runWithTools` без явного ReAct-скрата, декораторы вместо
  колбэков, чанкинг только внутри Knowledge, planner без plan-and-execute.
- **Дописываем (G.1):** `ReactService` (явный ReAct-цикл со скретчпадом),
  `LoaderService` (text/url/workspace-loaders + recursive splitter),
  стратегия `plan_and_execute` в Planner, tracer-хуки поверх Timeline.

## 2. LlamaIndex
- **У них:** agentic RAG (retrieve→synthesize→judge→refine), workflows
  шаги/события, query transforms + router'ы движков.
- **Было у нас:** одношаговый retrieve, роутинг только capability-based.
- **Дописываем (G.1):** `RagService.answer()` (rewrite→retrieve→synthesize→
  critique→refine до 2 кругов, цитаты), query-rewrite через LLM-мост.

## 3. Haystack
- **У них:** пайплайны из компонентов с сокетами, eval-компоненты
  (exact match, F1, SAS), конвертеры.
- **Было у нас:** граф-DAG вместо компонентных пайплайнов, бенчмарки только
  `expectContains`.
- **Дописываем (G.1):** метрики `exact|token_f1` в BenchmarkCase (рядом с
  contains), конвертер text→doc в LoaderService.

## 4. OpenHands (ex-OpenDevin)
- **У них:** песочный runtime (Docker), поток action→observation,
  микро-агенты (специализированные промпты: кодер, браузер, исследователь).
- **Было у нас:** sandbox-тикеты без action-потока, forge без микро-паков.
- **Дописываем (G.2):** `RuntimeService` (action-лог exec/browse/read/edit →
  observations, тикет-скоуп, микро-промпты built-in, персист в `agentLoops`).

## 5. SWE-agent
- **У них:** ACI-команды (search/open/goto/edit/create/submit + тесты),
  траектория + финальный патч.
- **Было у нас:** workspace-инструменты разрозненно, патчей и траекторий нет.
- **Дописываем (G.2):** `SweService` (виртуальный ACI поверх workspace:
  find/open/edit/apply_patch, тесты → sandbox-тикет, unified-diff патч,
  траектория в `agentLoops`).

## 6. Aider
- **У них:** repo-map (сжатая карта репозитория), форматы правок
  (whole/diff/udiff), авто lint/test-цикл, git-коммиты с сообщениями.
- **Было у нас:** чтение/поиск файлов без карты и apply-форматов.
- **Дописываем (G.2):** `AiderService` (repoMap из tree+grep-сигнатур,
  apply whole/diff, commit message через LLM, test-чеклист).

## 7. Roo Code / Cline
- **У них:** режимы (architect/code/debug/ask) + кастомные моды
  (свой промпт + разрешённые инструменты), чекпоинты задач.
- **Было у нас:** роли/линзы без режимной обёртки и tool-gating по модам.
- **Дописываем (G.2):** `ModesService` (built-in 4 + custom CRUD в kv,
  маппинг mode→toolkit, события переключения; чекпоинты уже есть в графе).

## 8. Mem0
- **У них:** прод-API памяти со скопами user/agent/run/app, историей версий,
  фильтрами; опциональный граф.
- **Было у нас:** ownerId без скопов run/app, истории версий нет.
- **Дописываем (G.3):** `ScopedMemService` (скопы `user:|agent:|run:|app:`,
  add/search/get/update/delete + версионирование в строке, таблица
  `scopedMem`; граф — через существующие memoryLinks).

## 9. Composio
- **У них:** 500+ интеграций с managed-auth, триггеры outward.
- **Было у нас:** 8 built-in tools + MCP-мост, каталога приложений нет.
- **Дописываем (G.3):** `IntegrationsService` (статический каталог ~20
  приложений: auth-kind, actions, triggers; connections в kv — только имя
  референса, без секретов; trigger → gateway envelope).

## 10. Eliza (ai16z)
- **У них:** character.json (bio/lore/style/topics), provider/action/evaluator
  плагины, клиенты Discord/Twitter/Telegram.
- **Было у нас:** distill персон из сэмплов, импорта character-файлов и
  реестра клиентов нет.
- **Дописываем (G.3):** `CharacterService` (парсинг character.json →
  PersonProfile + Voice + PersonaDepth через реальные сервисы; реестр
  клиентов в kv + route через gateway).

## Карта реализации (Фаза G, Dexie v34)
- Таблицы: только `scopedMem` (остальное — kv + существующие таблицы).
- События: `react:*`, `loader:*`, `rag:*`, `runtime:*`, `swe:*`, `aider:*`,
  `modes:*`, `smem:*`, `integration:*`, `character:*` (~10).
- Сервисы: react/loader/rag (+метрики в eval, +plan_and_execute в planner),
  runtime/swe/aider/modes, scopedMem/integrations/character → phase34.
- UI: расширение таба `rivals` (ReAct + RAG-кнопки).
