# SuperAgents OS vs Paperclip: что дописать, чтобы догнать

**Сравнение по коду обоих репозиториев · 2026-09-18 · ветка ai-os `fix-debate-text-truncation` (d632cf7), paperclip-ai `agencyenterprise/paperclip-ai` (master, клонирован сегодня)**

> Продолжение серии: «Аудит 5,8/10» (DOCX) → «Roadmap 10/10» (DOCX) → «Gap vs топ-100» (.md). Здесь — точечный вопрос: **Paperclip. Что дописать.**

---

## 1. TL;DR

**Paperclip** — главный вирусный проект 2026 года в мультиагентном пространстве: «open-source orchestration for zero-human companies» (Node.js-сервер + React-дашборд, ~50k★ за 34 дня). Его метафора: *«Если OpenClaw — сотрудник, то Paperclip — компания»*: оргструктура, бюджеты, governance, goal-alignment, heartbeat-пробуждение агентов, «найми любого агента, который умеет получать heartbeat».

**Формула догона в одну строку:** Paperclip = *организационная оболочка + постоянный сервер + адаптеры внешних агентов*. SuperAgents OS = *мозги (дебаты, память, 257 панелей) без сервера и без «кадрового отдела»*. Догнать = **дописать 9 модулей (M1–M9), из которых половина — упаковка уже существующих скелетов** (`OrgCharter`, `IOpenClawService`, AGEMS, autonomy-orchestrator). Ядро SuperAgents при этом остаётся сильнее paperclip'овского — его надо не переписывать, а «нанять» Paperclip-моделью управления.

**Ключевая асимметрия (важнее списка фич):** у Paperclip *нет собственных агентов* — он арендует чужие мозги (Claude Code, Codex, Cursor, OpenClaw) через heartbeat-адаптеры. У SuperAgents OS мозги свои, но они умирают при закрытии вкладки и не умеют «получать зарплату по прописанному контракту». Догоняя Paperclip, вы получаете возможность обратного хода: **SuperAgents как один из адаптеров Paperclip** — и это отдельная стратегическая линия (раздел 5).

| Параметр | Paperclip | SuperAgents OS |
|---|---|---|
| Рантайм | Node-сервер 24/7 + Postgres (Drizzle, **69 таблиц**) | Браузер + IndexedDB (Dexie v43), умирает с вкладкой |
| Объём кода | ≈78,6k строк TS (server+ui+cli+packages) | ≈в разы больше, но только UI/kernel-часть |
| Метафора | Компания (org chart, CEO, совет директоров) | ОС (kernel, 27 разделов, 257 панелей) |
| Агенты | Чужие рантаймы по heartbeat (BYO) | Свои, in-browser (роли/пресеты/дебаты) |
| Работа | Issues: иерархия, atomic checkout, lifecycle | AGEMS-задачи (без checkout-атомарности) |
| Governance | Board approvals (найм, стратегия), audit trail | approval-сервисы ×6, разрознены |
| Бюджеты | cost_events ledger, лимиты в центах | budget/cost сервисы (без ledger) |
| Дистрибуция | CLI, docker quickstart, Railway 1-click, docs-сайт, Discord, Clipmart | docker-compose только для sync-сервера |
| Уникальное | Метафора компании, virality, «Memento Man» | Дебаты 13 стратегий, память-mesh, UCB1-роутинг, event-sourcing, локальность |

---

## 2. Что такое Paperclip по коду (факт-база)

Монорепозиторий pnpm: `packages/{db,adapters/*,shared,adapter-utils}` + `server` + `ui` + `cli`.

