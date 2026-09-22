# SELF-IMPROVEMENT AUDIT — SuperAgents OS (форензика, 2026-09-22)

> Ветка `fix-debate-text-truncation` (коммит `1d09c4a` + серверный gateway M1–M9, CLI, 7 панелей).
> Метод: docs ↔ код ↔ связи. Названиям, README, roadmap, словам Beta/Ready/Complete — не верить.
> Каждое утверждение ниже сверено с кодом (файл:строка). **Код проекта не изменялся.**
> Статусы: `NOT_IMPLEMENTED` · `UI_ONLY` · `IMPLEMENTED_DISCONNECTED` · `CONNECTED_UNVERIFIED` · `E2E_VERIFIED`.
> Не запускалось в этой песочнице (честно): полный `tsc -b`, полный `vitest`, `docker compose` — процессы убиваются
> окружением; вместо runtime-прогона — статическая верификация цепочек вызовов (producer → consumer → persistence).

## 1. Executive Summary

Система — **набор сильных, но разъединённых механизмов**, а не замкнутая self-improving OS.
Автономная диагностика есть (SRE/Advisor, мониторинг, journal-сбор), исполнение есть
(очереди, раннеры, tools, внешний gateway), верификаторы есть (evals, benchmarks, snapshots) —
но **переходы между ними отсутствуют**: никто не превращает находку в задачу, задачу в исполнение,
исполнение в проверку, проверку в обучение. Единственный реально замкнутый контур в репозитории —
`agent-health-monitor`: unhealthy ×3 → `agentService.restartAgent`
(`src/kernel/services/agent-health-monitor.ts:174-189`). Второй контур — новый серверный
heartbeat-loop (wakeup → run → heartbeat → ack), но он операционный, а не самоулучшающий.
Оценка по шкале §25 — ниже; главный вывод §34 — в конце.

## 2. Current Reality

| Слой | Состояние |
|---|---|
| Наблюдение (events, метрики, journal, health) | Детекция работает автономно, агрегации/расследований нет |
| Диагностика (SRE/Advisor, diagnostic-service, truth-monitor) | Работает по таймерам/событиям, заканчивается логом/бейджем |
| Исследование (Research Engine, Gemini, гипотезы) | Ручной запуск человеком, выходы — сироты |
| Предложения (meta-agent, optimization-engine) | Шаблонные тексты, применение = смена статуса |
| Одобрение (5 approval-систем!) | Хранят решения, не будят исполнителей |
| Исполнение (очереди, раннеры, tools, gateway) | Исполняют то, что положил человек/тест |
| Верификация (evals, benchmarks, snapshots) | Замеряют по требованию, не гейтят изменения |
| Откат (config-history, time-machine) | Есть для конфигов/снапшотов, нет для кода/данных |
| Память | Богатая; поведение не меняет |

## 3. Documentation vs Code

Проверено 12 несущих клеймов (детали — таблица субагента C в worklog):

| # | Клейм | Вердикт |
|---|---|---|
| 1 | Research Engine сам находит темы | `PARTIALLY_IMPLEMENTED` — `startSession(title,question)` требует вопрос человека (`research-engine-service.ts:240`); `runDiscovery` — только по существующим сессиям (`:532`) |
| 2 | Hypothesis Generator генерирует гипотезы | `IMPLEMENTED_NOT_CONNECTED` — 3 сида (`hypothesis-service.ts:26-60`), `mockTitle` — конкатенация строк (`:165-179`), LLM нет |
| 3 | SRE = робот-ремонтник с автофиксом | `PARTIALLY_IMPLEMENTED` — `enableAutoFix:false` (`advisor-service.ts:55`), `executeFix` — только router/keys (`optimization-engine.ts:79-104`) |
| 4 | Agents Journal — источник feedback | `IMPLEMENTED_NOT_CONNECTED` — читатель только панель (`AgentJournalPanel.tsx:198`) |
| 5 | System Architecture Pulse — feedback-механизм | `DOCUMENTED_NOT_IMPLEMENTED` — grep `*Pulse*` пуст, только `<h3>`-лейблы |
| 6 | Cognitive Event Stream с агрегацией/аномалиями | `PARTIALLY_IMPLEMENTED` — 2 события есть, агрегатора нет; дебаты в CES ничего не пишут |
| 7 | MetaAgent self-improvement + evolution | `CONTRADICTED_BY_CODE` — `apply()` = смена статуса (`meta-agent-service.ts:86-90`), мутаций нет |
| 8 | Замкнутый контур OBSERVE→…→OBSERVE | `DOCUMENTED_NOT_IMPLEMENTED` — острова есть, переходов нет |
| 9 | AutonomyOrchestrator+Runner = автономное исполнение | `PARTIALLY_IMPLEMENTED` — ручной state machine, файловый парсинг по regex (`autonomy-runner.ts:150-188`), триггера нет |
| 10 | OpenCode/Codex-интеграция = делегирование кода | `PARTIALLY_IMPLEMENTED` — `codex-services.ts:15-21` возвращает `applied:true` при записи только в KV |
| 11 | AGEMS autonomy levels 1–5 управляют агентами | `DOCUMENTED_NOT_IMPLEMENTED` — в том же файле чекбоксы `- [ ]` открыты |
| 12 | error→memory→changed behavior | `IMPLEMENTED_NOT_CONNECTED` — память богата (14 stores), поведение не меняется; `allowAgentInitiatedInvocation:false` |

