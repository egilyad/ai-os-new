# Consolidated Fix Plan — SuperAgents OS

> Сведено из 5 аудитов: au1.md, Z.ai Report, audit2 (8 файлов), engineering-handbook (5 треков), deep-analysis
> Дата: 2026-07-31
> Статус сессий на момент сверки: Sessions 1–76 завершены (AGENTS.md)

---

## Как читать

- **P0** — блокирует релиз в production
- **P1** — важный дефект/улучшение
- **P2** — правильно иметь, но не срочно
- `[A]` — найдено в audit2, `[Z]` — Z.ai, `[M]` — au1.md, `[E]` — eng-handbook, `[D]` — deep-analysis
- `✓` — уже пофикшено в Sessions 1–76
- `S/M/L/XL` — оценка усилия (часы/дни/недели)

---

## P0 — Критические (делать первыми)

### Security

| #    | Задача                                                                                                                                                          | Аудиты      | Усилие   | Статус |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------- | ------ |
| P0.1 | **API-ключи в IndexedDB в plaintext** — vault выключен (`key-vault.ts:30-37`). Либо включить vault с passphrase, либо честно обновить README + red-warning в UI | All 5       | M (3-5d) | ❌     |
| P0.2 | **`new Function()` в sandbox worker** — нарушает дизайн-док (`002-worker-sandboxing.md`) и CSP. Переписать на AST-интерпретатор через meriyah                   | `[A][Z]`    | M (3-5d) | ❌     |
| P0.3 | **CI красный** — 38 lint errors (29 no-explicit-any) + 204 warnings + npm audit 6 vulns. Починить или временно `--max-warnings 250`                             | `[A][Z][E]` | S (1d)   | ❌     |
| P0.4 | **Admin token — не аутентификация, а обфускация** — `crypto.randomUUID()` в JS heap, читается любым кодом. Удалить для single-user или сделать server-side      | `[A][Z]`    | M (2-3d) | ❌     |
| P0.5 | **MCP `wrapExternalData` не санитизирует `tools/list` и `tools/call`** — prompt injection через MCP-сервер                                                      | `[A]`       | S (1d)   | ❌     |
| P0.6 | **Webhook SSRF TOCTOU** — HEAD-проверка URL, затем POST — между ними DNS может перебиндиться                                                                    | `[A]`       | S (4h)   | ❌     |

### Fake/Demo UI

| #     | Задача                                                                                                                                                                                                      | Аудиты | Усилие   | Статус |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------- | ------ |
| P0.7  | **32 debate-панели — demo-заглушки** (Steelman, BayesianJudge, BlindEval и др.) — одинаковый шаблон с SAMPLE_ARGUMENTS "Афина vs Гермес", 0 i18n, 0 импорта сервисов. Либо снести, либо пометить ComingSoon | `[A]`  | M (3-5d) | ❌     |
| P0.8  | **47 МБ мусора в репозитории** — `docs/ocs/erorrrrr*.md/txt`. `git rm -r docs/ocs/`                                                                                                                         | `[A]`  | S (30m)  | ❌     |
| P0.9  | **`ru.ts` содержит ломаный русский** — `'Раздел debates'`, `'Дебаты arena'`, чисто-английские значения                                                                                                      | `[A]`  | M (1-2d) | ❌     |
| P0.10 | **ComingSoonPanel существует (68 LOC), но не подключён ни к одному роуту** — stub-роуты падают в runtime                                                                                                    | `[A]`  | S (2h)   | ❌     |

### Architecture (god-objects)

| #     | Задача                                                                                                                | Аудиты      | Усилие   | Статус     |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ----------- | -------- | ---------- |
| P0.11 | **ChatExecutor ← singleton import promptSecurityService** — ломает тесты, архитектурный регресс. Перевести на DI/deps | `[M]`       | M (2-3d) | ❌         |
| P0.12 | **ServiceRegistryPanel 1391 строк** — split на 4 sub-components                                                       | `[A][Z][E]` | M (2-3d) | ❌         |
| P0.13 | **QualityImpactDashboardPanel 1201 строк** — split по типу метрик                                                     | `[A][Z][E]` | M (2-3d) | ❌         |
| P0.14 | **DashboardPanel 1088 строк, 21 хук** — split на OverviewCards, CostChart и т.д.                                      | `[A][Z][E]` | M (2-3d) | ❌         |
| P0.15 | **DebatePanel 938 строк, 42 хука** — extract hooks в custom (частично split в D-08, доделать)                         | `[A][Z][E]` | S (1d)   | ⚠️ partial |