- **Домен (69 таблиц Drizzle/Postgres):** `companies` (цель, бюджет, org-структура), `agents` (adapterType+config, роль, **кому подчиняется**, бюджет в центах, статус), `issues` (parent-иерархия к цели компании, assignee, lifecycle `backlog→todo→in_progress→in_review→done|cancelled`, **atomic checkout** — 409 при попытке двух агентов взять одну задачу), `goals`/`projects`/`project_goals`, `heartbeat_runs` + `heartbeat_run_events` + `agent_wakeup_requests`, `approvals` + `approval_comments` + `issue_approvals`, `cost_events`, `company_secrets(+versions)`, `activity_log`, `agent_config_revisions`, auth-таблицы (`authUsers/Sessions/Accounts`, `invites`, `join_requests`, `instance_user_roles`), `labels`, `assets`.
- **Heartbeat-протокол** (`docs/start/core-concepts.md` + `server/src/services/heartbeat.ts`): агенты не живут постоянно — они просыпаются в коротких окнах по 5 триггерам: **расписание, назначение задачи, @-упоминание, ручной «Invoke», решение по approval**. За heartbeat агент проверяет идентичность, смотрит назначения, берёт работу (checkout), делает, отчитывается.
- **Адаптеры (BYO-агенты)** — 6 встроенных: `claude_local` (Claude Code CLI), `codex_local`, `opencode_local`, `openclaw` (webhook), `process` (shell), `http` (вебхук). Пакет адаптера = 3 модуля для 3 реестров: `server/execute.ts` (запуск+парсинг usage/cost), `ui/` (формы конфига, транскрипты stdout), `cli/format-event.ts` (live-вывод `run --watch`).
- **Governance:** найм агентов и стратегия CEO требуют одобрения совета (человека); board claim, пауза/увольнение любого агента, реассайн задач; каждая мутация — в `activity_log`.
- **Портативность компаний** (`company-portability.ts`): export/import манифеста (агенты, конфиги) со стратегиями коллизий (`rename`) и автоматической **редакцией секретов** по regex — фундамент «Clipmart» (маркетплейс готовых компаний, «COMING SOON»).
- **Дистрибуция:** CLI (`onboard`, `configure`, `run --watch`, `heartbeat-run`, `doctor`, `db-backup`, `auth-bootstrap-ceo`), `docker-compose.quickstart.yml`, Railway 1-click (`railway.toml` с healthcheck), docs на Mintlify (paperclip.ing), гайды `agent-developer`/`board-operator`, smoke-скрипты.
- **Skills-библиотека:** 16 папочных скиллов (compliance-operator, esg-operator, fda-submission, medical-billing-audit, underwriting, tprm, para-memory-files…) раздаются агентам через `addDirs: [skills/]`.
- **Meta-Engine** (META-ENGINE-OVERVIEW.md): идеология «alignment-positive selection» + **uncertainty-gated execution** — агент не может «двигаться дальше» без цитаты и confidence ≥0.75 (0.40–0.75 → verify, <0.40 → escalate).
- **UI:** 26+ страниц (Dashboard, **OrgChart**, Issues, Approvals, **Costs**, Goals, Inbox, CompanyShowcase, MetaEngine), mobile-friendly, SSE live-events.
- Тесты: 46 файлов vitest. Community: Discord, видео-демо в README.

---
## 3. Честное сравнение: что УЖЕ есть в SuperAgents OS на уровне скелета

Прежде чем писать новое, зафиксируем: **часть Paperclip-концепций в ai-os уже существует как контракты/сервисы**, просто они браузерные и не собраны в «компанию». Это меняет оценку трудозатрат.