Противоречия: счёт панелей (638 vs 285 vs 227 vs 205 — четыре документа); серия `RIVALS_* PHASE_*.md` с титулом `DONE` и телом без проверок;
`ПОЛНЫЙ_РЕЕСТР.md:50` (SRE ✅) vs `advisor-service.ts:55` (off);
`codex-services.ts:20` (`applied:true`) vs `:18` (только KV);
автономности L4–L6 в roadmap vs прямой запрет self-invoke
(`29_AGENT_INVOCATION_MATRIX:62`, `INVOCATION_ENGINE.md:73`).

## 4. Existing Self-Observation Systems

| Механизм | Что наблюдает | Источник | Запуск | Куда пишет | Кто читает | Работает? |
|---|---|---|---|---|---|---|
| EventBus + EventRecorder | ~300 событий | `subscribeAll` | всегда | Dexie `eventLog` (1000) | панели, journal, memory | `CONNECTED_UNVERIFIED` |
| Cognitive events | шаги оркестрации | orchestration/trace services | каждый ран | Dexie `cognitiveTraces` | advisor, metrics, memory, journal | `CONNECTED_UNVERIFIED` (в event-sourcing лог НЕ входит — `event-recorder.ts:230`) |
| monitoring/metrics | health, latency, thresholds | интервалы + события | авто | emit `SYSTEM_HEALTH_CHANGED`, `METRICS_ALERT` | Dashboard, webhook | детекция `E2E_VERIFIED`, расследование `NOT_IMPLEMENTED` |
| agent-health-monitor | heartbeat агентов | 60s poll | авто | emit + **restart ×3** | topology-manager | `E2E_VERIFIED` — единственный замкнутый контур |
| diagnostic-service | системная диагностика | 30s interval | авто | emit `DIAGNOSTIC_COMPLETE` | только панель (poll) | `IMPLEMENTED_DISCONNECTED` |
| truth-consistency-monitor | дрейф | 5min auto | авто | лог | никто | `IMPLEMENTED_DISCONNECTED` |
| agent-journal | шаги/ошибки агентов | события (авто) + руки | авто-сбор | KV `agent_journal_v1` | только панель | `IMPLEMENTED_DISCONNECTED` |
| ErrorBoundary/unhandledrejection | UI/рантайм ошибки | перехват | авто | emit/лог | подписчиков нет | `IMPLEMENTED_DISCONNECTED` |
| Server gateway activity | компании/runs/approvals | мутации API | всегда | `data/activity.json` | панель Activity (нет!) / API | `CONNECTED_UNVERIFIED` |

Ответ на вопрос §5: **да, система узнаёт о проблемах без человека** (алерты, SRE-предложения, journal),
но **не начинает расследование и не адаптируется** — всё заканчивается логом/бейджем.

## 5. Existing Self-Diagnosis Systems

- **A. Технические:** tsc/test/рантайм — детекторов внутри продукта нет (нет tsc-вотчера, нет
  `window.onerror → eventBus`); `consistency-checker` сверяет только строки доков с манифестом.
