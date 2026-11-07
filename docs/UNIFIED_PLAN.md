# SuperAgents OS — Единый план работ (сводный)

> Сводка всех открытых задач из четырёх источников:
> 1. `ai-os-new-readiness-report.md` (полный аудит, 83 КБ, 2026-11-06)
> 2. `ai-os-new_readiness_report.md` (операционный аудит, 24 КБ, 2026-11-07)
> 3. `docs/arhive-research/новое/New folder/` (роадмапы/SPEC/статус реализации, 2026-10-31)
> 4. Wiki: `deferred-works-features.md` + `dev-status-debt.md` (+ связанные dev-status-*)
>
> Обновлён: 2026-11-07. Легенда: ✅ сделано · 🟡 частично/каркас · ❌ не начато.

---

## 0. Что уже закрыто (не включается в план)

| Задача | Источник |
|---|---|
| KeyVault fail-closed + passphrase-UI (`VaultSettingsModal`) | SPEC_01, P0-#1/#3 |
| GovernanceService `evaluate` default-deny | SPEC_08, P0-#7 |
| KeyStateStore: единый KV-ключ + миграция legacy | P0-#6 |
| `Container`: уничтожение transient-инстансов в `clear()` | P1-#15 |
| ReDoS-защита пользовательских regex (`isReDoSPattern`) | P2-#26, W6-023 |
| Типизированный `flattenFeatureFlags()` (feature-flag UI) | P2-#25, W6-018 |
| `isStaleSessionWrite` guard единый для storage+DAL | W6-011 |
| `CacheService` persist по `maxEntries` (не 500) | опер. отчёт 2.1 |
| Локальная атомарность `LocalSecretStore` (batchSetKv) | опер. отчёт 2.1 |
| Сериализованный writer + WAL в `CheckpointStore` | опер. отчёт 2.1 |
| Статьи Wiki для 58 техник + 8 панелей без документации | P1-#14, Accessibility |
| Fix генераторов: poolCatalog/techniqueComponents (docs-in-sync) | CI-#1424 |
| Перегенерирован `dev-tests-catalog` (624 теста; 52 stable-пути) | опер. отчёт |
| Тесты `session-write-guard` + фикс flaky `browser-use-service` | опер. отчёт 2.3 |
| CI-гейты (tsc -b, lint, docs-in-sync, audit, coverage, e2e, deploy needs) | опер. отчёт 3.2 |
| Dependabot (`npm audit` в CI) | опер. отчёт 3.11 |
| Заглушки dev-status-*.md заполнены | опер. отчёт 3.9 |
| DI-регистрация `agentRuntime`/`evalHub` (phase82) | SPEC_05/04, «осталось» |
| `ProviderEmbeddingService` (реальный бэкенд) | SPEC_02, «осталось» |
| Dedup `streamMessage` в CacheDecorator (in-flight) | P1-5, W6-039 |
| Метрики памяти: `memory:searched` → search_total/hits/latency | P1-12 |
| KeyUsageAnalyticsPanel подключена к metricsService (`RuntimeMetricsView`) | P1-11 |
| `.nvmrc` (Node 22) + pre-commit хуки подтверждены | QW-7/8 |

---

## 1. Приоритет P0 — безопасность и целостность (критично)

| # | Задача | Статус | Источник |
|---|---|---|---|
| P0-1 | Полная интеграция passphrase-vault с `key-service`: заменить deviceKey на passphrase, ключи в IndexedDB только зашифрованными | ✅ | полный отчёт §4.5; SPEC_01 |
| P0-1a | Проверено: `KeyRegistry.saveKeys` → `encryptAllKeys`, load → `decryptAllKeys`, vault reconcile, миграция plaintext→encrypted | ✅ | SPEC_01 |
| P0-2 | Multi-tenant server-скоупинг: per-company secret вместо общего `SYNC_SECRET`, WS cross-tenant isolation | ❌ | полный отчёт P0-#2; W2-009/W8-003 |
| P0-3 | CSAM/модерация изображений (внешний API) | ❌ | полный отчёт P0-#4; W7-UGC-009 |
| P0-4 | Prompt-versioning: 156 unversioned «You are…» → версии/A-B/rollback | ❌ | W4-041; dev-status-debt |