---

## P1 — Высокий приоритет

### Тесты

| #     | Задача                                                                                                                                      | Аудиты   | Усилие   | Статус |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | ------ |
| P1.1  | **Покрыть stores тестами** — 0 тестов на 12 zustand-сторов. Приоритет: `useKeyStore`, `debateLiveStore`, `chat/store.ts`, `useSystemStatus` | All 5    | L (1w)   | ✅     |
| P1.2  | **Покрыть hooks тестами** — 0 тестов на 9 хуков. Приоритет: `usePoolStatus`, `useFocusTrap`, `useRoutingIntelligence`                       | All 5    | M (2-3d) | ✅     |
| P1.3  | **Покрыть debate-runtime тестами** — 6 тестов на 102 файла (5.9%). Цель: 30% на engine, llm-caller, metrics, interpreter, finalizer         | `[E][M]` | XL (2w)  | ❌     |
| P1.4  | **Покрыть memory subdir тестами** — 0 тестов на 10 файлов (7-store architecture)                                                            | `[E]`    | M (3-5d) | ❌     |
| P1.5  | **Покрыть key-management тестами** — 0 тестов на 11 файлов (security-critical)                                                              | `[E]`    | M (3-5d) | ❌     |
| P1.6  | **Покрыть LLM-провайдеры contract-тестами** — 1 из 9 имеет тест (gemini)                                                                    | `[E][Z]` | L (1w)   | ❌     |
| P1.7  | **Покрыть workers тестами** — memory.worker (237 строк) + sandbox.worker (372 строк) — 0 тестов                                             | `[E]`    | M (2-3d) | ❌     |
| P1.8  | **Настроить test coverage с threshold 30%** — `@vitest/coverage-v8` в devDeps, но не используется                                           | `[E][Z]` | S (2h)   | ✅     |
| P1.9  | **Добавить `--coverage` в CI test job**                                                                                                     | `[A]`    | S (1h)   | ✅     |
| P1.10 | **Добавить `dep-graph` job в CI: `npm run check:deps`**                                                                                     | `[A]`    | S (30m)  | ✅     |
| P1.11 | **Убрать exclude тестов из `tsconfig.app.json`** или создать `tsconfig.test.json`                                                           | `[A]`    | S (2h)   | ✅     |

### i18n

| #     | Задача                                                                                                                                                                     | Аудиты   | Усилие | Статус |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------ |
| P1.12 | **Namespace-разбить i18n файлы** — `en.ts:2826`, `ru.ts:2710` — монолит. Split на `nav.ts`, `common.ts`, `debate.ts`, `agents.ts`, `memory.ts`, `settings.ts`, `errors.ts` | `[E][Z]` | L (1w) | ✅     |
| P1.13 | **Заменить 26 прямых `t`-импортов на `useTranslation()`** — не ре-рендерятся при смене языка                                                                               | `[A]`    | S (4h) | ✅     |

### Architecture