- **B. Архитектурные:** `architecture-review-service` (`:99-318`) — чистый статический скан, сирота;
  `dependency-cruiser`/`madge` — только CI; мёртвый код/дубликаты никто не ищет в рантайме.
- **C. Продуктовые:** цепочек «UI есть — backend missing» детектора нет; такие разрывы найдены вручную
  в этом аудите (нет).
- **D. Агентные:** классификация ошибок LLM есть (`debate-llm-error-handler.ts:51-324`: fallback,
  backoff, DLQ, `recordUsage(failed)`), но повышение до памяти/политики — нет.
- **E. Системные:** главный класс проблем — генераторы без потребителей (§14).

## 6. Existing Research Systems

Research Engine (`research-engine-service.ts:64`, контракт `:410`, регистрация `phase9`): сессии,
Discovery, PeerReview, FactCheck, цитаты, KnowledgeGraph — **движок ручной**: вопрос задаёт человек
(`ResearchEnginePanel.tsx:39,51`), consumer отчётов — никто (`ResearchExportPanel` экспортирует
runs+hypotheses, не reports; sessions в памяти engine — `Map`). `CONNECTED_UNVERIFIED`.
Gemini Research (`gemini-research-service.ts:165`): поиск/аномалии/ревью поверх сессий движка, но
результат **не пишется обратно** в сессию и не персистится — сирота, плюс key-gated.
Debate System Research (`DebateSystemResearch.tsx:95`): хаб-навигация, своей логики нет — `UI_ONLY`.
Project OS Explorer: файловый браузер (`workspaceService.listTree`), автоанализа нет.
Ответ на вопрос §6: **нет, тему задаёт только человек**; `runDiscovery` — по уже существующим сессиям.

## 7. Existing Hypothesis Systems

`hypothesis-service.ts:70`: CRUD + 3 сида + `mockTitle` (конкатенация) + `linkDebate` (срабатывает,
только если человек вручную договорил дебаты — `DebatePanel.tsx:312`) + персист `research_hypotheses`.
`propose()` — поля человека. Связка «гипотеза → дебаты» — `navigate()` (`HypothesisGenerator.tsx:110-115`),
программного `startDebate({thesis})` нет. `CONNECTED_UNVERIFIED`, генерация — mocked.

## 8. Existing Proposal Systems

- `meta-agent-service.ts:49-117`: `analyze` (keyword-шаблоны) → `propose` → `apply` (статус) →
  `evolveSkill` (строка-драфт). Мутаций кода/параметров/скиллов нет. `UI_ONLY` для self-improvement.
- `optimization-engine.ts:56-117`: `propose` (дедуп, кап 20) реален, но узок (router/keys); `executeFix` —
  только по клику (`SREAgentPanel.tsx:108`, `MissionControl.tsx:66` — сверено: других вызывателей нет).
- Server gateway: `decideApproval(approved)` реально исполняет (найм/pause/terminate/reassign,
  `company-store.mjs:730-757`) — **единственный proposal→execution путь с персистом**, но инлайн,
  без очереди/рантайма, `ceo_strategy` — только лог.

## 9. Human Approval Mechanisms

Пять disjoint-хранилищ: `ApprovalService` (in-memory Map — сирота, вызыватель только тест),
`agems-approval-service` (Dexie, bulk/auto обвязка), graph/crew HITL-паузы, mobile inbox,
серверный `approvals.json` (pending → decided + комментарии + `executedAgentId`).
Контур «proposal → человек → execution» **реален только на сервере** (запрос найма → approve →
агент появляется — проверено smoke m61 16/16), и только для найма/override.
Ядерный контур: `APPROVED → ExecutionQueue/ToolRunner/AutonomyRunner` — **вызывателя нет**
(`NOT_IMPLEMENTED`); `task-trigger fire` — подписчика на approval нет.

## 10. Autonomous Execution

Убрать человека: `detect → research → propose → execute → verify` — **сегодня невозможно**,
точная отсутствующая связь: нет моста `APPROVED/proposal → executable` (ядро) и нет
авто-триггера исследований. Что есть по частям: `ExecutionQueue` (приоритеты, DLQ, без ретрая),
`ToolRunnerService.runWithTools` (агент выбирает tools, шаги chained — `CONNECTED_UNVERIFIED`),
`AutonomyRunner.runGoal` (достижим только из тестов/кнопок), планировщик (эмитит в пустоту —
у `SCHEDULE_TRIGGERED` нет подписчика), серверный loop (исполняет wakeups, но не код).