## 2. Приоритет P1 — качество кода и тесты

| # | Задача | Статус | Источник |
|---|---|---|---|
| P1-1 | Тесты для observability: metrics/monitoring/timeline/trace/admin/causal-timeline | 🟡 (metrics ✅, monitoring ✅, timeline ✅, causal-timeline ✅) | полный отчёт P1-#11 |
| P1-2 | Тесты для key-management: KeyService/KeyStateStore/GroupManager/SessionAffinity/Rotation/KeyIntelligence | 🟡 (KeyStateStore ✅, Rotation ✅) | полный отчёт P1-#12 |
| P1-3 | Тесты для bootstrap/kernel/runtime/bootstrap-phases | ❌ | полный отчёт P1-#13 |
| P1-4 | Тесты для «голых» модулей: CognitiveService/Orchestration/LlmCrewExecutor/CouncilPort/GraphPort/Audit/Governance/FleetMonitor/ToolGovernance/SandboxService/service-helper | ❌ | ROADMAP_00 Фаза 0 |
| P1-5 | Dedup `streamMessage` в CacheDecorator (in-flight) | ✅ | W6-039; dev-status-debt |
| P1-6 | Singleton `ArgumentGraphService` → per-session instance | ❌ | W6-014 |
| P1-7 | Retrieval: O(N) сканы → индексы (W8-012/013/014/015) | ❌ | dev-status-debt |
| P1-8 | Включить SemanticRouter/CanaryRouter/CompressRoute в default-chain | ❌ | ROADMAP_00 Фаза 1 |
| P1-9 | Убрать дублирование RouterRankingService vs KeyStateStore | ❌ | ROADMAP_00 Фаза 1 |
| P1-10 | Data-driven список провайдеров в дебатах (не жёсткий список) | ❌ | ROADMAP_00 Фаза 1 |
| P1-11 | KeyUsageAnalyticsPanel → `useMetrics` | ✅ | IMPLEMENTATION_STATUS «осталось» |
| P1-12 | Метрики памяти (search_latency/hit_rate) в MemoryService | ✅ | IMPLEMENTATION_STATUS «осталось» |
| P1-13 | Dexie migration test до v43 | ❌ | полный отчёт P1-#19 |
| P1-14 | Fix 16 дубликатов имён событий в event-registry | ❌ | полный отчёт P1-#14 |
| P1-15 | `registerTransient` cleanup | ✅ | полный отчёт P1-#15 |
| P1-16 | Race conditions (6): CheckpointStore/DebateEngine/AutoDebate/MemoryEngine/Scheduler | 🟡 | полный отчёт P1-#16 |
| P1-17 | Perf hot-paths (10): memory O(n²), syncSessions, embedding batch, VisGraph и др. | ❌ | полный отчёт P1-#17 |

## 3. Приоритет P2 — продукт и UX