| #     | Задача                                                                                                                                                                                         | Аудиты   | Усилие   | Статус                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | ----------------------------------------------------------------------- |
| P1.14 | **Разбить `debate-llm-caller.ts` (2729 строк)** — split на dispatcher + rate-backoff + token-tracker + facade                                                                                  | `[E][Z]` | M (3-5d) | ✅ 2729 → 1027 строк (7 модулей)                                        |
| P1.15 | **Разбить `memory-engine.ts` (996 строк)** — split на memory-cache + search-orchestrator + prune-scheduler + facade                                                                            | `[E]`    | M (2-3d) | ✅ 996 → 794 строк (5 модулей)                                          |
| P1.16 | **Разбить `key-service.ts` (1339 строк)** — facade уже есть, вынести логику в существующие key-management/*                                                                                    | `[E][Z]` | M (2-3d) | ✅ 1339 → 1083 строк (3 модуля)                                         |
| P1.17 | **Layer violation в service-registration** — `phase3-debate-runtime.ts` и `phase6-high-level.ts` импортируют adapter-фабрики из `src/stores/`. Исключение в `.dependency-cruiser.cjs` — убрать | `[A]`    | S (1d)   | ✅ DI-токены + UI-регистрация адаптеров (0 violations)                  |
| P1.18 | **8 `@deprecated MOCK` сервисов с UI-панелями** — deploy, fine-tuning, model-distillation, health-sla, provider-migration, sleep-engine. Либо feature-flag с бейджем "Demo", либо удалить      | `[A]`    | M (2-3d) | ✅ feature-flag `mockServices.enabled` + DemoBadge/DemoGate на 4 панели |
| P1.19 | **DAL не покрыт тестами** — 17 файлов, 0 тестов                                                                                                                                                | `[Z]`    | L (1w)   | ✅ 70 тестов (14 файлов) + фикс compound-index prune                    |

### UX/Performance

| #     | Задача                                                                                                  | Аудиты   | Усилие   | Статус                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1.20 | **Добавить streaming в live дебаты** — сейчас пользователь ждёт 30с+ без feedback                       | `[E]`    | L (1w)   | ✅ token-streaming через `streamMessage` + live-рендер в SpeakerNode                                                                                     |
| P1.21 | **Маркировать cognitive-aux панели (40 шт)** — production или research? JSDoc + UI badge "Experimental" | `[E]`    | S (1d)   | ✅ 27 панелей: `experimental` в RouteMeta + ExperimentalBadge (auto-render в routes.tsx) + JSDoc                                                         |     |
| P1.22 | **13 `React.memo` на 644 .tsx файла** — крайне мало. Мемоизировать 10 тяжёлых list-row компонентов      | `[A]`    | M (2-3d) | ✅ 10 list-row/card компонентов обернуты в React.memo (Connector, Bookmark, Note, Decision, Vital, JournalEntry, Memory, MCPServer, Tool, Agent)         |
| P1.23 | **Заменить 151 `console.log/.warn` на `LOGGER`** в production коде                                      | All 5    | M (2-3d) | ✅ `console.error`/`console.warn` в ключевых панелях (`DebateWorkspacePanel`, `DebateSidebar`, `DebateSessionHeader`, `ToolsPanel`) заменены на `LOGGER` |
| P1.24 | **Security headers в nginx** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options                       | `[E][A]` | S (4h)   | ✅ Настроены в `docker/nginx.conf` и `docker/nginx-ssl.conf` (X-Frame-Options, X-Content-Type-Options, CSP, HSTS)                                        |

### Build/Deps

| #     | Задача                                                                                                                             | Аудиты | Усилие  | Статус                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- | -------------------------------------------------------------------------------------- |
| P1.25 | **Audit / dependency update** — `npm audit fix` выполнен (fast-uri устранен, react-router оставлен из-за breaking downgrade в SPA) | `[A]`  | S (30m) | ✅ `npm audit fix` выполнен                                                            |
| P1.26 | **Удалить `build:unsafe` или переименовать в `build:skip-typecheck` с warning**                                                    | `[A]`  | S (15m) | ✅ переименован в `build:skip-typecheck` + stderr warning, README обновлён             |
| P1.27 | **`sourcemap: 'hidden'` + upload в Sentry/Datadog**                                                                                | `[A]`  | S (4h)  | ✅ `sourcemap:'hidden'` + `scripts/upload-sourcemaps.mjs` (no-op без кредов) + CI step |
| P1.28 | **Добавить Dependabot config** (`.github/dependabot.yml`)                                                                          | `[E]`  | S (30m) | ✅ npm + github-actions, weekly, ignores (react-router/zod/ts)                         |
| P1.29 | **Добавить `npm audit` step в CI** — сейчас `audit=false` в .npmrc                                                                 | `[E]`  | S (1h)  | ✅ security-audit job уже есть (`npm audit --audit-level=critical`)                    |

---

## P2 — Средний приоритет

### God-файлы (cleanup)

| #    | Задача                                                                                         | Аудиты | Усилие   | Статус |
| ---- | ---------------------------------------------------------------------------------------------- | ------ | -------- | ------ |
| P2.1 | Разбить `RolesPanel/TeamWizard.tsx` (1107 → 7 step-компонентов, orchestrator ~190 строк)       | `[E]`  | M (2-3d) | ✅     |
| P2.2 | Разбить `RolesPanel/RolesConsortiaPanel.tsx` (1066 → 4 таба + orchestrator)                    | `[E]`  | M (2-3d) | ✅     |
| P2.3 | Разбить `RolesPanel/RoleAnalytics.tsx` (1005 → orchestrator + 3 компонента)                    | `[E]`  | M (2-3d) | ✅     |
| P2.4 | Разбить `debate-engine.ts` (1278 → 800 строк, 3 модуля) — Facade + sub-orchestrators           | `[E]`  | L (1w)   | ✅     |
| P2.5 | Разбить `chat/store.ts` (1090 → 598 строк, 3 модуля) — event-handlers + send-message + helpers | `[E]`  | M (3-5d) | ✅     |
| P2.6 | Разбить `useKeyStore.ts` (542 → 220 строк, 3 модуля) — utils + init + orchestrator             | `[E]`  | S (1d)   | ✅     |

### Dead code / Consolidation

| #     | Задача                                                                                              | Аудиты   | Усилие |
| ----- | --------------------------------------------------------------------------------------------------- | -------- | ------ |
| P2.7  | Dead-code cleanup: removed `finalizeDebate` (deprecated) + `checkModelBlacklist` (annotated dead)   | `[A][E]` | S (2h) | ✅                                                                                 |
| P2.8  | 65 single-file component directories flattened → `src/components/`                                  | `[A]`    | L (1w) | ✅                                                                                 |
| P2.9  | 9 панелей задублированы как `.tsx` + директория — консолидировать                                   | `[A]`    | S (1d) | ⏭️ Non-issue (orchestrator+sub-components pattern from P2.1-P2.5, not duplication) |
| P2.10 | `ChatService` (40 строк) — wrapper без логики. Слить в ChatExecutor или дать ответственность        | `[E]`    | S (4h) | ✅                                                                                 |
| P2.11 | `cross-tab-lock-service.ts` vs `cross-tab-state.ts` — задокументировать границу или консолидировать | `[E]`    | S (2h) | ✅ Documented (separate concerns, no merge)                                        |

### Вынести definitions из кода

| #     | Задача                                                                             | Аудиты | Усилие   |
| ----- | ---------------------------------------------------------------------------------- | ------ | -------- |
| P2.12 | `role-definitions.ts` (3068 строк) → `src/data/`                                   | `[E]`  | S (4h)   | ✅  |
| P2.13 | `team-template-definitions.ts` (2397 строк) → `src/data/`                          | `[E]`  | S (2h)   | ✅  |
| P2.14 | `persona-definitions.ts` (2088 строк) → `src/data/`                                | `[E]`  | S (2h)   | ✅  |
| P2.15 | `debate-prompt-builder.ts` (1618 строк) — разбить по доменам + добавить versioning | `[E]`  | M (3-5d) | ✅  |

### UX

| #     | Задача                                                                     | Аудиты | Усилие   |
| ----- | -------------------------------------------------------------------------- | ------ | -------- |
| P2.16 | Реализовать drag-and-drop + undo/redo в Cognitive Builder                  | `[E]`  | L (1w)   |
| P2.17 | Smoke test для каждой из 165 панелей без тестов                            | `[E]`  | XL (2w)  |
| P2.18 | Адоптировать CSS-решение (CSS Modules или Tailwind) — план миграции        | `[A]`  | XL (2w+) |
| P2.19 | Проверить Dexie schema versioning и миграции                               | `[E]`  | S (1d)   |
| P2.20 | `MAX_MEMORY_ENTRIES = 1000` hard-coded → вынести в CONFIG                  | `[E]`  | S (2h)   | ✅  |
| P2.21 | Добавить HEALTHCHECK в Dockerfile                                          | `[E]`  | S (30m)  | ✅  |
| P2.22 | `isPrivateIP` не ловит IPv6 ULA и CGNAT — унифицировать с `cors-proxy.mjs` | `[A]`  | S (2h)   | ✅  |

### Documentation

| #     | Задача                                                                                                   | Аудиты   | Усилие  |
| ----- | -------------------------------------------------------------------------------------------------------- | -------- | ------- |
| P2.23 | Удалить `docs/aaa.md` (118 КБ, дубликат)                                                                 | `[A]`    | S (5m)  | ✅  |
| P2.24 | Разбить `AGENTS.md` — оставить инструкции (100 строк), вывести historical notes в `docs/SESSION_LOG.md`  | `[A][E]` | S (2h)  | ✅  |
| P2.25 | Синхронизировать метрики (contracts, services, panels) между AGENTS.md, STRUCTURE.md, SYSTEM_MANIFEST.md | `[A]`    | S (2h)  | ✅  |
| P2.26 | Сгенерировать panel-map mermaid из route-registry-core.ts                                                | `[A]`    | S (4h)  | ✅  |
| P2.27 | `DEBT_REPORT.md` устарел — переписать, убрав закрытые задачи                                             | `[A]`    | S (1d)  | ✅  |
| P2.28 | Задокументировать federated memory статус (работает или заглушка)                                        | `[E]`    | S (30m) | ✅  |

---

## P3 — Низкий приоритет / Nice-to-have

| #     | Задача                                                                                | Аудиты | Усилие   |
| ----- | ------------------------------------------------------------------------------------- | ------ | -------- |
| P3.1  | Понизить TypeScript до `~5.9.x` для совместимости с madge (убрать `legacy-peer-deps`) | `[A]`  | M (2-3d) | ⏭️ Skip |
| P3.2  | Удалить dead code: `ComingSoonPanel`, `ABTest`, `Editors` если не используются        | `[E]`  | S (1d)   | ⏭️ Skip |
| P3.3  | `@ts-ignore` / `@ts-expect-error` — 3 шт, починить                                    | `[E]`  | S (2h)   | ✅      |
| P3.4  | Federated memory — если заглушка, удалить или честно пометить                         | `[E]`  | S (1d)   | ✅      |
| P3.5  | Memory palace + sleep engine — проверить usage, возможно dead code                    | `[E]`  | S (2h)   | ⏭️ Skip |
| P3.6  | A11y аудит Sidebar + иконочные кнопки без `aria-label`                                | `[E]`  | M (2-3d) |
| P3.7  | Расширить commitlint (scope-enum, subject-case)                                       | `[E]`  | S (30m)  |
| P3.8  | Audit `ws` usage — где используется WebSocket?                                        | `[E]`  | S (2h)   |
| P3.9  | Добавить `engines.npm` + `engine-strict=true` в .npmrc                                | `[E]`  | S (15m)  |
| P3.10 | `cachedFrozenState` инвалидация — замерить, возможно group-invalidate                 | `[E]`  | S (1d)   |

---

## Сводка

| Приоритет | Кол-во | Суммарное усилие  |
| --------- | ------ | ----------------- |
| **P0**    | 15     | ~30-40 дней       |
| **P1**    | 29     | ~45-60 дней       |
| **P2**    | 28     | ~40-50 дней       |
| **P3**    | 10     | ~10-15 дней       |
| **Итого** | **82** | **~125-165 дней** |

---

## Примечания

1. **P0.1 (plaintext keys)** — самый contentious. Аудиты разделились: `[A]` кричит "P0 security", но `[M]` и `[E]` дают 4/10 и 5.5/10 именно из-за этого. Решение: быстрый путь (обновить README + warning) за 2h, правильный (passphrase vault) за 3-5d.
2. **P0.7 (32 stubs)** — `[A]` единственный, кто это нашёл. Но проблема реальная: пользователь видит фейковый UI. Решение: снести все 32 и оставить DebateQualityPanel.
3. **Многое уже пофикшено** — Sessions 1-76 закрыли ~100+ проблем. Этот план только про НЕзакрытое.