## 11. Coding-Agent Integration

- **Internal:** `autonomy-runner.ts:80-86` реально пишет файлы (`parseAndWriteFiles`), но хрупкий regex,
  без git/test-гейта; kernel Codex/GeminiCli/Kilo — KV-заглушки с `applied:true`-ложью.
- **External (через новый gateway):** `server/adapters.mjs` (echo/http/process-gated) +
  `POST /runs/:id/execute` — система **может** нанять внешний рантайм как исполнителя
  (`CONNECTED_UNVERIFIED`, smoke m21 12/12). Нет адаптеров `claude_local/codex_local/opencode`
  (только 3 generic). `cli/superagents.mjs run` — только enqueue+watch, не код.
- Вывод §11: архитектура **позволяет** использовать внешний coding agent исполнителем
  (run-трейс + approval уже есть), не хватает Paperclip-пака адаптеров и связки
  `approval → run → adapter.execute`.

## 12. Multi-Agent / Multi-Model Infrastructure

Ключи/роутинг — сильная сторона: `KeyService` (vault/quotas/rotation/health),
11 декораторов, `RouterService` (ranking/fallback/downgrade/UCB1 `explorationBonus`,
`router-decision-recorder`), выбор пишется в трейс/eval-runs/cost-ledger.
Но: дефолтный путь — **одна** ранкнутая модель; fanout/сравнение — только в лабах
(`kilo fanout ≤5`, `eval-service.compare()`, A/B-движки, Shadow-панели) — в loop не используется.
Ответ §19: ключи — **набор подключений с умным выбором**, а не вычислительная стратегия:
мультимодельного консенсуса в рабочих путях нет.

## 13. Tools

`ToolService` (AST-guard) + `ToolRunnerService.runWithTools` (агент выбирает tool, результат —
следующий шаг; 30+ потребителей) + `ToolGovernance.check` (policy, не execution) + MCP-мост
(`mcp.call`, опционален) + A2A/ACP (шейпы/переводы, без пути в очередь/ран). Карта §20:
tool → вызывает агент/топология → результат chained (в runWithTools) → персиста нет (in-memory Map).
Для self-mod задач есть workspace-инструменты (`list/read/search`), `http.fetch`, `mcp`, `debate`;
filesystem/git/test-инструментов как первоклассных — нет (git в `src` отсутствует вовсе).

## 14. Events

Шина богата (~300 событий в `event-registry.ts:30`), шина lossy/async с dead-letter sink,
рекордер с WAL (1000 событий, noisy/cognitive исключены), мост в проекции.
Издателей десятки, подписчики — панели/сервисы-память. **Нет**: агрегации, anomaly detection
как цикла, подписчика-расследователя (research/SRE *могли бы* подписаться — не подписаны),
потребителя `METRICS_ALERT/SYSTEM_HEALTH_CHANGED/ERROR_BOUNDARY_CAUGHT` кроме UI.

## 15. Journals / Memory

Journal: автосбор + KV + кап — `CONNECTED_UNVERIFIED` как лог, `ORPHAN` как feedback.
Memory: engine (подписка на шаги, BM25+vector+RRF, worker), crystals, junctions, debate-local —
recall работает, но **router/llm-caller recall не спрашивают**. Eval-раны персистятся, но в память
не возвращаются. Sleep/prune/weight-optimizer (`±0.02/0.05`, кап `±0.3` по `ROUTER_SIGNAL`) —
единственное обучение, узко про роутинг.

## 16. Verification

Верификаторов много, гейтов нет: frontier evals (contains/exact/token_f1, A/B `compare`,
heuristic red-team), eval-datasets (Jaccard ≥0.7), llm-judge (stub), debate-metrics/quality,
snapshots-compare, elo-compare. Ни один не вызывается сменой автоматически; `change → verify →
gate/rollback` вызывателя не найдено.

## 17. Rollback