| Концепция Paperclip | Эквивалент в ai-os (факт по коду d632cf7) | Статус |
|---|---|---|
| Org chart, CEO, подчинение | `OrgCharter` (dexie-таблица `orgs`) + `IFrontierOpsService.charterOrg/heartbeat/dissolveOrg` (contracts/frontier.ts, Wave 13) | 🟡 скелет: плоский устав, **нет дерева подчинения** (manager chain), ролей C-уровня, эскалаций |
| Heartbeat | `IFrontierOpsService.heartbeat(orgId)`; `IOpenClawService.importHeartbeat/dueCron`; cron-builder-service; autonomy-runner | 🟡 контракт+cron есть, **нет исполняемого цикла** heartbeat_runs/wakeup_requests с 5 триггерами |
| Issues + atomic checkout | `AgemsTaskService` (assignee, projectId, cronSchedule, статусы), autonomy-orchestrator (goal→plan→decompose→assign→execute→test→revise) | 🟡 задачи есть, **нет parent-иерархии к цели компании, нет атомарного checkout (409), нет inbox/read-states** |
| BYO-адаптеры агентов | 16 адаптеров в `src/llm/` — но это адаптеры **моделей**, не агентных рантаймов; `IOpenClawService` импортирует SOUL/AGENTS-маркдаун | ❌ нет `IAgentRuntimeAdapter` (claude_local/codex_local/process/http) с 3 реестрами |
| Governance / board | approval-service (+bulk/auto), agems-approval, agems-audit, architecture-review-service | 🟡 сервисы есть, **нет UX «совета директоров»**: найм-одобрение, стратегия CEO, единая лента аудита |
| Бюджеты/кастоды | budget-service, budget-alert, agems-budget, cost-optimization, CostManager-декоратор | 🟡 лимиты есть, **нет ledger-модели cost_events** с привязкой к агенту/компании/месяцу и hard-stop |
| Мультипользовательность | cross-tab-lock, dexie-identity; single-user | ❌ нет auth/invites/roles (и это осознанный local-first выбор — см. §5) |
| Портативность компаний | agent-marketplace.ts (внутренний), export-сервисов нет | ❌ нет manifest export/import с редакцией секретов |
| Дистрибуция | docker-compose (только sync-server), husky/commitlint, Playwright e2e | ❌ нет CLI, quickstart-деплоя, docs-сайта |
| Uncertainty-gating | consistency-checker, eval-сервисы, дебат-метрики (evidence/structure) | 🟡 есть из чего собрать, гейта «proceed/verify/escalate» нет |

**Итог: из 10 блоков Paperclip — 2 отсутствуют полностью, 7 — в статусе «скелет/разрозненные сервисы», 1 (мультипользовательность) — анти-цель.** Догнать = собрать и достроить, а не писать с нуля.

---

## 4. Что дописать: 9 модулей (по приоритету)

### M1. Persistent-рантайм: сервер, на котором «компания живёт 24/7» — **блокер №1**
**Почему.** Heartbeat-модель бессмысленна, если «сердце» — открытая вкладка браузера. У Paperclip Node-сервер + Postgres + SSE. Это тот же разрыв G1 из отчёта «vs топ-100», но теперь с точной спецификацией.
**Что писать.** Headless Gateway на базе готового `server/sync-server.mjs` (авторизация, rate-limit, allowed origins уже есть): REST `/api/companies|agents|issues|approvals|costs|dashboard` + SSE `live-events`; DAL-адаптер уже существует (`storage-adapter-instance.ts`) — добавить `PostgresRuntime`/`SQLiteRuntime` рядом с Dexie.
```ts
// Превращение cron-событий в бессмертный цикл (server/src/heartbeat-loop.ts)
setInterval(async () => {
  for (const job of await scheduler.dueCron(new Date())) {          // уже есть в IOpenClawService
    await heartbeatRuntime.wake(job.agent, { trigger: 'schedule', ref: job.id });
  }
  for (const req of await wakeups.pending()) {                       // назначение/@-упоминание/approval
    await heartbeatRuntime.wake(req.agentId, req.trigger);
  }
}, POLL_MS);
```
**Усилие:** L (2–3 недели). **Приёмка:** компания, созданная в браузере, продолжает выполнять задачи после закрытия браузера; SSE-лента видна на телефоне.

