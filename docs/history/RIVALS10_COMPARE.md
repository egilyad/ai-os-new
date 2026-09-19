# Сравнение 1-к-1, девятая десятка: 9 GOOGLE + CHAT STUDIO

Дата: 2026-09-05. Фаза P. Без проверок до финала. Всё на kv (смены Dexie
нет). Плюс: наполнение складов (tools/skills/roles/линзы/шаблоны) — см. низ.

## 1. A2A Protocol (Google, spec)
- **У них:** AgentCard (capabilities/streaming), message parts
  (Text/Data/File), TaskState (submitted/working/input-required/completed/
  canceled/failed/rejected), artifacts, SSE-стриминг, push notifications.
- **Было у нас:** generic A2A (Фаза A) без spec-типов и task-машины.
- **Дописываем (P.1):** `A2aSpecService` (AgentCard builder, task manager со
  состояниями + artifacts, SSE-frame лог, push-config в kv).

## 2. Gemini Context Caching + File API
- **У них:** cached contents с TTL (экономия), File API реестр.
- **Было у нас:** `cachedContent` прокидывается в адаптере, но менеджера нет.
- **Дописываем (P.1):** `CacheRegistryService` (записи stable-префикса с TTL,
  sweep expired, stats hits/saves, file refs в kv).

## 3. Firebase Genkit (dotprompt)
- **У них:** типизированные промпты (input/output схемы + валидация),
  evaluators, plugins, telemetry.
- **Было у нас:** PromptHub без схем.
- **Дописываем (P.1):** `DotpromptService` (template + required/типы +
  validate с понятными ошибками, render поверх PromptHub).

## 4. NotebookLM
- **У них:** notebooks из источников, Audio Overviews, mind maps,
  grounded-ответы с цитатами.
- **Было у нас:** RAG без notebooks/аудио/карт.
- **Дописываем (P.1):** `NotebookService` (notebook = набор source ids,
  audio script через LLM + TTS-delegate/queued, mindmap JSON дерево).

## 5. Gemini Live (realtime)
- **У них:** стриминг, barge-in (перебивания), function calling в стриме.
- **Было у нас:** базовый start/sendText.
- **Дописываем (P.2):** `LiveBridgeService` (barge-in: пометка прерванного
  хода + resume, live tool-call мост в ToolRunner с инжектом результата).

## 6. CCAI Agent Assist
- **У них:** smart replies (3 варианта), next-best-action, knowledge
  surfacing в звонке.
- **Было у нас:** подсказок оператору нет.
- **Дописываем (P.2):** `AssistService` (smartReplies через LLM/эвристику,
  NBA-ранжирование действий, knowledge-подмес).

## 7. Vertex Agent Builder (search apps)
- **У них:** datastore + boost/bury правила + serving answer.
- **Было у нас:** datasets без boost.
- **Дописываем (P.2):** `VertexSearchService` (datastore = datasetId,
  boost/bury списки, answer с rerank через boost).

## 8. Gemini Deep Research
- **У них:** research plan, прогресс, бриф с таблицей источников.
- **Было у нас:** research-engine богатый, но plan+brief-экспорта нет.
- **Дописываем (P.2):** `DeepResearchService` (plan шаги через LLM, прогон
  шагов через RagService, brief-markdown с источниками).

## 9. AI Studio keys/quotas
- **У них:** ключи с квотами, алерты, ротация.
- **Было у нас:** key-management + budgets, per-key quota-guard нет.
- **Дописываем (P.3):** `QuotaGuardService` (usage per key в kv, threshold →
  disabled-флаг + событие + notification).

## 10. Lee Chat Studio (гипотеза: Cherry Studio)
- **У них (предположительно):** маркет ассистентов, MCP-подключение в клик,
  knowledge bases, переводы с глоссарием. **Если это другой продукт —
  кинь ссылку, переделаю точечно.**
- **Было у нас:** всё порознь, one-click паков нет.
- **Дописываем (P.3):** `StudioPackService` (agent-pack импорт: роль+промпт+
  tools → crew role + persona; MCP quick-add → mcpService; KB attach →
  knowledge source; translate с глоссарием через LLM).

## Склады: наполнение из всех проектов (P.3)
- Tools: `json.get`, `text.stats`, `list.unique` (safe, без eval) в ToolRunner.
- Skills: 5 манифестов (researcher, coder, reviewer, translator, summarizer).
- Crew-шаблоны: `sop-software` (MetaGPT), `deep-research` (Gemini DR),
  `support-inbox` (Intercom), `app-scaffold` (v0-стиль).
- Council-линзы: `premortem`, `redteam-lead`, `scout`, `base-rates`.
- Роли: seed через RoleRepository — пропущено осознанно (роли трогает
  существующий RoleService с builtin-набором; добавим на финалке руками).

## Карта реализации (Фаза P, phase42)
- События: `a2aspec:*`, `cache:*`, `dotprompt:*`, `notebook:*`, `live:*`,
  `assist:*`, `vertex:*`, `deepres:*`, `quota:*`, `studio:*` (~10).
- Сервисы: a2aspec/cache/dotprompt/notebook, live/assist/vertex/deepresearch,
  quota/studiopack + seed складов → phase42.
- UI: кнопки в табе `rivals` (A2A card, notebook audio, deck уже есть).
