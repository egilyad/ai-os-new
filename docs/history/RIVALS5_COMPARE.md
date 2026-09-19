# Сравнение 1-к-1, пятая десятка + что дописываем

Дата: 2026-09-05. Фаза J. Без проверок до финала. Всё на kv +
существующие таблицы (смены Dexie нет — v34 остаётся max).

## 1. Replit Agent / Lovable / v0 (app-builders)
- **У них:** spec → уточняющие вопросы → генерация файлов → preview → deploy.
- **Было у нас:** Builder генерирует манифесты, SWE правит файлы — связки
  spec→scaffold нет.
- **Дописываем (J.1):** `AppBuilderService` (clarify-вопросы через LLM,
  scaffold file-tree через LLM JSON, запись через workspace, preview-манифест).

## 2. Cursor / Windsurf / Copilot Workspace (AI IDE)
- **У них:** codebase Q&A, multi-file edit plans, terminal-выполнение.
- **Было у нас:** repoMap/grep есть, Q&A и терминальной очереди нет.
- **Дописываем (J.1):** `IdeService` (askCodebase: repoMap+grep→LLM-ответ с
  цитатами файлов; editPlan: список правок; terminal: команды → тикеты).

## 3. LangSmith
- **У них:** Prompt Hub (версионированные промпты), online eval-очереди,
  трейсинг датасетов.
- **Было у нас:** промпты разбросаны по коду, eval-очереди нет.
- **Дописываем (J.1):** `PromptHubService` (kv-версии + render с {{vars}}),
  `QueuedRunKind += 'eval'` (прогон бенчмарка через очередь).

## 4. Palantir AIP
- **У них:** онтология (типизированные объекты + связи), actions агентов над
  объектами, oversight человека.
- **Было у нас:** данные без типов, actions без объектной привязки.
- **Дописываем (J.2):** `OntologyService` (типы/связи/инстансы в kv, actions
  через ToolRunner с governance-check, oversight-флаг → HITL).

## 5. Glean
- **У них:** permissions-aware поиск (ACL на источниках), work-AI поверх apps.
- **Было у нас:** поиск без ACL-фильтрации.
- **Дописываем (J.2):** `AclService` (теги источников → роли, scoped-поиск
  по knowledge+workspace с checkCapability-фильтром).

## 6. UiPath
- **У них:** очереди work items, роботы (claim), assets (креды/конфиги).
- **Было у нас:** runQueue только для crew/graph, generic items и роботов нет.
- **Дописываем (J.2):** `WorkQueueService` (items payload+retries в kv,
  robots claim/complete, assets только-именами).

## 7. Writer (enterprise content)
- **У них:** terminology (бренд-словарь), claim detection (факты → источники),
  styleguide-проверки.
- **Было у нас:** guardrails синтаксические, стилевых нет.
- **Дописываем (J.2):** `WriterService` (термины must-use/banned, claim-check:
  предложения с фактами требуют цитат `[...]`, style-score).

## 8. Operator / Anthropic Computer Use
- **У них:** screenshot-grounded действия (click/type/scroll), observation loop.
- **Было у нас:** тикеты browser/computer без action-схемы.
- **Дописываем (J.3):** `ComputerService` (action-пак: screenshot/click_at/
  type_text/scroll/open_url, валидация координат, исполнение только с
  approved-тикетом — иначе handoff-запись).

## 9. Firecrawl / Exa / Tavily (search APIs)
- **У них:** managed search/extract с ключами, fallback между провайдерами.
- **Было у нас:** один http.fetch + knowledge.search, абстракции нет.
- **Дописываем (J.3):** `SearchService` (реестр провайдеров с keyRef-именами,
  fan-out + merge + dedupe, graceful-degrade).

## 10. E2B
- **У них:** облачные песочницы для кода (выполнение!).
- **Было у нас:** браузер не исполняет код; тикетов `code` нет.
- **Дописываем (J.3):** `SandboxKind += 'code'`, `CodeExecService`
  (статическая валидация: баланс скобок, banned-идентификаторы, лимиты;
  исполнение — внешний delegate, иначе queued-handoff).

## Карта реализации (Фаза J, phase37)
- События: `app:*`, `ide:*`, `prompt:*`, `onto:*`, `acl:*`, `work:*`,
  `writer:*`, `computer:*`, `search:*`, `codeexec:*` (~10).
- Сервисы: appbuilder/ide/prompthub (+eval-kind в queue), ontology/acl/
  workqueue/writer, computer/search/codeexec → phase37.
- UI: кнопки в табе `rivals` (scaffold, ask-codebase, prompt render).
