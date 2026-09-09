# Phase J — Паритет с пятой десяткой (DONE, без проверок)

Дата: 2026-09-05. Сравнения 1-к-1: `RIVALS5_COMPARE.md`. Проверки — на финал.

## Что сделано

### J.1 App-builders / IDE / LangSmith
- `AppBuilderService` — clarify-вопросы, scaffold JSON (валидация путей,
  caps 12 файлов), запись через workspace, preview-манифест.
- `IdeService` — askCodebase (grep-доказательства + LLM с цитатами file:line),
  editPlan (JSON-план до 8 файлов), terminal (команды → computer-тикеты).
- `PromptHubService` — версионированные промпты в kv, строгий render
  (missing vars = ошибка).
- `QueuedRunKind += 'eval'` — бенчмарки через очередь (setEvals в phase33).

### J.2 Palantir / Glean / UiPath / Writer
- `OntologyService` — типы/линки/инстансы в kv, actions через ToolRunner с
  governance-oversight (не-allow → честный отказ с правилом).
- `AclService` — теги источников → роли, scoped-поиск с capability-фильтром
  (default-deny при тегах без governance).
- `WorkQueueService` — items + retries, robots claim/complete/fail,
  assets только-именами (секреты запрещены валидацией).
- `WriterService` — терминология must-use/banned, claim-check (факты требуют
  `[...]`), style-score 0..1.

### J.3 Computer-Use / Search-APIs / E2B
- `ComputerService` — пак screenshot/click_at/type_text/scroll/open_url,
  валидация координат, отказ на sensitive-ввод, исполнение только с
  approved-тикетом, иначе handoff-запись.
- `SearchService` — реестр провайдеров (keyRef-имена), fan-out + dedupe,
  local-knowledge fallback, события.
- `CodeExecService` — `SandboxKind += 'code'`, статическая валидация
  (баланс, banned-идентификаторы, лимиты), внешний delegate, без него —
  честный queued-handoff (код молча не «исполняется»).

### Wiring
- **Без смены Dexie** (kv + существующие таблицы) — v34 остаётся max.
- `phase37-rivals5` (10 сервисов), 7 событий, lazy-сервисы,
  scaffold/ask-codebase/save-prompt в табе `rivals` (+i18n en/ru).

## Отложено на финальную проверку
- typecheck/build/tests/lint по rivals5-срезу, e2e
  scaffold→ask→prompt→eval-queue→onto→acl→work→writer→computer→search→codeexec.

## Дальше — финальная проверка всего вместе, когда скажешь.
