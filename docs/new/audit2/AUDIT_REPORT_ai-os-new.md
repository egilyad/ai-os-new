# Глубокий аудит проекта **ai-os-new** (SuperAgents OS v4.5.0)

**Дата аудита:** 2026-07-30
**Репозиторий:** https://github.com/n95887174-source/ai-os-new
**Версия:** 4.5.0
**Объём:** 1 516 исходных файлов · 323 893 строк кода · 228 директорий · 84 тестовых файла
**Стек:** React 19.2 · TypeScript 6.0.2 · Vite 8.0 · Zustand 4.5 · Dexie 4.4 · React Router 7 · Monaco · ReactFlow · TipTap · Framer Motion · Vitest 4 · Playwright 1.59

---

## Содержание

1. [Резюме для руководителя (Executive Summary)](#1-резюме-для-руководителя-executive-summary)
2. [Сводные оценки по направлениям](#2-сводные-оценки-по-направлениям)
3. [Критические проблемы (P0 — блокируют релиз)](#3-критические-проблемы-p0--блокируют-релиз)
4. [Архитектура и структура кода](#4-архитектура-и-структура-кода)
5. [Безопасность](#5-безопасность)
6. [Сборка, зависимости, тесты, CI/CD](#6-сборка-зависимости-тесты-cicd)
7. [UX, производительность, документация](#7-ux-производительность-документация)
8. [Аудит панелей — Dashboard и Chat](#8-аудит-панелей--dashboard-и-chat)
9. [Аудит панелей — Блок Debates (48 панелей)](#9-аудит-панелей--блок-debates-48-панелей)
10. [Аудит панелей — Agents, System, Content (72 панели)](#10-аудит-панелей--agents-system-content-72-панели)
11. [Топ-10 проблем, требующих немедленного исправления](#11-топ-10-проблем-требующих-немедленного-исправления)
12. [Дорожная карта улучшений](#12-дорожная-карта-улучшений)
13. [Список детальных подотчётов](#13-список-детальных-подотчётов)

---

## 1. Резюме для руководителя (Executive Summary)

`ai-os-new` — это амбициозный, **очень крупный** проект: «операционная система для AI-агентов», реализованная как одностраничное React-приложение с собственным DI-контейнером, event-driven kernel, 167 контрактами и 377 сервисами в ядре. Видна **огромная проделанная работа**: зрелая архитектура ядра, строгий ESLint с кастомным правилом `kernel-lifecycle/mandatory-lifecycle`, продуманная Docker-сборка, Command Palette (⌘K), 7 тем, onboarding-мастер, 178 lazy-load чанков.

Одновременно **проект страдает от серьёзной дисперсии зрелости**. ~32 из 48 «debate»-панелей — это **визуально похожие на реальные, но не подключённые к бэкенду demo-заглушки** (копипаста одного шаблона с захардкоженными русскими строками и одинаковыми демо-данными). Безопасность API-ключей — **шоу** (AES-GCM шифрование с ключом, лежащим рядом в localStorage). CI **красный** по двум gate'ам (lint и security-audit). 47 МБ мусора в репозитории (`docs/ocs/erorrrrr*.md/txt`). Документация разошлась с кодом (4 разных источника дают 4 разных количества контрактов/сервисов/панелей).

**Сводная оценка готовности проекта к production-использованию: 5.5 / 10**

| Аспект                       | Оценка | Вердикт                                                            |
| ---------------------------- | -----: | ------------------------------------------------------------------ |
| Архитектура                  |   7/10 | Зрелая, но с layer violation и god-файлами                         |
| Безопасность                 |   4/10 | Критическая: шифрование API-ключей — security theatre              |
| Сборка/CI/тесты              |   5/10 | CI красный, покрытие 20%, typecheck тестов отключён                |
| UX/Accessibility             |   6/10 | Хороший shell, слабая a11y на уровне панелей, нет мобильной версии |
| Производительность           |   7/10 | Отличный code-splitting, мало React.memo, 10 468 inline-стилей     |
| Документация                 |   5/10 | 47 МБ мусора, расхождения, разбухший AGENTS.md (1 634 строки)      |
| Готовность панелей (среднее) | 5.7/10 | 17/137 панелей production-ready, 54 — ранний WIP/demo              |

**Главный парадокс проекта:** при колоссальной проделанной работе над ядром и сервисами, **пользовательский интерфейс частично симулирует функциональность**, которая реально не подключена. Это подрывает доверие ко всей системе — пользователь не может отличить рабочую панель от demo-заглушки без чтения кода.

---

## 2. Сводные оценки по направлениям

```
┌──────────────────────────────────────────┬───────┬─────────────────────────────────┐
│ Направление                              │ Оценка│ Краткий вердикт                 │
├──────────────────────────────────────────┼───────┼─────────────────────────────────┤
│ Архитектура и структура                  │  7/10 │ Зрелое ядро, god-файлы, дрейф   │
│ Безопасность                             │  4/10 │ P0: ключи в "зашифрованном"     │
│                                          │       │ виде, но ключ лежит рядом       │
│ Сборка, зависимости, тесты, CI/CD        │  5/10 │ CI красный, покрытия нет        │
│ UX и accessibility                       │  6/10 │ Хороший shell, слабые панели    │
│ Производительность                       │  7/10 │ Code-split топ, memoization low │
│ Документация                             │  5/10 │ 47 МБ мусора, дрейф кол-в       │
│ Панели Dashboard + Chat (17 шт)          │  6.3  │ 3 production, 4 ранний WIP      │
│ Панели Debates (48 шт)                   │  5.0  │ 8 production, 32 demo-заглушки  │
│ Панели Agents/System/Content (72 шт)     │  6.3  │ 17 production, 22 ранний WIP    │
├──────────────────────────────────────────┼───────┼─────────────────────────────────┤
│ ИТОГО (средневзвешенное)                 │  5.5  │ Не готово к production «как есть»│
└──────────────────────────────────────────┴───────┴─────────────────────────────────┘
```

---

## 3. Критические проблемы (P0 — блокируют релиз)

### P0-1. API-ключи хранятся фактически в plaintext

**Файлы:**

- `src/kernel/services/key-management/key-vault.ts:29-37` (заголовок ложно утверждает, что vault «не подключён»)
- `src/kernel/services/key-management/key-service.ts:42, 451-465` (авто-unlock при загрузке)
- `src/kernel/services/key-management/key-registry.ts:568-622`

**Проблема:** AES-GCM шифрование с master-ключом, который лежит **в том же браузерном профиле** в `localStorage['key-vault:device-key']`. Любой XSS, malicious extension или malware с доступом к браузерному профилю восстанавливает все ключи (OpenAI/Anthropic/Gemini/OpenRouter/Groq/NVIDIA/...) за секунды. Заголовок файла `key-vault.ts:29-37` прямо лжёт — vault **подключён** и **автоматически разблокируется** при загрузке.

**Сценарий атаки:** XSS в любом npm-пакете → чтение `localStorage['key-vault:device-key']` + IndexedDB → расшифровка всех LLM-ключей → использование под аккаунтом жертвы.

**Решение:** Либо (a) удалить vault и честно документировать «keys in plaintext, single-user only», либо (b) требовать passphrase при загрузке, выводить master-ключ из неё (PBKDF2 ≥600k iter или Argon2id), не хранить его. Для multi-user — `ExternalSecretsService` уже поддерживает Vault/AWS/GCP, сделать его дефолтом.

### P0-2. CI красный по двум gate'ам

**Файлы:** `.github/workflows/ci.yml:46` (lint `--max-warnings 0`), `:148` (`npm audit --audit-level=high`), `eslint.config.js`, `package.json`.

**Проблема:** `npm run lint` → 38 ошибок + 204 warnings = 242 проблемы. CI с `--max-warnings 0` падает. `npm audit` → 6 уязвимостей (1 moderate в `react-router-dom@7.17.0`, 5 high транзитивных: `undici`, `postcss`, `fast-uri`, `brace-expansion`, `react-router`). CI с `--audit-level=high` тоже падает.

**Вопрос к разработчику:** Если CI красный на каждом PR — либо PR-ы проходят мимо (тогда gate бесполезен), либо разработка заблокирована.

**Решение:**

1. `npm install react-router-dom@^7.18.0 vite@latest` — закроет 5/6 npm audit уязвимостей.
2. Исправить 38 lint-ошибок (29 `no-explicit-any` + 5 `exhaustive-deps` + 2 `no-empty` + 2 прочих).
3. Решить: либо починить 204 warning'а, либо временно `--max-warnings 250` и постепенно снижать.

### P0-3. 32 «debate»-панели — это demo-заглушки, поданные как реальные

**Файлы:** Все 32 панели: `SteelmanPanel`, `BayesianJudgePanel`, `BlindEvalPanel`, `CredibilityPanel`, `CalibrationPanel`, `ConsistencyPanel`, `FrameTrackerPanel`, `StanceDriftPanel`, `InsightBusPanel`, `EntanglementPanel`, `AnchoringPanel`, `MetaAgentPanel`, `OutcomeForecasterPanel`, `ConceptBlenderPanel`, `BeliefMiningPanel`, `MinimaxPlannerPanel`, `ExpertWitnessPanel`, `RhetoricPanel`, `BiasProfilerPanel`, `IncentiveDetectorPanel`, `StakeholderPanel`, `ScratchpadPanel`, `PersonaMixerPanel`, `BoPTrackerPanel`, `GotDeliberationPanel`, `SimilarityMonitorPanel`, `DriftDetectorPanel`, `ShadowOpponentPanel`, `AdversarialSourcePanel`, `VulnTargetingPanel`, `JustificationPanel`, `LogicalFormPanel`.

**Проблема:** Все ~250–520 LOC, все только на русском (ноль i18n), все используют одинаковый захардкоженный `SAMPLE_ARGUMENTS` (агенты «Афина» vs «Гермес» обсуждают open-source AI), все содержат копипасту одного inline-компонента `Toggle` (~960 строк дублирования суммарно), **ни одна** не импортирует и не вызывает свой реальный сервис (которые существуют в `kernel/services/debate-runtime/`). Пользователь видит «настоящую» панель, но переключатель уже доступен в `DebateQualityPanel`.

**Решение:** Либо (a) снести все 32 панели и оставить `DebateQualityPanel` (1–2 dev-недели), либо (b) реализовать их правильно по существующим сервисам (4–6 человеко-месяцев). Текущее состояние — худшее из миров: фейковый UI выглядит настоящим.

### P0-4. 47 МБ мусора в репозитории

**Директория:** `docs/ocs/` — файлы `eroor.md` (4.25 МБ), `erorrrrr.md` (7.14 МБ), `erorrrrr.txt` (11.21 МБ), `erorrrrr2.md` (925 КБ), `erorrrrr3.md`, `erorrrrr4.md` (9.34 МБ), `erorrrrr5.md`, `erorrrrr6.md`, `erorrrrr7000.md`, `erorrrrr799.md`, `erorrrrr777d.md`, `erorrrrr777zd.md`, `erorrrrr7vv.md`, `erorrrrr7.txt`, `resultall.md`. Плюс дубликат `docs/aaa.md` (118 КБ).

**Решение:** `git rm -r docs/ocs/ && git rm docs/aaa.md`, добавить в `.gitignore`.

### P0-5. Admin token — не аутентификация, а обфускация

**Файлы:** `config-registry.ts:299-319`, `admin-service.ts:490-495`, `policy-service.ts:121-126`, `virtual-key-service.ts:126-131`, `external-secrets-service.ts:75-80`.

**Проблема:** `adminToken = crypto.randomUUID()` генерируется при каждой загрузке, живёт в JS heap, читается из любого кода в странице через `CONFIG.security.adminToken`. Non-enumerable свойство — это обфускация, не граница безопасности. XSS → полный admin-доступ к `adminService.executeCommand('reset_metrics' | 'clear_cache' | 'restart_agent' | 'toggle_tool')`, `policyService.addPolicy`, `virtualKeyService.create/revoke`, `externalSecretsService.activateBackend`.

**Решение:** Для single-user — удалить adminToken совсем. Для multi-user (TeamCollaboration намекает, что это планируется) — реальная server-side auth (OAuth/OIDC + RBAC).

### P0-6. Sandbox worker использует `new Function()` несмотря на обещание в дизайн-доке

**Файлы:** `src/kernel/workers/sandbox.worker.ts:318-348`, `docs/002-worker-sandboxing.md:16`.

**Проблема:** Документация явно утверждает: «no `eval`/`Function` constructor». Реальность: `sandbox.worker.ts:337` использует `new Function()` для выполнения пользовательского кода. Production CSP блокирует `unsafe-eval` → fail-closed в проде, но dev-режим разрешает. Любая ошибка в CSP-политике = RCE.

**Решение:** Переписать на основе `meriyah` AST + интерпретатор, как утверждает документация.

---

## 4. Архитектура и структура кода

**Оценка: 7 / 10**

### Сильные стороны

- **Зрелый DI-контейнер** (`src/kernel/container.ts`) с lifecycle-хуками, ленивой инициализацией, областями видимости.
- **Строгий ESLint** с кастомным правилом `kernel-lifecycle/mandatory-lifecycle` — форсирует декларацию `init()`/`destroy()` у всех kernel-сервисов.
- **0 циклических зависимостей** в `src/kernel/` (подтверждено `madge --circular`).
- **Строгое разделение слоёв**: `kernel/contracts/` (167 интерфейсов) → `kernel/services/` (377 реализаций) → `kernel/service-registration/` (composition root) → `stores/` → `components/`.
- **Memory instrumentation**: `MemoryWatchdog`, bounded ring buffers, `useVisibilityInterval` (пауза polling при скрытой вкладке).
- **TypeScript strictness**: `strict: true` в `tsconfig.app.json`, `noUnusedLocals`, `noUnusedParameters`.
- **Code-splitting**: 178 `React.lazy` импортов, 12 ручных Vite-чанков.
- **Honest тесты**: 84 тест-файла с покрытием критических сервисов ядра (kernel/contracts, container, budget, debate-orchestrator, consistency-checker, scheduler и др.).

### Критические проблемы архитектуры

#### C-1. Дрейф документации — 4 источника, все разные

| Метрика                         | AGENTS.md | STRUCTURE.md | Actual                   |
| ------------------------------- | --------- | ------------ | ------------------------ |
| Контракты в `kernel/contracts/` | 162       | 123          | **167**                  |
| Сервисы в `kernel/services/`    | 346       | 303          | **377**                  |
| UI-панели                       | "75+"     | "130+"       | **165 dirs / 600+ .tsx** |
| Тест-файлы                      | 46        | 46           | **84**                   |

`docs/STRUCTURE.md:29` ссылается на `service-list.ts` — файл переименован в `bootstrap-phases.ts`.

#### C-2. Layer violation, «исправленный» исключением в `.dependency-cruiser.cjs`

`kernel/service-registration/phase3-debate-runtime.ts:93-94` и `phase6-high-level.ts:43-45, 183-185` импортируют adapter-фабрики из `src/stores/`. Правило `no-ui-in-kernel` «починено» тем, что в `.dependency-cruiser.cjs:18-23` добавлено исключение `pathNot: 'service-registration/'`. AGENTS.md утверждает «Layer violations: 4 → 0 ✅» — это ложь.

#### C-3. 8 `@deprecated MOCK` сервисов с UI-панелями

Сервисы `deploy`, `fine-tuning`, `model-distillation`, `health-sla`, `provider-migration`, `sleep-engine` помечены `@deprecated MOCK`, но зарегистрированы в DI и имеют полноценные UI-панели (777–811 LOC каждая). Пользователь видит «реалистичный» UI, который возвращает симулированные данные без какой-либо индикации.

#### C-4. 18 god-файлов (>1000 LOC), 6 в ядре

| Файл                                                                |   LOC |
| ------------------------------------------------------------------- | ----: |
| `kernel/services/roles/role-definitions.ts`                         | 3 068 |
| `kernel/services/debate-runtime/debate-llm-caller.ts`               | 2 729 |
| `kernel/services/roles/team-template-definitions.ts`                | 2 397 |
| `kernel/services/personas/persona-definitions.ts`                   | 2 088 |
| `kernel/services/debate-runtime/debate-prompt-builder.ts`           | 1 618 |
| `kernel/services/key-management/key-service.ts`                     | 1 339 |
| `components/ServiceRegistryPanel/ServiceRegistryPanel.tsx`          | 1 391 |
| `components/QualityImpactDashboard/QualityImpactDashboardPanel.tsx` | 1 201 |
| `components/DashboardPanel/DashboardPanel.tsx`                      | 1 088 |
| `components/RolesPanel/RolesConsortiaPanel.tsx`                     | 1 067 |

#### C-5. 92 из 165 директорий компонентов (56%) содержат ровно 1 файл

Это либо плохо организованный код, либо кандидаты на объединение в общие директории.

#### C-6. Дубликаты: 9 панелей задублированы top-level `.tsx` + одноимённой директорией

`AgentJournalPanel`, `BudgetPanel`, `ChatExportPanel`, `DebateAnalysisPanel`, `DocsHealthPanel`, `KeyNotesPanel`, `PerformanceProfilerPanel`, `TournamentPanel`, `DecisionLogPanel` существуют и как `FooPanel.tsx`, и как `FooPanel/FooPanel.tsx`.

### Рекомендации

- **P0:** Удалить `docs/ocs/` и `docs/aaa.md`.
- **P0:** Снести 32 demo-заглушки debate-панелей либо пометить их `ComingSoonPanel`.
- **P1:** Перенести adapter-wiring из `kernel/service-registration/` в UI composition root (`src/stores/kernel-wiring.ts`); убрать исключение из `.dependency-cruiser.cjs`.
- **P1:** Сгенерировать метрики (`contracts count`, `services count`, `panels count`) скриптом и заменить hardcoded числа в `AGENTS.md`/`STRUCTURE.md`.
- **P2:** Расщепить god-файлы. `role-definitions.ts` (3068 LOC) — явно кандидат на разделение по доменам.
- **P2:** MOCK-сервисы — либо feature-flag с бейджем «Demo mode» в UI, либо удалить вместе с панелями.

---

## 5. Безопасность

**Оценка: 4 / 10**

### Сильные стороны

- Строгий production CSP (блокирует `unsafe-eval`, `unsafe-inline`).
- `DOMPurify` на каждом `dangerouslySetInnerHTML`.
- CORS-proxy (`scripts/cors-proxy.mjs`) с защитой от DNS-rebinding — корректно ловит `fd00:` ULA, CGNAT `100.64.0.0/10`.
- `sync-server.mjs` с timing-safe auth и rate-limiting.
- Prompt-injection scanner **реально подключён** в `chat-executor.ts` в 3 точках.
- AST-валидация sandbox с defense-in-depth shadowing и CSP fail-closed.
- Webhook URLs маскируются при отображении в `WebhooksPanel`.
- Constant-time сравнение в `src/shared/utils/constant-time.ts`.

### Уязвимости

#### P0-1. Security theatre шифрования ключей — описано выше.

#### P1-1. Admin token — описано выше.

#### P1-2. `new Function()` в sandbox — описано выше.

#### P1-3. MCP-серверы доверяются вслепую

**Файлы:** `src/kernel/services/tool-executor.ts:wrapExternalData`.

Проблема: `wrapExternalData` (санитизация) применяется только к результатам `t-mcp readResource` — **не** к `tools/list` (описания инструментов) и **не** к `tools/call` (ответы инструментов). Злонамеренный MCP-сервер может выполнить prompt injection через описание инструмента, которое попадёт в LLM-контекст без фильтрации.

#### P1-4. Webhook SSRF TOCTOU

**Файл:** `src/kernel/services/notification-webhook-service.ts`.

`isValidWebhookUrl` делает HEAD-запрос для проверки, затем `sendWithRetry` делает POST на тот же URL. Между вызовами DNS может перебиндиться на внутренний адрес. `testWebhook` вообще пропускает валидацию.

#### P1-5. `isPrivateIP` неполон

**Файл:** `src/shared/utils/network.ts`.

Не ловит `fd00::` (IPv6 ULA) и CGNAT `100.64.0.0/10`. `cors-proxy.mjs` ловит правильно — асимметрия защиты.

#### P1-6. 6 npm-уязвимостей

- `react-router-dom@7.17.0` (moderate) — fix в 7.18.0 (open redirect, XSS, CSRF bypass).
- Транзитивные high: `undici`, `postcss`, `fast-uri`, `brace-expansion`, `react-router`.

#### P1-7. Hardcoded secrets в `.env.example`

`.env.example` содержит реалистичные примеры; убедиться, что там нет настоящих токенов.

### Рекомендации (приоритезация)

| Приоритет | Действие                                                          | Усилие   |
| --------- | ----------------------------------------------------------------- | -------- |
| **P0**    | Реальная защита ключей: passphrase или server-side хранилище      | 1 неделя |
| **P0**    | Sandbox: убрать `new Function()`, переписать на AST-интерпретатор | 1 неделя |
| **P1**    | Удалить admin token или реализовать server-side auth              | 3 дня    |
| **P1**    | `npm install react-router-dom@^7.18.0 vite@latest`                | 30 мин   |
| **P1**    | Расширить `wrapExternalData` на `tools/list` и `tools/call` MCP   | 1 день   |
| **P1**    | Webhook SSRF: проверять IP прямо перед POST, не ранее             | 4 часа   |
| **P1**    | Унифицировать `isPrivateIP` с `cors-proxy.mjs`                    | 2 часа   |
| **P2**    | SAST в CI (eslint-plugin-security, semgrep)                       | 1 день   |
| **P2**    | CSP report-uri для мониторинга нарушений                          | 2 часа   |

---

## 6. Сборка, зависимости, тесты, CI/CD

**Оценка: 5 / 10**

### Сильные стороны

- `npm run typecheck:fast` → **0 ошибок** ✅ (чистый TypeScript).
- Кастомный ESLint плагин `kernel-lifecycle/mandatory-lifecycle` — гарантированно ловит забытые `init()`/`destroy()`.
- 4 layering-правила в `.dependency-cruiser.cjs` (no-circular, no-react-in-kernel, no-ui-in-kernel, no-kernel-services-in-llm).
- **Образцовый Docker**: multi-stage, `nginx-unprivileged`, non-root, read-only fs, `cap_drop: ALL`, `no-new-privileges`, tmpfs, resource limits, layer caching.
- Husky pre-commit + commit-msg (commitlint conventional).
- 84 тест-файла с сильным покрытием ядра (50+ сервисных тестов).
- Чистый `.env.example` со всеми переменными.

### Критические проблемы

#### C-1. CI красный по lint

38 ошибок + 204 warning'а = 242 проблемы. CI с `--max-warnings 0` падает. Либо CI обходят, либо PR не мержатся.

**Распределение ошибок:** 29 `no-explicit-any`, 5 `react-hooks/exhaustive-deps`, 2 `no-empty`, 2 прочих — всего 13 файлов.

#### C-2. CI красный по security-audit

5 high + 1 moderate уязвимостей. CI с `--audit-level=high` падает.

#### C-3. 84 тест-файла исключены из typecheck

`tsconfig.app.json:33` — `"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]`. Ошибки типов в тестах видны только при медленном `vitest run` (280s timeout).

#### C-4. Coverage thresholds = 20% и не проверяются в CI

`vitest.config.ts:22-27` задаёт thresholds 20/10/15/20. CI `test` job не запускает `--coverage`. Coverage run таймаутит на 280s.

#### C-5. depcruise правила не проверяются в CI

4 layering-правила определены, но `check:deps` не запускается в `.github/workflows/ci.yml`. Правила — мёртвый код.

#### C-6. `build:unsafe` пропускает typecheck

`package.json:17` — скрипт `build:unsafe` запускает только `vite build` без `tsc -b`. Если кто-то (или deploy-скрипт) его вызовет — TypeScript-ошибки замалчиваются, битый bundle уходит в прод.

#### C-7. Production-сборка без sourcemaps

`vite.config.ts:46` — `sourcemap: false`. Production-ошибки имеют минифицированные stack trace — отладка почти невозможна.

#### C-8. Bleeding-edge major-версии

| Пакет                       | Версия    | Релиз    | Комментарий                   |
| --------------------------- | --------- | -------- | ----------------------------- |
| `typescript`                | `~6.0.2`  | Oct 2025 | Первый 6.x patch — нестабилен |
| `vite`                      | `^8.0.10` | 2025     | Первый год 8.x                |
| `eslint`                    | `^10.2.1` | 2025     | Первый год 10.x               |
| `vitest`                    | `^4.1.5`  | 2025     | Первый год 4.x                |
| `eslint-plugin-react-hooks` | `^7.1.1`  | 2025     | Major bump                    |
| `zod`                       | `^4.4.3`  | 2025     | Major bump                    |
| `lucide-react`              | `^1.14.0` | 2025     | Первый год 1.x                |

`madge` имеет peer-dep конфликт с TS 6 → вынужденное `--legacy-peer-deps` в `.npmrc`.

### Рекомендации

| Приоритет | Действие                                                                      | Усилие |
| --------- | ----------------------------------------------------------------------------- | ------ |
| **P0**    | Починить 38 lint-ошибок                                                       | 1 день |
| **P0**    | `npm install react-router-dom@^7.18.0 vite@latest`                            | 30 мин |
| **P0**    | Убрать exclude тестов из `tsconfig.app.json` или создать `tsconfig.test.json` | 2 часа |
| **P1**    | Добавить `--coverage` в CI test job                                           | 1 час  |
| **P1**    | Добавить `dep-graph` job в CI: `npm run check:deps`                           | 30 мин |
| **P1**    | Удалить `build:unsafe` или переименовать в `build:skip-typecheck` с warning   | 15 мин |
| **P1**    | `sourcemap: 'hidden'` + upload в Sentry/Datadog                               | 4 часа |
| **P2**    | Понизить TypeScript до `~5.9.x` для совместимости с madge                     | 1 день |
| **P2**    | Поднять coverage thresholds до текущего + 1% и rattling                       | 2 часа |
| **P2**    | Pin известные хорошие версии вместо `^` для критичных                         | 1 час  |

---

## 7. UX, производительность, документация

### 7.1 UX & Accessibility — **6 / 10**

#### Сильные стороны

- **Command Palette (⌘K)** с fuzzy search, недавними, клавиатурной навигацией.
- `@react-aria/focus` `FocusScope` в `ModalShell` для focus trap.
- Skip-nav link, 7 тем (включая high-contrast axis).
- `OnboardingWizard` подключён к реальному `keyService.addKey` (не демо).
- `useFocusTrap`, `useConfirm`, `useAutoClearError`, `usePolling`, `useNow`, `useLatest` — переиспользуемые хуки.

#### Проблемы

- **`ComingSoonPanel` существует (68 LOC), но не подключён ни к одному роуту.** Stub-роуты падают в runtime вместо показа placeholder. UX-P0.
- **Словарь `ru.ts` сам содержит ломаный русский**: `'Раздел debates'`, `'Дебаты arena'`, `'quick Доступ'`, чисто-английские значения вроде `'tournament': 'tournament'`. UX-P0.
- **26 файлов** импортируют `t` напрямую из `i18n/translations` вместо `useTranslation()` hook — не ре-рендерятся при смене языка. (Включая `chat-sessions`, `session-hub`.)
- **A11y слабая**: иконочные кнопки без `aria-label`, кликабельные `<div>`-карточки без keyboard-доступа, многие модалки без focus trap.
- **Мобильная адаптация отсутствует**: всего 4 `@media` запроса во всём проекте, только 2 из 644 панелей вызывают `useMediaQuery`. Mobile = shell-only.
- **10 468 inline `style={{}}` блоков** — делает темизацию, responsive, a11y-аудит почти невозможным. Нет CSS-модулей / styled-components / Tailwind.

### 7.2 Производительность — **7 / 10**

#### Сильные стороны

- **178 `React.lazy` импортов** + 12 ручных Vite-чанков — агрессивный code-splitting.
- `MemoryWatchdog` для runtime-инструментации памяти.
- `useVisibilityInterval` — пауза polling при скрытой вкладке.
- `@tanstack/react-virtual` для длинных списков.
- 0 нарушений `useEffect` deps-array (eslint форсирует).
- Только 1 `TODO` во всём коде — образцовая чистота.
- `isMountedRef` паттерн последовательно предотвращает post-unmount state updates.

#### Проблемы

- **Только 13 `React.memo`** на 644 `.tsx` файла — крайне мало для сложного admin UI.
- `framer-motion` на критическом пути в `DashboardPanel`/`ChatPanel`/`BookmarksPanel`/`TasksPanel`, несмотря на комментарий в `AppLayout.tsx` утверждающий, что он убран.
- Только 2 виртуализированных списка на весь проект.
- `DashboardPanel.tsx` (1088 LOC) не мемоизирует тяжёлые widgets.
- Coverage запуск таймаутит на 280s — тесты тяжёлые.

### 7.3 Документация — **5 / 10**

#### Сильные стороны

- Bilingual README + CHANGELOG (RU/EN).
- `docs/README.md` — карта документации.
- `SYSTEM_PASSPORT.md` с mermaid-диаграммой.
- Образцовая чистота кода (1 `TODO` всего).
- JSDoc на ключевых утилитах.

#### Проблемы

- **47 МБ debug-dump мусора** в `docs/ocs/` (P0, описано выше).
- **Дрейф количеств** между `AGENTS.md`, `STRUCTURE.md`, `SYSTEM_MANIFEST.md` — описано в архитектуре.
- **`AGENTS.md` разбух до 1 634 LOC (145 КБ)**: 5% — инструкции агенту, 95% — лог 76 сессий. Следует разбить.
- **Нет panel-map диаграммы** для 165 панелей — невозможно понять навигацию без чтения кода.
- `docs/plan/missing-panels-42.md` перечисляет 42 запланированные панели, 32 из которых построены как demo-stubs — план нечестно «выполнен».
- **`DEBT_REPORT.md` устарел**: утверждает «zero debt», тогда как аудиты находят значительный долг.
- 40 `.md` файлов в корне `docs/` без поддиректорий, бессистемное именование, непоследовательная локализация.

### 7.4 Рекомендации (UX/Perf/Docs)

| Приоритет | Действие                                                              | Усилие   |
| --------- | --------------------------------------------------------------------- | -------- |
| **P0**    | Удалить `docs/ocs/erorrrrr*` и `eroor*` (47 МБ)                       | 30 мин   |
| **P0**    | Подключить `ComingSoonPanel` как fallback для stub-роутов             | 2 часа   |
| **P0**    | Аудит `ru.ts` на не-кириллические значения                            | 1–2 дня  |
| **P1**    | Заменить 26 прямых `t`-импортов на `useTranslation()`                 | 4 часа   |
| **P1**    | Мемоизировать 10 тяжёлых list-row компонентов в `React.memo`          | 1 день   |
| **P1**    | Сгенерировать panel-map mermaid из `route-registry-core.ts`           | 4 часа   |
| **P1**    | Разбить `AGENTS.md` на инструкции (100 строк) + `docs/SESSION_LOG.md` | 2 часа   |
| **P2**    | Адоптировать CSS-решение (CSS Modules или Tailwind) — план миграции   | 1 неделя |
| **P2**    | Добавить `useMediaQuery` в top-10 самых используемых панелей          | 2 дня    |
| **P2**    | Организовать `docs/` в поддиректории                                  | 1 день   |

---

## 8. Аудит панелей — Dashboard и Chat

**17 панелей · Средняя оценка 6.3 / 10 · 0 stubs · 0 `any` в production-коде**

### Сильные стороны секции

- **Все 17 панелей — реальные реализации**, подключённые к kernel-сервисам. Ноль `ComingSoonPanel`, ноль моков, ноль `any` в production-коде.
- `isMountedRef` паттерн последовательно предотвращает post-unmount краши.
- Event-bus subscriptions корректно очищаются в каждом `useEffect`.
- Chat store использует write-through persistence (Dexie before Zustand) для crash safety.
- `@tanstack/react-virtual` для виртуализации длинных разговоров.
- Distributed lock для cross-tab chat safety.
- Prompt-injection санитизация в `sendMessage`.

### Score Card

| #   | Panel ID              | Файл                                     | Score | Ключевая проблема                                                            |
| --- | --------------------- | ---------------------------------------- | ----: | ---------------------------------------------------------------------------- |
| 1   | `dashboard`           | `DashboardPanel.tsx` (1088 LOC)          | **7** | >1000 LOC; framer-motion на hot path                                         |
| 2   | `analytics`           | `AnalyticsPanel.tsx` (259 LOC)           | **7** | Нет кнопки refresh; cap 24 записей                                           |
| 3   | `pricing`             | `PricingPanel.tsx` (683 LOC)             | **6** | `handleSync` без try/catch — `isSyncing` зависает                            |
| 4   | `budget`              | `BudgetPanel.tsx` (185 LOC)              | **8** | ✅ Production-ready. `window.confirm` вместо `useConfirm`                    |
| 5   | `cost-analytics`      | `CostAnalyticsPanel.tsx` (453 LOC)       | **7** | Sparkline захардкожен на width 200                                           |
| 6   | `cost-optimization`   | `CostOptimizationPanel.tsx` (339 LOC)    | **7** | Нет loading skeleton, нет error state                                        |
| 7   | `custom-metrics`      | `CustomMetricsPanel.tsx` (334 LOC)       | **6** | Dynamic import 5 раз без кеша                                                |
| 8   | `budget-alerts`       | `BudgetAlertsPanel.tsx` (320 LOC)        | **5** | **Ноль i18n** — все строки английские                                        |
| 9   | `key-usage-analytics` | `KeyUsageAnalyticsPanel.tsx` (270 LOC)   | **4** | **Ноль i18n**, `return null` на initial load, нет refresh                    |
| 10  | `routing`             | `RoutingIntelligence.tsx` (292 LOC)      | **8** | ✅ Реально управляет роутингом                                               |
| 11  | `contribution-graph`  | `ContributionGraphPanel.tsx` (225 LOC)   | **5** | **Ноль i18n**, нет empty-state                                               |
| 12  | `chat`                | `ChatPanel/ChatPanel.tsx` (16 sub-files) | **7** | ⚠️ `ExecutionMode` selector мёртв; per-key model selection теряется при send |
| 13  | `chat-sessions`       | `ChatSessionsManagerPanel.tsx` (669 LOC) | **6** | Импортирует `t` напрямую (не ре-рендерится при смене языка)                  |
| 14  | `session-hub`         | `SessionHubPanel.tsx` (555 LOC)          | **5** | Импортирует `t` напрямую; контекстное меню на английском                     |
| 15  | `bookmarks`           | `BookmarksPanel.tsx` (298 LOC)           | **8** | ✅ Production-ready                                                          |
| 16  | `tasks`               | `TasksPanel.tsx` (754 LOC)               | **6** | Tasks выводятся из traces — нет реального lifecycle/persistence              |
| 17  | `files`               | `WorkspacePanel.tsx` (572 LOC)           | **5** | ⚠️ **Mis-named**: не файловый менеджер, только File System Access API attach |

### Критические баги в `chat` (primary user surface)

1. **`ExecutionMode` selector мёртв**: UI даёт выбрать `single`/`parallel`/`auto`, но `handleSend` принимает `_mode` и игнорирует.
2. **Per-key model selection теряется при send**: `selectedModelPerKey` пробрасывает только последнее изменённое значение, так что multi-key parallel queries отправляют одно и то же имя модели каждому провайдеру.

### Топ-5 проблем секции

1. `key-usage-analytics` — выглядит сломанной (`return null` на initial load), ноль i18n.
2. `chat` — два silent бага на главной пользовательской поверхности.
3. `files` — название не соответствует содержимому.
4. `chat-sessions`, `session-hub` — импорт `t` напрямую ломает смену языка.
5. ~700 inline-стилей в 17 деревьях панелей.

---

## 9. Аудит панелей — Блок Debates (48 панелей)

**48 панелей · Средняя оценка 5.0 / 10 · 8 production · 32 demo-stub**

### Распределение зрелости

```
Production-ready (8-10)  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░  8 панелей
Functional w/ issues (6-7) ▓▓▓▓▓▓▓▓░░░░░░░░░░  8 панелей
Demo-stub (4)             ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  32 панели  ← главная проблема
Broken (1-3)              ░░░░░░░░░░░░░░░░░░  0 панелей
```

### Production-ready панели (8 штук)

| Panel               | Файл                                  | Score | Заметка                          |
| ------------------- | ------------------------------------- | ----: | -------------------------------- |
| `debate`            | `DebateArena.tsx` (71 LOC)            |     8 | Tab router, делегирует остальное |
| `builder`           | `CognitiveBuilder.tsx` (399 LOC)      |     8 | ReactFlow                        |
| `argument-graph`    | `ArgumentGraphPanel.tsx` (648 LOC)    |     8 | ReactFlow, хороший empty state   |
| `topics`            | `TopicSuggesterPanel.tsx` (174 LOC)   |     8 | i18n ✓, clipboard                |
| `debate-live`       | `DebateLivePanel.tsx` (226 LOC)       |     7 | setInterval cleanup OK           |
| `debate-replay`     | `DebateReplayPanel.tsx` (326 LOC)     |     7 | Robust TimelinePlayer            |
| `debate-tournament` | `TournamentPanel.tsx` (387 LOC)       |     7 | mountedRef cleanup               |
| `strategy-builder`  | `DebateStrategyBuilder.tsx` (392 LOC) |     7 | Чистая архитектура               |

### Demo-stub панели (32 штуки) — единый шаблон

**Все 32 панели** имеют одинаковую структуру:

| Сигнал                                          | Результат |
| ----------------------------------------------- | --------- |
| `role="switch"` (дублированный inline `Toggle`) | 32/32     |
| `useTranslation` import                         | **0/32**  |
| Хардкод `SAMPLE_ARGUMENTS` с «Афина vs Гермес»  | 32/32     |
| Импорт реального сервиса                        | **0/32**  |
| Russian-only строки                             | 32/32     |

Полный список: `steelman`, `bayesian-judge`, `blind-eval`, `credibility`, `calibration`, `consistency`, `frame-tracker`, `stance-drift`, `insight-bus`, `entanglement`, `anchoring`, `meta-agent`, `outcome-forecaster`, `concept-blender`, `belief-mining`, `minimax-planner`, `expert-witness`, `rhetoric`, `bias-profiler`, `incentive-detector`, `stakeholder`, `scratchpad`, `persona-mixer`, `bop-tracker`, `got-deliberation`, `similarity`, `drift-detector`, `shadow-opponent`, `adversarial-source`, `vuln-targeting`, `justification`, `logical-form`.

### Feature creep

| Группа                                                                                 | Перекрытие                                |
| -------------------------------------------------------------------------------------- | ----------------------------------------- |
| 32 demo-stub ↔ `DebateQualityPanel`                                                    | Все настройки уже в quality-панели        |
| `stance-drift` ↔ `drift-detector`                                                      | Дубликаты концепции                       |
| `consistency` ↔ `justification` ↔ `logical-form`                                       | Триангуляция дублирования                 |
| `bop-tracker` ↔ `credibility` ↔ `bias-profiler`                                        | Оценка аргументов                         |
| `debate` / `debate-workspace` / `debates-manager` / `debate-history` / `debate-replay` | Пять nav-записей для past/present дебатов |

### Топ-5 проблем секции

1. **32 demo-stub панели коллективно** — консолидировать в `DebateQualityPanel` (1–2 dev-недели) или реализовать правильно (4–6 человеко-месяцев).
2. `DebatePanel/DebatePanel.tsx` (939 LOC) — over-complex, debug `console.log`.
3. `QualityImpactDashboard/QualityImpactDashboardPanel.tsx` (1201 LOC) — единственный файл >1000 LOC, нужен split.
4. `DebatePanel/DebateWorkspacePanel.tsx` — `void useTranslation()` + все строки на английском.
5. i18n регрессия по всем 32 templated-панелям.

---

## 10. Аудит панелей — Agents, System, Content (72 панели)

**72 панели · Средняя оценка 6.3 / 10 · 17 production · 22 ранний WIP · 2 stub**

### Самые сильные панели (score 9)

- `agents` — `AgentsPanelContainer.tsx` (контейнер/view split pattern, образцовый).
- `key-notes` — i18n + confirm + attachments + file preview.
- `connectors` — 8-файловая модульная структура, i18n, confirm.
- `memory` — AbortController, модульная структура.
- `docs-health` — AbortController, i18n, модульная.

### Production-ready (score ≥ 8)

`agents` (9), `key-notes` (9), `connectors` (9), `memory` (9), `docs-health` (9), `roles` (8), `sre` (8), `keys` (8), `groups` (8), `mcp` (8), `session-bindings` (8), `health` (8), `tools` (8), `cache` (8), `webhooks` (8), `rotations` (8).

### Сломанные / stub

| Panel         | Score | Проблема                                                              |
| ------------- | ----: | --------------------------------------------------------------------- |
| `openrouter`  |     3 | 29 LOC wrapper — должен быть merged с `keys`                          |
| `leaderboard` |     3 | 34 LOC wrapper вокруг `EloLeaderboard` из `AgentsPanel`               |
| `scheduler`   |     3 | ⚠️ **Захардкоженные русские mock-расписания** с фейковыми датами 2026 |
| `patterns`    |     4 | Статичный `INITIAL_NOTES`; create/edit/save отключены                 |
| `editors`     |     4 | Demo playground с захардкоженными данными                             |
| `playground`  |     4 | Custom fake `t()` map; overlaps с `ab-testing`                        |
| `aquarium`    |     4 | 882 LOC; **комментарий в коде подтверждает дублирование HealthPanel** |

### Топ-5 критических проблем секции

1. **`scheduler` (3/10)** — Hardcoded Russian mock schedules с fake 2026 датами; обманывает пользователя.
2. **`patterns` (4/10)** — Static `INITIAL_NOTES` constant; create/edit/save все disabled.
3. **`google-studio` (5/10)** — Читает input через `document.getElementById` вместо React state (антипаттерн, сломается).
4. **`service-registry` (5/10)** — 1391 LOC; `import.meta.glob` при module load; `eslint-disable` для set-state-in-effect.
5. **`smart-routing` (5/10)** — Ноль i18n; захардкоженный английский с эмодзи (`'Speed 🏎️'`).

### Feature creep

| Группа панелей                                                                          | Сейчас | Рекомендация                   |
| --------------------------------------------------------------------------------------- | ------ | ------------------------------ |
| 4 memory панели (`memory`, `memory-palace`, `federated-memory`, `memory-export-import`) | 4      | → 2                            |
| 4 research панели (`research-engine`, `-advanced`, `-gemini`, `-reports`)               | 4      | → 1 с табами                   |
| 4 provider-key панели (`keys`, `openrouter`, `groq-speed`, `nvidia-enterprise`)         | 4      | → 1 с фильтрами                |
| 4 health/pressure панели (`health`, `system-health`, `pressure`, `runtime-pressure`)    | 4      | → 2                            |
| 2 trivial stub (`openrouter`, `leaderboard`)                                            | 2      | → удалить                      |
| `aquarium`/`ecosystem`                                                                  | 2      | → удалить (дубликаты `health`) |

### Cross-cutting проблемы

- 250+ файлов используют inline `style={{}}`.
- A11y слабая: иконочные кнопки без `aria-label`, кликабельные `<div>` недоступны с клавиатуры.
- Mobile неподдерживается: нет media queries в большинстве панелей.
- `ComingSoonPanel` существует, но не используется — stubs ship fake UIs вместо него.
- 117 `console.*` statement'ов в 57 файлах.

---

## 11. Топ-10 проблем, требующих немедленного исправления

| #   | Проблема                                                                | Категория     | Усилие     | Влияние                                  |
| --- | ----------------------------------------------------------------------- | ------------- | ---------- | ---------------------------------------- |
| 1   | Удалить 47 МБ мусора в `docs/ocs/` и `docs/aaa.md`                      | Housekeeping  | 30 мин     | Уменьшит clone на 47 МБ, повысит доверие |
| 2   | Починить CI: 38 lint ошибок + `react-router-dom@7.18.0` + `vite@latest` | Build         | 1 день     | Разблокирует PR-мержи                    |
| 3   | Снести 32 demo-stub debate-панели или пометить `ComingSoonPanel`        | Feature creep | 1–2 недели | Уберёт фейковый UI                       |
| 4   | Реальная защита API-ключей (passphrase или server-side)                 | Security P0   | 1 неделя   | Закроет критическую уязвимость           |
| 5   | Sandbox: убрать `new Function()`, переписать на AST-интерпретатор       | Security P0   | 1 неделя   | Закроет RCE-риск                         |
| 6   | Удалить admin token или реализовать server-side auth                    | Security P1   | 3 дня      | Уберёт security theatre                  |
| 7   | Подключить `ComingSoonPanel` как fallback для stub-роутов               | UX P0         | 2 часа     | Уберёт runtime-краши                     |
| 8   | Аудит `ru.ts` на ломаный русский + 26 файлов с прямым `t` импортом      | i18n P0       | 1–2 дня    | Исправит i18n-регрессию                  |
| 9   | Расширить `wrapExternalData` на MCP `tools/list` и `tools/call`         | Security P1   | 1 день     | Закроет MCP prompt injection             |
| 10  | Убрать `build:unsafe`, вернуть sourcemaps, добавить `--coverage` в CI   | Build P1      | 1 день     | Улучшит debug и quality gate             |

---

## 12. Дорожная карта улучшений

### Спринт 1 (1–2 недели) — P0 cleanup

- [ ] Удалить `docs/ocs/` и `docs/aaa.md`
- [ ] Починить 38 lint-ошибок
- [ ] `npm install react-router-dom@^7.18.0 vite@latest`
- [ ] Убрать exclude тестов из `tsconfig.app.json`
- [ ] Подключить `ComingSoonPanel` как fallback для всех stub-роутов
- [ ] Снести 32 demo-stub debate-панели (или пометить ComingSoon)
- [ ] Снести `aquarium`, `ecosystem`, `openrouter`, `leaderboard` (явные дубликаты/stubs)
- [ ] Починить `scheduler` (убрать mock-расписания)
- [ ] Починить `patterns` (реализовать create/edit/save)
- [ ] Починить `google-studio` (заменить `document.getElementById` на React state)

### Спринт 2 (2–4 недели) — Security hardening

- [ ] Реальная защита API-ключей (passphrase-vault или server-side)
- [ ] Sandbox: убрать `new Function()`, AST-интерпретатор
- [ ] Удалить или заменить admin token на реальную auth
- [ ] Расширить MCP-санитизацию на `tools/list` и `tools/call`
- [ ] Webhook SSRF TOCTOU fix (IP-проверка перед POST)
- [ ] Унифицировать `isPrivateIP` с `cors-proxy.mjs`

### Спринт 3 (3–4 недели) — i18n и UX

- [ ] Полный аудит `ru.ts` на ломаные переводы
- [ ] Заменить 26 прямых `t`-импортов на `useTranslation()` hook
- [ ] Добавить i18n в панели с нулевым покрытием (32+ панелей)
- [ ] Мемоизировать тяжёлые list-row компоненты
- [ ] Добавить `aria-label` к иконочным кнопкам
- [ ] Focus trap во всех модалках

### Спринт 4 (4+ недели) — Архитектура и документация

- [ ] Перенести adapter-wiring из kernel в UI composition root
- [ ] Убрать исключение `service-registration/` из `.dependency-cruiser.cjs`
- [ ] Расщепить god-файлы (role-definitions.ts 3068 LOC и др.)
- [ ] MOCK-сервисы: feature-flag + «Demo mode» бейдж или удалить
- [ ] Сгенерировать метрики скриптом; обновить AGENTS.md/STRUCTURE.md
- [ ] Разбить AGENTS.md на инструкции + `docs/SESSION_LOG.md`
- [ ] Сгенерировать panel-map mermaid для 165 панелей
- [ ] Обновить `DEBT_REPORT.md` с реальными долгами
- [ ] Организовать `docs/` в поддиректории

### Долгосрочно (1–2 месяца) — Стратегические улучшения

- [ ] Миграция с inline-стилей на CSS Modules или Tailwind (10 468 блоков!)
- [ ] Мобильная адаптация top-20 самых используемых панелей
- [ ] Server-side auth (OAuth/OIDC + RBAC) если планируется multi-user
- [ ] Coverage thresholds поднять до 50%+ и rattling
- [ ] E2E тесты (Playwright) для критических user-flow: add key, send chat, run debate
- [ ] Понизить TypeScript до 5.9.x для совместимости с madge (убрать `legacy-peer-deps`)

---

## 13. Список детальных подотчётов

Полные детальные отчёты по каждому направлению доступны в `/home/z/my-project/audit/findings/`:

| Файл                                 |    Размер | Содержание                                                |
| ------------------------------------ | --------: | --------------------------------------------------------- |
| `01-architecture.md`                 |     41 КБ | Архитектура, DI, god-файлы, layer violation, антипаттерны |
| `02-security.md`                     |     59 КБ | P0-P3 уязвимости, attack scenarios, рекомендации          |
| `03-build-deps-tests.md`             |     51 КБ | Зависимости, lint, typecheck, coverage, Docker, CI        |
| `04-panels-debates.md`               |     41 КБ | Все 48 debate-панелей со score-таблицей и feature creep   |
| `05-panels-agents-system-content.md` |     51 КБ | Все 72 панели Agents/System/Content со score-таблицей     |
| `06-panels-dashboard-chat.md`        |     45 КБ | Все 17 панелей Dashboard/Chat с детальным анализом        |
| `07-ux-perf-docs.md`                 |     60 КБ | UX, a11y, performance, documentation                      |
| `worklog.md`                         | 430 строк | Журнал аудита (Task ID, шаги, summary каждого агента)     |

**Итоговый аудит (этот файл):** `/home/z/my-project/download/AUDIT_REPORT_ai-os-new.md`

---

## Заключение

`ai-os-new` — это **технически впечатляющий проект** с серьёзным ядром, продуманной DI-архитектурой, образцовой Docker-сборкой и нулём циклических зависимостей. Видна огромная проделанная работа.

Одновременно проект **страдает от четырёх системных проблем**:

1. **Feature creep**: 32 demo-stub debate-панели + 4 дублирующих memory/research/provider/health группы = ~50 nav-записей, которые выглядят настоящими, но не работают.
2. **Security theatre**: «зашифрованные» API-ключи с ключом рядом, admin token как обфускация, `new Function()` в sandbox при обещании AST.
3. **Documentation drift**: 4 манифеста дают 4 разных количества контрактов/сервисов/панелей; 47 МБ мусора в репо; AGENTS.md разбух до 1 634 строк.
4. **CI debt**: lint и security gates красные, покрытие 20%, depcruise правила мертвы, typecheck тестов отключён.

**Сводная оценка готовности к production: 5.5 / 10.** С фокусом на Спринт 1 + Спринт 2 (5–6 недель работы) оценка поднимется до 7.5–8.0. Для 9.0+ потребуется server-side auth, реальная защита ключей, mobile-адаптация и миграция со inline-стилей.

Главный совет: **не добавляйте новые панели**, пока не приведёте в порядок существующие. Консолидация важнее экспансии.