| # | Задача | Статус | Источник |
|---|---|---|---|
| P2-1 | Builder: интеграция killer-сервисов (crystal/synthesis/lens/time-machine) | ❌ | Gap Map §3; P1-#8 |
| P2-2 | Round-trip export/import для 9 панелей | ❌ | Gap Map §4; Opportunity |
| P2-3 | Vertical-консолидация: 5 budget → BudgetHub; 4 health → HealthPanel; 6 research | ❌ | Duplication Map; P3-#32/33/34 |
| P2-4 | Рефакторинг 62 TechniquePanels → generic-панель | ❌ | Tech Map §5.6; Duplication |
| P2-5 | WikiPanel «Create article» UI; DebateArena «Save as Crystal» | ❌ | Opportunity Map |
| P2-6 | Settings search + autocomplete в Wiki; tooltips | ❌ | Gap Map §7; Opportunity |
| P2-7 | Cross-panel navigation links (ROI 32) | ❌ | Opportunity Map |
| P2-8 | Скрыть Optional/Experimental/Stub-панели из main nav; cognitive overload | ❌ | Value/Accessibility Map |
| P2-9 | Команда «what can you do?» у Assistant; onboarding killer-фич | ❌ | Accessibility Map §3.4 |
| P2-10 | Объединить/скрыть HealthSlaPanel и 5 @deprecated MOCK сервисов | ❌ | Dead Map; Obs Map §3.1 |
| P2-11 | Lazy-загрузка CommandPalette/TECHNIQUE_PANEL_COMPONENTS; framer-motion 165 файлов | ❌ | Res Map §3.1 |
| P2-12 | Убрать 97 ручных setError → useAutoClearError | ❌ | Duplication Map |
| P2-13 | eventBus cleanup audit (42 listeners) | ❌ | Opportunity Map |

## 4. Приоритет P3 — платформа

| # | Задача | Статус | Источник |
|---|---|---|---|
| P3-1 | Плагинный sandbox для сторонних плагинов + динамические маршруты `contributes.panels` | 🟡 | SPEC_06 §5 |
| P3-2 | Мультиклиентная федерация (A2A довести до мультиtenant) | 🟡 | SPEC_09/10 |
| P3-3 | Серверный командный режим (multi-user/tenant) | 🟡 | SPEC_10 |
| P3-4 | Автономный супервизор флота (Fleet → не только projection) | ❌ | ROADMAP_00 Фаза 2; полный отчёт |
| P3-5 | Декомпозиция hotspots: dexie-schema (3764 LoC), event-registry (2555 LoC), sandbox, key-service | ❌ | Tech Map §6; полный отчёт P3-#35/36 |
| P3-6 | Переименовать rivals/ → experimental/ (19 подкаталогов) | ❌ | Duplication/Dead Map |
| P3-7 | Внешний security audit sandbox-interpreter | ❌ | Tech Map §6 |
| P3-8 | External observability (Sentry/Prometheus/Grafana) | ❌ | полный отчёт P3-#38 |

## 5. Открытые «быстрые победы» (Quick Wins)

| # | Задача | Источник |
|---|---|---|
| QW-1 | Coverage threshold в CI (порог уже есть — поднять/расширить include) | Tech Map §9.4 |
| QW-2 | Снизить lint baseline (5600) — плановая чистка raw colors/set-state-in-effect | Tech Map §3.5 |
| QW-3 | E2E для SRE/Health/Diagnostics | Roadmaps |
| QW-4 | Визуальная регрессия панелей (Playwright snapshots) | Roadmaps |
| QW-5 | a11y: axe-тесты ключевых панелей, focus-trap | опер. отчёт 3.7 |
| QW-6 | Бенчмарк-пороги на горячих путях | опер. отчёт 3.6 |
| QW-7 | Проверить pre-commit хуки (lint-staged) реально гоняются | ✅ опер. отчёт 3.10 |
| QW-8 | `.nvmrc` / фиксация Node 22 | ✅ опер. отчёт 3.10 |

---

## 6. Рекомендуемый порядок исполнения

1. **P0-1 → P0-2 → P0-4** (безопасность; P0-3 требует внешнего API — отдельно).
2. **P1-1 → P1-3 → P1-4** (тесты ядра — быстро добавляют доверие и CI-покрытие).
3. **P1-11 → P1-12** (мелкие интеграции метрик — 1-2 часа).
4. **P1-5 → P1-6 → P1-9 → P1-14** (точечные фиксы).
5. **QW-3 → QW-5 → QW-1** (CI/E2E/a11y).
6. Затем по остаточному приоритету P2 → P3.

> Правило из вики: крупная небезопасная работа без локального прогона
> тестов/typecheck в «вслепую» не делается — только с CI-прогоном.
