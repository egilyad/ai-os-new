# SuperAgents OS — Единый план работ (сводный)

> Сводка всех открытых задач из четырёх источников:
> 1. `ai-os-new-readiness-report.md` (полный аудит, 83 КБ, 2026-11-06)
> 2. `ai-os-new_readiness_report.md` (операционный аудит, 24 КБ, 2026-11-07)
> 3. `docs/arhive-research/новое/New folder/` (роадмапы/SPEC/статус реализации, 2026-10-31)
> 4. Wiki: `deferred-works-features.md` + `dev-status-debt.md` (+ связанные dev-status-*)
>
> Обновлён: 2026-11-07. Легенда: ✅ сделано · 🟡 частично/каркас · ❌ не начато.

---

## 0. Статус выполнения

> Обновлено: 2026-11-07 (многосессионная работа по плану).

| Группа | Статус |
|---|---|
| P0 (безопасность) | `P0-1/2/3/6/7` ✅ (vault, multi-tenant server-секреты + WS-скоупинг, governance fail-closed, KeyStateStore, миграция). Осталось: `P0-3` (CSAM — нужен внешний API), `P0-4` (prompt-versioning). |
| P1 (качество/тесты) | `P1-1` ✅ (observability: metrics/monitoring/timeline/trace/admin/causal-timeline). `P1-2` ✅ (KeyService: 13 юнит-тестов на полном моке deps; покрыты KeyStateStore, GroupManager, Rotation, KeyIntelligence, SessionAffinity, KeyFingerprints, KeyQuotas, KeyModels, KeyAlerts, KeyStatus, KeyPoolSelector). `P1-3` ✅ (kernel/runtime/bootstrap smoke). `P1-4` 🟡 (покрыты service-helper, Audit, Governance, FleetMonitor, ToolGovernance, llm-bridge порты, SandboxService.fetchUrl, utils: constant-time/Outbox/hash/embedding/provider-fleet-health; осталось: SandboxService execute, Cognitive/Orchestration уже имеют тесты). `P1-5` ✅ (streamMessage dedup). `P1-6` ✅ (ArgumentGraphService per-session: sessionId во всех методах IArgumentGraphService, изоляция состояния по сессиям, обновлены потребители — entanglement/anchoring/vulnerability/minimax/meta-agent + панели; новые тесты изоляции в test:stable). `P1-11/12` ✅. `P1-14` — алиасы событий (не баг), фикс отложен. `P1-15` ✅. |
| P2 | 🟡 (P2-13 ✅, P2-11 ✅, P2-12 ✅, P2-6 ✅, P2-7 ✅; остальное: Builder killer-services, round-trip, консолидация панелей, etc.). |
| P3 | 🟡 (P3-5 ✅; не начато: плагинный sandbox, федерация, серверный режим). |
| Quick Wins | ✅ QW-3/4 частично, QW-7/8 ✅, QW-1 ✅; QW-2/5/6 ❌ (требуют прогона инструментов). |
| Тестовая база | 661 тест, 91 стабильный путь (test:stable) — рост с 623/50. |

### Рекомендуемый следующий курс
1. `P1-2 KeyService` ✅ — закрыт (13 юнит-тестов, 2026-11-07).
2. `P1-6` ✅ — закрыт (per-session ArgumentGraphService, 2026-11-07).
3. `P0-2` ✅ — закрыт (per-company секреты + WS-скоупинг; legacy SYNC_SECRET как fallback, 2026-11-08).
4. `P2-12` ✅ — закрыт (97 ручных setError → useAutoClearError; `autoClearMs: null` для стойких ошибок, 2026-11-08).
5. Затем P2 (UI/продукт) и P3.
6. `P3-5` ✅ — закрыт (декомпозиция dexie-schema + key-service, 2026-11-08).
7. `P2-2` остаток — импорт дебатов/топологий ✅ (2026-11-09); осталась UI-мелочь «панельные кнопки local-first».

---

## 0a. Что уже закрыто (не включается в план)

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
| DI-цикл orchestrator (timeMachineService→snapshotService→orchestrator) — ленивый геттер в snapshotService + регрессионный boot-smoke-тест | рантайм, 2026-11-08 |