Конфиги — да (`config-history rollback`, history 50, тест есть); снапшоты — да
(`snapshot-service.restoreById`, `time-machine` по scope full/config/memory/keys; debates — только лог);
транзакции — discard deferred. **Нет**: отката файлов workspace (`getHistory` без `undo`),
отката данных Dexie (миграции схемы ≠ откат), git-отката (git-модулей нет),
`deploy rollbackTarget` — simulated. Для self-mod цикла: откатить конфиг — можно, код — нет.

## 18. Learning

Классификация §22: **Memory** — `CONNECTED_UNVERIFIED` (помнит, recall есть);
**Learning** — `IMPLEMENTED_DISCONNECTED` (меняет только веса роутера ±, слип/прунинг);
**Self-improvement** — `UI_ONLY` (meta-статусы); **Self-modification** — `NOT_IMPLEMENTED`
(внутренний), `PARTIAL` (внешний: gateway run+adapter может выполнить, но адаптеров кода нет).
Цепочки `error → memory → changed behavior` и `failed experiment → future decision` — отсутствуют.

## 19. Self-Modification

Внутренняя (п.1–11 §11): читать код — да (Explorer, grep-инструменты), обнаружить — частично (SRE),
сформулировать — шаблоны, создать/применить patch — **нет**, проверки — есть но не связаны,
ухудшение/откат/повтор/принятие/история — нет. Внешняя: сформировать задачу внешнему агенту —
да (run + http/process-адаптер), верифицировать — вручную, остальное — нет.

## 20. End-to-End Scenarios (фактические цепочки)

1. **TS-ошибка:** ничего. Вотчера/моста нет. (`NOT_IMPLEMENTED`)
2. **LLM error:** классификация → same-provider fallback → alt key → backoff → DLQ + `recordUsage(failed)` + journal. Дальше ничего. (containment `CONNECTED_UNVERIFIED`, learning — нет)
3. **Плохой debate:** `SESSION_FAILED/COMPLETED` → cleanup/sync/UI. Оценки — по требованию. Порога «плохо» и адаптации нет.
4. **Research находит проблему:** отчёт в память UI. Дальше ничего (consumer нет).
5. **Hypothesis создана:** лежит в KV, ждёт ручного `navigate → debate`. Дальше ничего.
6. **SRE нашёл проблему:** предложение в панель (+бейдж). Дальше — только клик человека.
7. **Journal фиксирует повторы:** ничего (читателей решений нет).
8. **Pulse фиксирует деградацию:** Pulse не существует; фрагменты пишут в свои панели.
9. **Человек одобрил:** ядро — ничего (нет моста в исполнение); сервер — найм/override исполняется инлайн.
10. **Агент решил менять код:** внутренне — нечем (нет patch- apply); внешне — возможно через run+adapter, если оператор настроил.

## 21. Real Architecture Graph

```text
                    ┌──────────────────┐
                    │   OBSERVATION    │  [VERIFIED] (events/metrics/journal/health)
                    └────────┬─────────┘
                             ↓
                 ┌─────────────────────┐
                 │     DIAGNOSTICS     │  [VERIFIED] (SRE propose/diagnostic/truth)
                 └────────┬────────────┘
                          ↓
                   ┌──────────────┐
                   │   RESEARCH   │  [ORPHAN-IN] (ручной старт; авто-подписки нет) [MISSING]
                   └──────┬───────┘
                          ↓
                  ┌──────────────┐
                  │  HYPOTHESIS  │  [ORPHAN] (mocked, consumer — только счётчики)
                  └──────┬───────┘
                         ↓
                  ┌────────────┐
                  │  PROPOSAL  │  [PARTIAL] (шаблоны; серверный hire — [VERIFIED])
                  └─────┬──────┘
                        ↓
                  ┌───────────┐
                  │ APPROVAL  │  [VERIFIED] хранение; →execution [MISSING] (ядро)
                  └─────┬─────┘
                        ↓
                 ┌────────────┐
                 │ EXECUTION  │  [VERIFIED] очереди/раннеры/tools/gateway; триггер — человек/тест
                 └─────┬──────┘
                       ↓
                 ┌───────────┐
                 │  VERIFY   │  [ORPHAN] (есть чем, не вызывается) [MISSING]
                 └─────┬─────┘
                       ↓
                 ┌───────────┐
                 │  PERSIST  │  [VERIFIED] (Dexie/KV/files/activity-ledger)
                 └─────┬─────┘
                       │  обучение/откат кода [MISSING]
                       └────→ OBSERVATION (только запись, не адаптация)
```