### M2. Adapter SDK: «найми любой рантайм» (claude_local / codex_local / process / http)
**Почему.** Формула Paperclip: *«If it can receive a heartbeat, it's hired»*. У ai-os есть мозги, но нельзя нанять внешний Claude Code/Codex-терминал как сотрудника — а именно так работает реальная автономия 24/7 (код пишется на диске, а не в песочнице вкладки).
**Что писать.** Контракт `IAgentRuntimeAdapter` (execute/parse/test) + 4 встроенных адаптера + **три реестра** (server-исполнение, UI-формы конфига и транскрипты stdout, CLI-вывод). Пакет `openclaw`-адаптера у Paperclip — вебхук; у вас уже есть `IOpenClawService` — переиспользовать протокол.
```ts
export interface IAgentRuntimeAdapter<IN, OUT> {
  readonly typeKey: string;                       // 'claude_local' | 'codex_local' | 'process' | 'http' | 'superagents_browser'
  execute(ctx: ExecutionContext, cfg: AdapterConfig): Promise<AgentRunResult>; // stdout+usage+cost
  parseStdout(raw: string): TranscriptEntry[];    // для run-viewer
  buildConfig(form: unknown): AdapterConfig;      // UI-форма → JSON
  testEnvironment(): Promise<Diagnostic>;         // CLI-доктор
}
```
**Усилие:** L (2 недели). **Приёмка:** в панели «Найм» добавлен агент `claude_local`; он получает задачу, пишет файл на диск, возвращает транскрипт и стоимость; видно в run-viewer.

### M3. Org chart 2.0: дерево подчинения вместо плоского устава
**Что писать.** Расширить `OrgCharter`: `agents.managerId` (строгое дерево, у CEO — null), `title`, `monthlyBudgetCents`, `status` (active/idle/running/error/paused/terminated); делегирование вверх/вниз; эскалация по цепочке; UI-страница OrgChart (в ai-os уже есть визуальный стек — Hive-топология, React Flow — переиспользовать рендер).
**Усилие:** M (1 неделя). **Приёмка:** создание компании «CEO → 3 отдела → 8 агентов»; задача, недоступная агенту, эскалируется менеджеру по цепочке.

### M4. Issues как единица работы: иерархия + atomic checkout
**Что писать.** На базе `AgemsTaskService`: поле `parentIssueId` (трассировка до цели компании), статусная модель Paperclip (`backlog→todo→in_progress→in_review→done|blocked|cancelled`), **атомарный checkout** (только один исполнитель владеет задачей; конкурентная попытка → `409 Conflict` — на Dexie решается транзакцией/версионным полем), inbox-страница с read-states.
**Усилие:** M (1–1,5 недели). **Приёмка:** два агента в двух вкладках конкурируют за задачу — один получает 409; дерево «цель → эпики → задачи» отображается на панели целей.

### M5. Heartbeat-протокол как исполняемое ядро
**Что писать.** Таблицы `heartbeat_runs`, `heartbeat_run_events`, `agent_wakeup_requests` (Dexie v44 + серверные аналоги); пять триггеров (schedule/assignment/comment/manual/approval); внутри heartbeat — фиксированный протокол: *проверить идентичность → обзор назначений → выбор работы → checkout → работа → отчёт*. Скелет уже есть: `autonomy-runner`, `dueCron`, `execution-queue`, `dead-letter-queue` — собрать в один цикл.
**Усилие:** M (1,5 недели, после M1). **Приёмка:** агент с расписанием «каждый час» выполняет 24 heartbeat-цикла за сутки на сервере; каждый цикл — трейс в DecisionGraph.

### M6. Governance: совет директоров как UX-слой над существующими approval-сервисами
**Что писать.** Не новый движок, а **сборка**: (a) требуемые одобрения — найм агента, стартовая стратегия CEO, board override (пауза/увольнение/реассайн); (b) единая лента `activity_log` (event-sourcing ядра уже пишет всё — нужна проекция); (c) страница Approvals с комментариями (approval-comments-аналог есть в agems-audit).
**Усилие:** M (1 неделя). **Приёмка:** агент запросил найм подчинённого → у board-оператора появился approval; без одобрения найм не исполняется; вся история — в ленте аудита.