---

## 1. Приоритет P0 — безопасность и целостность (критично)

| # | Задача | Статус | Источник |
|---|---|---|---|
| P0-1 | Полная интеграция passphrase-vault с `key-service`: заменить deviceKey на passphrase, ключи в IndexedDB только зашифрованными | ✅ | полный отчёт §4.5; SPEC_01 |
| P0-1a | Проверено: `KeyRegistry.saveKeys` → `encryptAllKeys`, load → `decryptAllKeys`, vault reconcile, миграция plaintext→encrypted | ✅ | SPEC_01 |
| P0-2 | Multi-tenant server-скоупинг: per-company secret вместо общего `SYNC_SECRET`, WS cross-tenant isolation | ✅ (per-company секреты в company-store (хеш SHA-256, set/rotate/verify), verifyWsUpgradeCompanyHash в ws-auth, привязка `companyId` к WS-соединению в sync-server verifyClient; legacy `SYNC_SECRET` сохранён как fallback; тесты) | полный отчёт P0-#2; W2-009/W8-003 |
| P0-3 | CSAM/модерация изображений (внешний API) | ❌ | полный отчёт P0-#4; W7-UGC-009 |
| P0-4 | Prompt-versioning: 156 unversioned «You are…» → версии/A-B/rollback | ✅ (версии + rollback: prompt-store автофиксирует версию при setPrompt (50/роль), rollback в PromptsTab и PromptVersionPanel; PromptVersionService.rollbackTo. A/B по версиям: ABTestPanel получил режим «Compare prompt versions» (promptB в ABTestRequest, runABTest шлёт разные версии на одной модели) | W4-041; dev-status-debt |

## 2. Приоритет P1 — качество кода и тесты

| # | Задача | Статус | Источник |
|---|---|---|---|
| P1-1 | Тесты для observability: metrics/monitoring/timeline/trace/admin/causal-timeline | ✅ | полный отчёт P1-#11 |
| P1-2 | Тесты для key-management: KeyService/KeyStateStore/GroupManager/SessionAffinity/Rotation/KeyIntelligence | ✅ (KeyService ✅, KeyStateStore ✅, GroupManager ✅, Rotation ✅, KeyIntelligence ✅, SessionAffinity ✅, KeyFingerprints ✅, KeyQuotas ✅, KeyModels ✅, KeyAlerts ✅, KeyStatus ✅, KeyPoolSelector ✅) | полный отчёт P1-#12 |
| P1-3 | Тесты для bootstrap/kernel/runtime/bootstrap-phases | 🟡 (kernel ✅, runtime ✅, bootstrap ✅) | полный отчёт P1-#13 |
| P1-4 | Тесты для «голых» модулей: CognitiveService/Orchestration/LlmCrewExecutor/CouncilPort/GraphPort/Audit/Governance/FleetMonitor/ToolGovernance/SandboxService/service-helper | 🟡 (service-helper ✅, Audit ✅, Governance ✅, FleetMonitor ✅, ToolGovernance ✅, LlmCrewExecutor/CouncilPort/GraphPort/Frontier/Persona ✅, SandboxService ✅ (fetchUrl + execute: worker success/error/timeout, tool allow/deny/rate-limit — 10 тестов), constant-time/Outbox ✅, provider-fleet-health ✅, hash/embedding ✅, topic-suggestions ✅, builder-bridge ✅, skill-market ✅, hierarchy ✅, sandbox-broker ✅) | ROADMAP_00 Фаза 0 |
| P1-5 | Dedup `streamMessage` в CacheDecorator (in-flight) | ✅ | W6-039; dev-status-debt |
| P1-6 | Singleton `ArgumentGraphService` → per-session instance | ✅ (sessionId во всех методах, изоляция состояния, тесты) | W6-014 |
| P1-7 | Retrieval: O(N) сканы → индексы (W8-012/013/014/015) | ⏭️ ПРОПУЩЕНО по решению пользователя | dev-status-debt |
| P1-8 | Включить SemanticRouter/CanaryRouter/CompressRoute в default-chain | 🟡 (CompressRoute ✅ включён в default-chain adapter-factory (`compress` config, default true, opt-out false; бережёт tool-call payloads, 2026-11-09); SemanticRouter/CanaryRouter остаются явно opt-in — требуют кросс-провайдерных таргетов (fast/powerful, canary policy), безопасного глобального дефолта нет) | ROADMAP_00 Фаза 1 |
| P1-9 | Убрать дублирование RouterRankingService vs KeyStateStore | ✅ (health-предикат ключа вынесен в единый `keyStateHealthy()` — раньше был продублирован в 3 местах с риском дрейфа; семантика без изменений) | ROADMAP_00 Фаза 1 |
| P1-10 | Data-driven список провайдеров в дебатах (не жёсткий список) | ✅ (DEBATE_MODEL_PRIORITY строится из PROVIDER_PREFERRED_MODELS (база) + дебатные пины; неизвестный провайдер использует живые availableModels в pickBestModelForDebate) | ROADMAP_00 Фаза 1 |
| P1-11 | KeyUsageAnalyticsPanel → `useMetrics` | ✅ | IMPLEMENTATION_STATUS «осталось» |
| P1-12 | Метрики памяти (search_latency/hit_rate) в MemoryService | ✅ | IMPLEMENTATION_STATUS «осталось» |
| P1-13 | Dexie migration test до v43 | ✅ (тест версий переписан под v43 (5 кейсов): порядок, покрытие v5..v43, проектные таблицы, отсутствие дропов между версиями, соответствие Table-деклараций; включён в test:stable/coverage. Заодно устранён риск потери данных: карты таблиц аккумулированы по версиям (v35+ не дельта, а полный набор — WARN о дропах исчезли из логов)) | полный отчёт P1-#19 |
| P1-14 | Fix 16 дубликатов имён событий в event-registry | ❌ | полный отчёт P1-#14 |
| P1-15 | `registerTransient` cleanup | ✅ | полный отчёт P1-#15 |
| P1-16 | Race conditions (6): CheckpointStore/DebateEngine/AutoDebate/MemoryEngine/Scheduler | ✅ (CheckpointStore ✅ (merge при init); 2.1 DebateEngine resume-during-pause ✅ — пер-сессионные run-промисы, re-entrant resume ждёт teardown; 2.2 AutoDebate ✅ — single-flight + destroy ждёт pending; 2.3 MemoryEngine ✅ — worker-publish только в onCommit (нет dangling при rollback), включая storeBatch; 2.4 MemoryOrchestrator.summarizeRecent ✅ — single-flight mutex; 2.5 Scheduler ✅ — trigger ждёт in-flight, destroy ждёт запуски; 2.6 MemoryWorkerClient осталась на проверке полноты) | полный отчёт P1-#16 |
| P1-17 | Perf hot-paths (10): memory O(n²), syncSessions, embedding batch, VisGraph и др. | 🟡 (сделано 2026-11-09: syncSessions ✅; searchAdvanced ✅; computeEngineStats ✅; embedding batch rate-limit ✅; WS broadcast backpressure ✅ — пропуск клиентов с bufferedAmount >1MiB в broadcastLive. Остаток: VisGraph, VectorSpace.match, cost recording, heartbeat batch, stream chunk rAF, chat send serial awaits) | полный отчёт P1-#17 |

## 3. Приоритет P2 — продукт и UX

| # | Задача | Статус | Источник |
|---|---|---|---|
| P2-1 | Builder: интеграция killer-сервисов (crystal/synthesis/lens/time-machine) | ✅ (узлы crystal/synthesis/lens/time-machine открыты в каталоге (exposed) + палитра; рантайм-диспетчер в orchestration-service (executeCrystalNode/executeSynthesisNode/executeLensNode/executeTimeMachineNode) через DI getOptional; NodeType расширен; i18n en/ru) | Gap Map §3; P1-#8 |
| P2-2 | Round-trip export/import для 9 панелей | 🟡 (импорт включён для всех 9 секций: prompts, workflows, roles, crystal, keys/memory/agents/settings (были), **debates** (сессии+вердикты, skip существующих id — DebateStore.importSessions/importVerdicts, 2026-11-09), **topologies** (mount импортированной топологии); остаток: панельные кнопки local-first (UI-мелочь), timeline/оверрайды вне round-trip) | Gap Map §4; Opportunity |
| P2-3 | Vertical-консолидация: 5 budget → BudgetHub; 4 health → HealthPanel; 6 research | ✅ (BUDGET ✅: BudgetHub на /budget (Overview/Alerts/Optimization). HEALTH ✅: HealthHub на /health (Health/System Zones), HealthSla скрыт ранее. RESEARCH ✅: ResearchHub на /research-engine (Engine/Advanced/Reports/Cockpit/Hypotheses/System). Старые роуты сохранены) | Duplication Map; P3-#32/33/34 |
| P2-4 | Рефакторинг 62 TechniquePanels → generic-панель | ✅ (создан generic TechniquePanel (techniqueId+category); TECHNIQUE_PANEL_COMPONENTS переведён на ленивую фабрику lazyTechnique — один общий чанк вместо 58 почти идентичных; NAV_ITEMS без изменений; оригинальные 58 файлов сохранены для последующего удаления) | Tech Map §5.6; Duplication |
| P2-5 | WikiPanel «Create article» UI; DebateArena «Save as Crystal» | ✅ (Wiki: кнопка «+ Создать статью», редактор (title/slug/section/tags/body markdown), сохранение в localStorage (wiki.userArticles.v1), мёрж в getArticle/articlesBySection/search (getAllArticles); Debate: кнопка «Save as Crystal» в VerdictActionButtons (propose+validate с защитой от дублей по originId=session.id), ключи i18n en/ru) | Opportunity Map |
| P2-6 | Settings search + autocomplete в Wiki; tooltips | ✅ (Settings search через filterOptions + tooltips/описания ко всем 13 табам (en/ru); Wiki autocomplete — chip-подсказки через searchWikiQuick при вводе) | Gap Map §7; Opportunity |
| P2-7 | Cross-panel navigation links (ROI 32) | ✅ (CrossPanelLinks интегрирован в 10 панелей: Settings, ResearchEngine, Scheduler, Issues, Costs, Governance, Fleet, Groups, Knowledge; curated-пары + same-section siblings; общий хук useNavItems) | Opportunity Map |
| P2-8 | Скрыть Optional/Experimental/Stub-панели из main nav; cognitive overload | ❌ | Value/Accessibility Map |
| P2-9 | Команда «what can you do?» у Assistant; onboarding killer-фич | ❌ | Accessibility Map §3.4 |
| P2-10 | Объединить/скрыть HealthSlaPanel и 5 @deprecated MOCK сервисов | ✅ (скрыты из NAV: health-sla, model-distillation, deploy (роуты по прямому URL рабочие); DemoGate fail-unsafe исправлен `?? true` → `?? false` (W3-030); полное удаление MOCK-сервисов отложено) | Dead Map; Obs Map §3.1 |
| P2-11 | Lazy-загрузка CommandPalette/TECHNIQUE_PANEL_COMPONENTS; framer-motion 165 файлов | ✅ (CommandPalette + OnboardingWizard → React.lazy/Suspense; TECHNIQUE_PANEL_COMPONENTS уже lazy + PanelLoader; framer-motion 165 файлов — отдельная долгая миграция) | Res Map §3.1 |
| P2-12 | Убрать 97 ручных setError → useAutoClearError | ✅ (переведено ~95 файлов; `useAutoClearError` получил `autoClearMs: number \| null` — `null` = стойкая ошибка для операций с потерей данных/денег/статуса: VaultSettingsModal, CostsPanel, IssuesPanel, ApprovalsPanel, SchedulerPanel, GroupsPanel, AgentTasksPanel, useBulkImport, AdaptersPanel, PortabilityPanel; остальные — Toast 8с. Пропущены намеренно: панели с error через пропсы/контекст (AddConnectionStep, DebateSessionHeader, AddKeyModal, AgentsPanelView), data-массивы (IntelligenceGraph, ActivitiesPanel, WebsitePreview), PerformanceProfilerPanel (setError не вызывается), тест useDebatePanelSubscriptions) | Duplication Map |
| P2-13 | eventBus cleanup audit (42 listeners) | ✅ (аудит: EventBus/сервисы/компоненты чистят подписки; добавлен тест жизненного цикла подписок event-bus-cleanup) | Opportunity Map |

## 4. Приоритет P3 — платформа

| # | Задача | Статус | Источник |
|---|---|---|---|
| P3-1 | Плагинный sandbox для сторонних плагинов + динамические маршруты `contributes.panels` | ✅ (реестр contributed panels; маршруты `/plugin/<id>` + sandboxed iframe (allow-scripts); сайдбар; PluginManager/PluginMarketplace с установкой/удалением из каталога; permission enforcement (enforceToolPermissions); worker-изоляция; каталог демо-плагинов + тесты валидности (53/53 плагинных тестов зелёные) — 2026-11-09) | SPEC_06 §5 |
| P3-2 | Мультиклиентная федерация (A2A довести до мультиtenant) | ✅ (мультиtenant-изоляция A2A/федерации; координация; транспорт; UI-скоуп в InteropPanel (tenant-фильтр + addPeer scoped), 6 tenant-тестов, 2026-11-09) | SPEC_09/10 |
| P3-3 | Серверный командный режим (multi-user/tenant) | 🟡 (командный режим ✅ — члены компаний (roles admin/operator/viewer) в company-store + REST endpoints (GET/POST /api/companies/:id/members, DELETE /members/:memberId) под hasAuth + события broadcastLive; node:test 8 кейсов; 2026-11-09. Остаток: аутентификация пользователей (не только компания-секрет), UI командного режима, per-user права в операциях) | SPEC_10 |
| P3-4 | Автономный супервизор флота (Fleet → не только projection) | ❌ | ROADMAP_00 Фаза 2; полный отчёт |
| P3-5 | Декомпозиция hotspots: dexie-schema (3764 LoC), event-registry (2555 LoC), sandbox, key-service | ✅ (event-registry ✅: 9 тематических модулей (registry-groups/); dexie-schema ✅: версии вынесены в `dexie/schema-versions.ts` (DEXIE_VERSION_DEFS — единственный источник истины, 39 версий v5..v43 побайтово идентичны), хуки валидации — `schema-hooks.ts`, аудит миграций — `migration-guard.ts` (validateMigrationChain на тех же данных, расхождение с регистрацией исключено), `RecordedEventRow` — leaf `recorded-event-row.ts` с ре-экспортом; key-service ✅: `key-service-deps.ts`/`key-service-constants.ts`/`key-service-subsystems.ts` (конструктор-фабрика createKeyServiceSubsystems + общий createKeyPoolSelector; публичные экспорты KeyService/KeyServiceDeps/FREE_TIER_LIMITS без изменений); sandbox уже модульный; 0 круговых зависимостей по madge/depcruise) | Tech Map §6; полный отчёт P3-#35/36 |
| P3-6 | Переименовать rivals/ → experimental/ (19 подкаталогов) | ❌ | Duplication/Dead Map |
| P3-7 | Внешний security audit sandbox-interpreter | ❌ | Tech Map §6 |
| P3-8 | External observability (Sentry/Prometheus/Grafana) | ❌ | полный отчёт P3-#38 |

## 5. Открытые «быстрые победы» (Quick Wins)

| # | Задача | Источник |
|---|---|---|
| QW-1 | Coverage threshold в CI (порог уже есть — поднять/расширить include) | ✅ (include расширен: +storage/event-sourcing/trust/llm-bridge/ops/browser +llm(http/decorators/registry); пороги подняты 30/20/30/30 → 31/25/30/32; замерено 2026-11-08: All files 33.37% stmts / 27.75% branch / 31.98% funcs / 34.41% lines; в CI сводка покрытия публикуется аннотацией без логина) | Tech Map §9.4 |
| QW-2 | Снизить lint baseline (5600) — плановая чистка raw colors/set-state-in-effect | 🟡 (порог снижен 5600 → 4300 (факт 4199), 2026-11-09; основной остаток: 3.7k fa-02/no-raw-style-color + 178 no-restricted-imports в UI — крупная плановая чистка) | Tech Map §3.5 |
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