## 22. Orphan Systems

1. `AgentJournalService.record` → читателей решений нет.
2. `ResearchReportService.getReports` + engine `researchReports` (in-memory) → никто.
3. Gemini-аугментации → только табы, назад в сессию не пишутся.
4. `guardrail:hit/*` → 0 подписчиков; `check()` не зовут chat/debate/research.
5. `DIAGNOSTIC_COMPLETE` + `TruthMonitor.repair` → лог; гипотез/ранов не создают.
6. `META_PROPOSED/APPLIED` → только `metaStore` refresh.
7. `approval-auto-service.evaluateAll` → вызывателей ноль (даже таймера).
8. `SCHEDULE_TRIGGERED`/`dueCron`/`cronSchedule` → эмит/поля без подписчиков.
9. `DLQ.retry` → счётчик без re-emit; `finishRun(error)` → терминал.
10. Server `approval_decided` broadcast → consumer нет; `company_exported` → никто.

## 23. Broken Junctions

- `HypothesisGenerator.startDebate` = `navigate()` вместо `startDebate()` (`HypothesisGenerator.tsx:110-115`).
- `ProjectDebateIntegration` строит локальный объект вместо вердикта движка (`project-debate-integration.ts:25-38`).
- `Codex.prompt` возвращает `applied:true` без записи (`codex-services.ts:15-21`).
- `MetaAgent.apply/evolve` — смена статуса/строка вместо мутации (`meta-agent-service.ts:86-100`).
- `ToolService.executeToolNode` обходит `approval-service.checkCapability` (проверка-сирота).
- Debate не пишет в CES (`debate/00_DEBATE_MASTER_MAP.md:15`).

## 24. Missing Junctions

```text
AgentsJournal → AdvisorService/ResearchEngine            [MISSING] (ingestJournal нет)
METRICS_ALERT/HEALTH_CHANGED → Diagnostic.run → Meta    [MISSING] (подписчика-расследователя нет)
Diagnostic/Truth/Scheduler → Hypothesis.propose         [MISSING] (авто-предложения нет)
Hypothesis → DebateEngine.startDebate                   [MISSING] (только navigate)
ResearchReport → TaskQueue                              [MISSING] (читателя нет)
Proposal → Approval → TaskQueue/CodingAgent (ядро)      [MISSING] (моста нет)
server decideApproval → enqueueWakeup/adapter.execute    [MISSING] (только инлайн)
approvalAuto.evaluateAll → scheduler/cron               [MISSING] (вызывателя нет)
Scheduler/cronSchedule/dueCron → AutonomyRunner/Queue   [MISSING] (ридер/мост нет)
DLQ/finishRun(error) → re-enqueue                       [MISSING] (replay нет)
Verification → Memory/Learning                          [MISSING] (писателя нет)
Change → auto benchmark/compare/redTeam → gate/rollback [MISSING] (оркестратора нет)
```

## 25. Already Existing Building Blocks

Детекция: SRE/Advisor, monitoring/metrics, agent-health-monitor, diagnostic-service, journal-сбор,
event-sourcing лог. Исследование: Research Engine + 9 табов, Gemini-аугментации, дебаты (способны
дебатировать любую thesis), Explorer. Решения: meta-agent, optimization-engine, eval-compare.
Разрешения: 5 approval-хранилищ (ядро ×4 + сервер). Исполнение: ExecutionQueue+DLQ, ToolRunner
(агент выбирает tools), AutonomyRunner (пишет файлы), планировщик, **серверный gateway
(wakeups→runs→heartbeat + adapters echo/http/process + CLI)**. Проверка: evals/benchmarks/red-team/
debate-metrics/snapshots/compare. Откат: config-history, time-machine, snapshots, transaction discard.
Память: engine (BM25+vector+RRF+worker), crystals, journal-KV, eval-runs. UI: 260+ панелей,
включая 7 новых gateway-панелей.

## 26. Minimum Closure (первый настоящий цикл)

Существующими компонентами, без новых систем:

