# Phase P — Google + Chat Studio (DONE, без проверок)

Дата: 2026-09-05. Сравнения: `RIVALS10_COMPARE.md`. Проверки — на финал.

## Что сделано

### P.1 A2A-spec / Cache / Dotprompt / Notebook
- `A2aSpecService` — spec-карточки (capabilities/streaming/skills),
  task-машина submitted→… с guard переходов, artifacts из parts,
  SSE-frame лог, push-config.
- `CacheRegistryService` — записи stable-префикса с TTL, sweep, stats
  (ключи — готовый `cachedContent` для адаптера).
- `DotpromptService` — template + input/output схемы (string/number/boolean),
  строгий render и validateOutput.
- `NotebookService` — notebooks поверх knowledgeSources, audio-скрипт
  (LLM двух ведущих + TTS-delegate/queued), mindmap-дерево, askNotebook.

### P.2 Live / Assist / Vertex / DeepResearch
- `LiveBridgeService` — barge-in (park + счётчик), resume, liveTool-мост.
- `AssistService` — smartReplies (3), nextActions (ранжирование),
  surfaceKnowledge.
- `VertexSearchService` — datastore + boost/bury + rerank поверх Dataset.
- `DeepResearchService` — plan + прогон через Rag + brief с таблицей.

### P.3 Quota / StudioPack / Склады
- `QuotaGuardService` — usage per key, threshold → disabled + событие +
  notification, re-arm при поднятии квоты.
- `StudioPackService` — agent-pack (crew role + persona), MCP quick-add,
  KB attach, translate с глоссарием.
- Склады: 3 safe tools (json.get/text.stats/list.unique) + 5 скиллов
  (seed идемпотентный), 4 crew-шаблона (sop-software/deep-research/
  support-inbox/app-scaffold), 4 council-линзы
  (premortem/redteam-lead/scout/base-rates).

### Адаптеры (N.1 из этой же волны работ)
- deepseek/kimi/minimax/qwen + `reasoningContent` + дефолты/имена.

### Wiring
- **Без смены Dexie** (kv + существующие таблицы).
- `phase42-rivals10` (10 сервисов), 8 событий, lazy-сервисы,
  notebook/dotprompt-кнопки в табе `rivals` (+i18n en/ru).
- Про Chat Studio: покрыт как Cherry Studio (маркет + MCP + KB + перевод).
  Если имелся в виду другой продукт — кинь ссылку, докручу точечно.

## Отложено на финальную проверку
- typecheck/build/tests/lint (адаптеры + rivals10), e2e
  card→cache→dotprompt→notebook→live→vertex→brief→quota→pack→seed.

## Дальше — финальная проверка всего вместе, когда скажешь.