### M7. Cost ledger: деньги в центах как первоклассная сущность
**Что писать.** Таблица `cost_events` (агент, компания, задача, модель, токены, центы) — CostManager-декоратор уже в цепочке провайдеров, он обязан начать писать в ledger; месячные бюджеты на агента/компанию с **hard-stop** (блокировка heartbeat при исчерпании); страница Costs (у вас есть Dashboard/Analytics — добавить проекцию). 
**Усилие:** S (3–4 дня). **Приёмка:** агент с лимитом $5/мес остановлен на пороге, менеджер получил эскалацию, лимит виден на OrgChart.

### M8. Company Portability + «Clipmart»: компании как пакеты
**Что писать.** Manifest-экспорт компании (агенты, конфиги адаптеров, цели, скиллы) в JSON+файлы со **стратегиями коллизий** (rename/skip/overwrite) и **редакцией секретов** (regex-подход Paperclip — взять как есть, он хорош); импорт обратно; директория шаблонов компаний (аналог ваших 33 дебат-пресетов — «Media Agency», «Research Lab», «QA Factory»). Ваши internal marketplace + AGEMS-каталог — готовые точки монтирования.
**Усилие:** M (1 неделя). **Приёмка:** экспорт компании → импорт в чистый инстанс (другой браузер/сервер) → компания запускается; секреты в файле вычищены.

### M9. Дистрибуция: CLI + quickstart + docs + uncertainty-гейт
**Что писать.**
1. **CLI** (`superagents`): `onboard`, `configure`, `run --watch`, `doctor`, `db-backup` — на базе уже поднятого headless API (M1).
2. **docker-compose.quickstart + Railway-манифест** (healthcheck `/api/health` — health-эндпоинт в телеметрии уже есть).
3. **Docs-сайт** (Mintlify): 5 стартовых страниц + гайды `agent-developer`/`board-operator` — заодно решает проблему 817 файлов docs/ (план консервации в аудите).
4. **Uncertainty-gated execution** — дешёвая и эффектная фича Paperclip: `confidence ≥0.75 + цитата → proceed; 0.40–0.75 → verify; <0.40 → escalate`. У вас она получится **сильнее**: консистентность можно мерить вашими дебат-метриками и eval-датасетами.
**Усилие:** M (1,5 недели суммарно). **Приёмка:** `npx superagents onboard` поднимает всё с нуля за <5 минут; агенты не проходят шаг без цитаты источника.

---
## 5. Что НЕ дописывать: асимметричные преимущества + стратегический мост

Догонять Paperclip — не значит становиться Paperclip. У него нет и, судя по архитектуре, не появится:

1. **Собственных мозгов.** Дебаты 13 стратегий с метриками (глубина, оригинальность, конвергенция), Memory Mesh (BM25+эмбеддинги+в-worker'ы), UCB1-роутинг 16 провайдеров, event-sourcing ядро на 543 событиях, Cognitive Builder, DecisionGraph/Microscope, counterfactual engine, симуляции общества с нормами. У Paperclip агент — это «вызов CLI и парсинг stdout».
2. **Локальной приватности.** Paperclip — Postgres-сервер с auth/инвайтами; SuperAgents — «данные не покидают машину». Это ниша, её надо сохранять как флагманскую (режим «компании в одном браузере»).
3. **Панельной вселенной.** 257 панелей против 26 страниц. Не разменивать: Paperclip-функции упаковывать в ≤12 новых панелей (Companies, OrgChart, Issues/Inbox, Approvals, Costs, Heartbeats, Adapters, Templates), а не плодить разделы.

**Стратегический мост (сильнее, чем «догнать»).** Сделать два хода, которые превращают конкурента в канал дистрибуции:
- **Ход A — адаптер `superagents_browser`:** реализовать M2 так, чтобы Paperclip мог «нанять» SuperAgents OS как агента (heartbeat → вызов headless API → дебаты/память/257 панелей работают на задачи paperclip-компании). Вы получаете 50k★-экосистему как рынок своих мозгов.
- **Ход B — импорт paperclip-компаний:** у вас уже есть `IOpenClawService.importSoul/importAgentsRoster/importHeartbeat` — Paperclip-манифест компании (M8) в тот же импортёр. «Приноси компанию из Paperclip — запускай локально с памятью и дебатами».

## 6. План догона: 3 спринта по 2 недели

| Спринт | Модули | Результат конца спринта | Оценка parity с Paperclip |
|---|---|---|---|
| **S1 «Тело»** | M1 (сервер+heartbeat-loop) → M3 (org chart) → M7 (cost ledger) | Компания живёт 24/7, есть иерархия и деньги | ~45% |
| **S2 «Кадры»** | M2 (adapter SDK) → M4 (issues+checkout) → M5 (heartbeat-протокол) | «Нанят» внешний claude_local; задачи с атомарным checkout | ~75% |
| **S3 «Правление и мир»** | M6 (governance UX) → M8 (portability+шаблоны) → M9 (CLI/docs/гейт) | Найм через approval, экспорт/импорт компаний, quickstart за 5 минут | ~90–95% |

**Зависимости и оговорки.**
- S1–S3 стартуют **после** Stage 0–1 из Roadmap 10/10 (живой CI, tsc-базлайн): писать 9 модулей на фундаменте со 1085 tsc-ошибками — умножать долг.
- Parity 100% не цель: мультипользовательский auth/инвайты (SaaS-слой Paperclip) сознательно пропущен (анти-цель, см. прошлый отчёт §9) — вместо него single-user board-режим. Отсюда честные ~90–95%, а не 100%.
- Ориентир объёма: Paperclip ≈78,6k строк на всё; ваши M1–M9 поверх существующего ядра — оценка ≈12–18k новых/изменённых строк.

## 7. Риски

| Риск | Вероятность | Митигация |
|---|---|---|
| M1 (сервер) размывает local-first философию | средняя | Двухрежимность: «company-in-browser» (по умолчанию, Dexie) и «company-on-server» (опция). Рекламить оба |
| Adapter SDK = гонка за совместимостью с CLI рантаймов (Claude Code меняет формат stdout) | высокая | Парсеры — в отдельных модулях (архитектура Paperclip), контрактные тесты на фикстурах stdout |
| Расползание: 9 модулей разом | высокая | Жёсткий порядок S1→S2→S3, каждый спринт = релиз с e2e-сценарием приёмки |
| Дублирование AGEMS vs Issues | средняя | Одна доменная модель: AgemsTask расширяется, не создаётся параллельная сущность |
| Секреты в портативных манифестах | средняя | Regex-редакция Paperclip + повторный аудит перед публикацией шаблонов |

## 8. Источники

1. Репозиторий `agencyenterprise/paperclip-ai` (клон 2026-09-18): README, `docs/start/core-concepts.md`, `docs/adapters/overview.md`, `META-ENGINE-OVERVIEW.md`, `packages/db/src/schema/` (69 таблиц), `server/src/services/` (heartbeat, company-portability, costs), `packages/adapters/*`, `cli/src/commands`, `docker-compose.quickstart.yml`, `railway.toml`.
2. Towards AI — «Paperclip: The Open-Source Operating System for Zero-Human Companies», 2026-03.
3. websearchapi.ai — «Paperclip AI Agent Orchestrator…» (38k★ за 4 недели; «Memento Man»), 2026-03; LinkedIn — 50k★ за 34 дня.
4. dev.to — «How We Built a Company Powered by 14 AI Agents Using Paperclip», 2026-04.
5. tenten.co/university — «Most Popular Virtual Agent Company GitHub Repo» (~23.8k★, март), 2026-03.
6. MindStudio, Contabo — обзоры фич и сравнения с LangChain, 2026-03/05.
7. Локальная факт-база ai-os: contracts/frontier.ts, rivals9.ts, agems-*, autonomy-orchestrator, dexie-schema.ts (см. worklog и два предыдущих отчёта).