1. `agent-journal-service` / `metrics METRICS_ALERT` → новый подписчик
   `investigation-bridge` (~80 строк): `on(METRICS_ALERT|AGENT_JOURNAL_ERROR)` →
   `diagnosticService.runDiagnostic()` → при finding → `hypothesisService.propose()` +
   `researchRunService.startRun()`.
2. `HypothesisCard/startDebate` → заменить `navigate()` на `debateService.startDebate({thesis})` +
   `await linkDebate()` (~30 строк).
3. `APPROVED` → `ExecutionQueue.enqueue` / `AutonomyRunner.runGoal` мост (~40 строк) +
   `approvalAuto.evaluateAll` на `setInterval`/cron (~10 строк).
4. `change → evalService.compare()/runBenchmark()` гейт + `time-machine.restoreSnapshot()` при
   регрессии (~120 строк).
5. Сервер: `decideApproval(approved)` → `enqueueWakeup` + `adapter.execute` для `ceo_strategy`
   (~50 строк) — превращает его approval в Paperclip-компанию.

Итого ≈ 330 строк склейки — и контур detect→research→proposal→approval→execute→verify→persist
замыкается впервые.

## 27. Level 0 → Level 6 analysis

- **L0 MANUAL:** здесь живёт 90% системы. Человек находит, формулирует, запускает, проверяет.
- **L1 ASSISTED:** `E2E_VERIFIED` частично — SRE находит, дебаты помогают, роутер подбирает модель.
- **L2 RESEARCH AUTONOMY:** `PARTIAL` — движок умеет всё, кроме самозапуска; не хватает п.26-1
  (подписчик детектор→исследование).
- **L3 APPROVAL LOOP:** ядро — `NOT_IMPLEMENTED` (нет моста approval→execution); **серверный
  gateway — `CONNECTED_UNVERIFIED`, ближе всех** (не хватает п.26-5 + внешнего coding-адаптера).
- **L4 SUPERVISED AUTONOMY:** `CONCEPTUAL` — нужны п.26-1…4 + policy/boundaries (guardrails есть,
  но не на этом пути) +callTool↔approval связка.
- **L5 AUTONOMOUS:** `NOT_IMPLEMENTED` — упирается в verification+rollback кода (их нет) и запрет
  self-invoke по дизайну (нужно осознанно снимать).
- **L6 EVOLUTIONARY:** `NOT_IMPLEMENTED` — нет создания новых классов проблем/гипотез/механизмов;
  потолок — L4 при текущей архитектуре.

## 28. Risks

Автофиксы без scope-ограничений (SRE `executeFix` трогает router/keys продакшена);
`process`-адаптер = RCE по дизайну (сейчас за флагом — правильно);
авто-дебаты/исследования жгут ключи/деньги (cost-гейтов на них нет);
эвристики-детекторы (latency>4000, cost>10) как триггеры действий — ложные срабатывания;
запрет self-invoke снимать только с policy/budget/rollback.

## 29. Security / Safety Boundaries

Что обязано остаться: approval перед исполнением кода/команд (M6-гейт как образец);
`ADAPTERS_ALLOW_PROCESS`-стиль флаги на всё опасное; бюджеты в центах с hard-stop
(есть на сервере — распространить на исследования/дебаты); redact секретов (есть в M8);
audit-лента каждого автошага (есть activity-ledger — писать туда же); kill-switch автоцикла
(флаг + лимит итераций + rollback по дефолту при регрессе).

## 30. What Can Be Activated Without New Architecture

`enableAutoFix` для 2 узких действий (уже за флагом); journal→advisor чтение (только вызовы);
`evaluateAll` на таймер; `navigate→startDebate` замена; серверный `decide→wakeup` мост;
`METRICS_ALERT→runDiagnostic` подписчик; eval-compare как ручной гейт релиза;
`--watch`-стиль наблюдаемость уже есть (CLI run, SSE).

## 31. What Requires Actual Development

Patch-generate/apply/rollback кода; coding-адаптеры (claude/codex/opencode); tsc/test-вотчеры;
агрегатор событий + anomaly→investigation; approval→queue мост ядра; DLQ-replay;
verification→memory писатель; policy-движок для L4+; снятие запрета self-invoke с гардами.

## 32. Final Findings (таблица §25)

| Capability | Status |
|---|---|
| Self Observation | CONNECTED (детекция авто, агрегации нет) |
| Self Diagnosis | CONNECTED (диагноз авто, действий нет) |
| Self Research | PARTIAL (движок ручной) |
| Hypothesis Generation | PARTIAL (CRUD есть, генерация mocked) |
| Proposal Generation | PARTIAL (шаблоны + серверный hire) |
| Human Approval Loop | CONNECTED (сервер E2E; ядро — хранение без моста) |
| Autonomous Execution | PARTIAL (исполнители есть, триггеры ручные) |
| Verification | IMPLEMENTED (замерщики без гейтов) |
| Rollback | PARTIAL (конфиги/снапшоты; кода нет) |
| Memory | CONNECTED |
| Learning | PARTIAL (только веса роутера) |
| Self Modification | NOT_IMPLEMENTED (внутр.); PARTIAL (наружу через gateway) |
| External Coding-Agent Delegation | PARTIAL (механизм есть, адаптеров кода нет) |
| Multi-Agent Review | CONNECTED (дебаты по требованию) |
| Multi-Model Routing | CONNECTED (выбор; без консенсуса) |
| Feedback Loop | NOT_IMPLEMENTED |
| Closed Loop | NOT_IMPLEMENTED |

## 33. Evidence / File References

Ключевые (полный список — в секциях выше):
`advisor-service.ts:55,121-135,167-286`, `optimization-engine.ts:56-117`,
`SREAgentPanel.tsx:42,108,168-220`, `MissionControl.tsx:21-66`,
`research-engine-service.ts:107-177,240-271,532-630`, `hypothesis-service.ts:24-179`,
`HypothesisGenerator.tsx:61-115`, `agent-journal-service.ts:84-246`, `AgentJournalPanel.tsx:198`,
`event-recorder.ts:41-73,154-260`, `metrics-service.ts:172-273`, `monitoring-service.ts:68-238`,
`agent-health-monitor.ts:53-189`, `diagnostic-service.ts:46-190`, `approval-service.ts:30-107`,
`agems-approval-service.ts:28-75`, `approval-auto-service.ts:26-71`, `execution-queue.ts:48-133`,
`dead-letter-queue-service.ts:7-75`, `autonomy-orchestrator.ts:43-227`, `autonomy-runner.ts:27-207`,
`tool-runner-service.ts:122-356`, `scheduler-service.ts:141-309`, `eval-service.ts:34-209`,
`config-history.ts:31-125`, `time-machine-service.ts:85-256`, `memory-engine.ts:174-201,616-678`,
`meta-agent-service.ts:49-117`, `codex-services.ts:15-55`, `server/company-store.mjs`,
`server/heartbeat-loop.mjs`, `server/adapters.mjs`, `server/sync-server.mjs`, `cli/superagents.mjs`.
Личная сверка автора: `executeFix` — только 2 UI-вызывателя; journal — 0 потребителей решений;
`enableAutoFix:false`; корневого `SELF_IMPROVEMENT_AUDIT.md` не существовало до этого отчёта.

## 34. Ответы на главные вопросы

1. **Насколько близко, если только соединить существующее?** Ближе, чем кажется: детекция,
   исследование, разрешения, исполнение, проверка, откат конфигов — всё уже лежит в коде.
   До первого замкнутого human-approved цикла не хватает ≈330 строк склейки (§26).
   До supervised — ещё policy/верификационные гейты. Потолок без новой разработки — L4.
2. **Что мешает уже сейчас?** 12 отсутствующих переходов (§24): ни одна находка не превращается
   в задачу сама; ни одно одобрение ядра не будит исполнителя; ни одна проверка не гейтит
   изменение; ни одна ошибка не меняет будущее поведение.
3. **Минимальный набор junctions:** investigation-bridge (детектор→гипотеза+ран),
   programmatic startDebate, approval→queue мост + таймер авто-правил, verify-gate + rollback,
   серверный decide→wakeup/adapter мост.
4. **Что ведёт дальше к supervised/autonomous:** eval-compare/red-team как гейты, time-machine
   как страховка, cost-ledger как бюджет автономии, guardrails на пути исполнения,
   серверный gateway как песочница внешнего исполнения — и только потом снятие запрета
   self-invoke.

*Форензика завершена. Код не изменён. Единственный созданный файл — этот отчёт.*
