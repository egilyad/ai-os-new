import type { WikiArticle } from './wiki-types';

/**
 * Сводная статья отложенных работ и фич. Собирает известные пробелы из
 * карт системной разведки (аудиты в `docs/audits/waves/`) и карты отложенных
 * (`docs/known-issues-deferred.md`), с указанием источника и причины.
 */
export const DEFERRED_ARTICLES: WikiArticle[] = [
    {
        slug: 'deferred-works-features',
        title: 'Отложенные работы и фичи',
        section: 'dev-status',
        tags: ['состояние разработки', 'бэклог', 'фичи', 'риски'],
        freshness: 'needs-check',
        sources: [],
        related: [
            'dev-status-debt',
            'dev-status-critical',
            'dev-status-bugs',
            'dev-status-roadmaps',
        ],
        body: `## Откуда этот список

Пробелы собраны из карт системной разведки (\`docs/audits/waves/\`), аудитов волн 2–8 и
карты отложенных (\`docs/known-issues-deferred.md\`). Здесь — с указанием **источника** и **причины**.

## Из «Карты функциональных пробелов»

| Работа | Источник | Причина |
|---|---|---|
| Builder не вызывает killer-сервисы (crystal/synthesis/lens/time-machine) | ✅ ЗАКРЫТО (P2-1) | запушено |
| Round-trip: export без import у 9 панелей | Gap Map §4 | фича восстановления из бэкапа |
| Provenance агент↔память / дебаты↔память | Gap Map §5 | граф/связи |
| Единые overview: agents/memory/debates/providers/background | Gap Map §6 | новый UI |
| Search в Settings, autocomplete в Wiki | ✅ ЗАКРЫТО (P2-6) | UI |
| Массовые операции (Roles/Traces/Governance) | Gap Map §8 | фича (approvals уже сделаны) |
| Уведомления: crystal refuted / debate concluded / memory worker | Gap Map §9 | событийная шина |

## Из «Карты технического состояния»

| Работа | Источник | Причина |
|---|---|---|
| Coverage-gate в CI | ✅ ЗАКРЫТО (QW-1) | пороги 31/25/30/32, include расширен |
| Снизить lint baseline (5600) | Tech Map §3.5 | плановая чистка |
| Декомпозиция hotspots (dexie-schema, sandbox, key-service…) | ✅ ЗАКРЫТО (P3-5) | schema-versions/hooks/guard; key-service-subsystems |
| Рефакторинг 62 TechniquePanels → generic | ✅ ЗАКРЫТО (P2-4) | lazy-фабрика, один общий чанк |
| Внешний security audit sandbox-interpreter | Tech Map §6 | безопасность |

## Из «Карты доступности возможностей»

| Работа | Источник | Причина |
|---|---|---|
| Wiki-статьи для 64 панелей без документации | Accessibility Map §1 | discovery |
| Снизить cognitive overload (268 панелей / 22 раздела) | Accessibility Map §3 | навигация |
| Расширить CommandPalette quick actions (10 → больше) | Accessibility Map §3.2 | discovery |
| Onboarding: познакомить с killer-фичами (Crystal/Synthesis/Builder) | Accessibility Map §3.4 | онбординг |
| Явная команда «what can you do?» у Assistant | Accessibility Map §3.4 | discovery |
| Убрать/расширить stub-панели в main nav | Accessibility Map §1 | UX |

## Из «Карты потенциала» (Opportunity Map)

| Работа | Квадрант | Причина |
|---|---|---|
| Builder killer-service nodes (crystal/synthesis/lens/time-machine) | 🟢 Do First / 🔴 Strategic | стоимость 7, большой |
| Cross-panel navigation links (ROI 32) | ✅ ЗАКРЫТО (P2-7) | UI-ссылки, много точек |
| Import в 9 панелях (round-trip) | 🟢 Do First | фича восстановления |
| WikiPanel «Create article» UI | ✅ ЗАКРЫТО (P2-5) | фича |
| DebateArena «Save as Crystal» | ✅ ЗАКРЫТО (P2-5) | фича |
| Settings search + tooltips | ✅ ЗАКРЫТО (P2-6) | UI |
| Объединить budget/health панели | ✅ ЗАКРЫТО (P2-3) | BudgetHub + HealthHub |
| Coverage threshold в CI | ✅ ЗАКРЫТО (QW-1) | gating |
| eventBus cleanup audit (42 listeners) | ✅ ЗАКРЫТО (P2-13) | чинина |
| Переименовать rivals/ → experimental/ | 🟡 Quick Win | рефакторинг |
| Dev-status-*.md заполнены | ✅ сделано | — |
| Остальные Strategic Bets / Defer | 🔴/⚪ | крупное |

## Из «Карты функционального дублирования»

| Работа | Вердикт карты | Причина |
|---|---|---|
| 5 budget-панелей → BudgetHub | ✅ ЗАКРЫТО (P2-3) | рефакторинг UI |
| 4 health-панелей (System/HealthSla → HealthPanel) | ✅ ЗАКРЫТО (P2-3) | рефакторинг UI |
| ProviderDashboard → таб в ProviderManager; удалить OpenRouterPanel | 🔴 DUPLICATE | чистка |
| MemoryCenterPanel как hub (не дубликат MemoryPanel) | 🟡 MERGE PARTIAL | архитектура |
| 62 TechniquePanels → каталог | ✅ ЗАКРЫТО (P2-4) | генерация/единый компонент |
| rivals/ 19 подкаталогов → experimental/ или удалить | 🔴 REMOVE | чистка |
| 97 ручных setError → useAutoClearError | ✅ ЗАКРЫТО (P2-12) | стандартизация |
| 8 типов памяти / 14 router / 16 key-management / адаптеры | 🟢 KEEP | преднамеренно |

## Из «Карты наблюдаемости и диагностики»

| Работа | Источник | Причина |
|---|---|---|
| Cross-nav из diagnostic панелей к источнику (0 сейчас) | Obs Map §1 | UI-ссылки |
| UI для MemoryWatchdog / DLQ / CircuitBreaker / Bootstrap report / Event registry / Subscription stats | Obs Map §1 | новый UI |
| Unified «explain state» dashboard | Obs Map §1 | новый UI |
| HealthSlaPanel (@deprecated MOCK) — удалить/скрыть | ✅ ЗАКРЫТО (P2-10: скрыт из NAV; удаление отложено) | чистка |

## Из «Карты использования ресурсов»

| Работа | Источник | Причина |
|---|---|---|
| Lazy-загрузить CommandPalette и TECHNIQUE_PANEL_COMPONENTS | ✅ ЗАКРЫТО (P2-11) | сборка |
| Почистить фоновые setInterval (39) + пауза при скрытой вкладке | Res Map §1 | ресурсы |
| Увеличить долю useEffect с cleanup (17%) | Res Map §1 | утечки подписок |
| Следить за Tier 7 («*») — 525 сервисов при старте | Res Map §3.2 | bootstrap |
| framer-motion в 165 файлах — оптимизация импорта | Res Map §1 | сборка |

## Из «Карты мёртвого и заброшенного функционала»

| Работа | Рекомендация карты | Причина |
|---|---|---|
| HIDE DeployPanel/DistillationPanel за featureFlags.mockServices.enabled=false | ✅ ЗАКРЫТО (P2-10) | mock-бэкенды |
| REMOVE HealthSlaPanel (mock SLA, 441 строка) | 🟡 (P2-10: скрыт из NAV; удаление отложено) | mock |
| Разобрать ~15 orphan компонентов | 🟡 DOCUMENT/REMOVE | не подключены |
| 19 rivals/ подкаталогов (~175 файлов) | 🟡 REMOVE/experimental | research parallel |
| 5 @deprecated MOCK сервисов | 🟡 (P2-10: скрыты из NAV; удаление отложено) | simulated |
| dev-status-*.md (уже заполнены) | ✅ сделано | — |

## Из «Карты функциональной ценности»

**Критичное ядро (не трогать):** Чат, Дебаты, Провайдеры/ключи, Агенты, Кристаллы+линзы, Синтез, Builder, Time Machine, След исполнения.

| Работа | Источник | Причина |
|---|---|---|
| Скрыть Optional/Experimental (60–70 панелей) из main nav | Value Map §1/§3 | навигация |
| Скрыть/удалить Stub/декоративные (~10) | Value Map §1 | UX |
| Не переписывать Critical-ядро без сильной причины | Value Map §1 | стратегия |

## Из аудитов (волны 2–8) — безопасность/настойчивость

| Работа | Источник | Причина |
|---|---|---|
| KeyVault fail-open + passphrase-UI | ✅ ЗАКРЫТО (P0-1) | passphrase-vault, ключи только encrypted |
| API-ключи в IndexedDB plaintext | ✅ ЗАКРЫТО (P0-1) | миграция plaintext→encrypted |
| Multi-tenant IDOR / SYNC_SECRET / WS cross-tenant | ✅ ЗАКРЫТО (P0-2) | per-company секреты + WS-скоупинг |
| Cross-session потеря сообщений | ✅ ЗАКРЫТО (P1-6) | per-session ArgumentGraphService |
| Feature-flag UI (dotted vs nested) | ✅ ЗАКРЫТО (P2-#25) | flattenFeatureFlags() |
| streamMessage in-flight dedup | ✅ ЗАКРЫТО (P1-5) | CacheDecorator in-flight |
| CSAM/модерация изображений | W7-UGC-009 | внешний сервис |

## Из SPEC_06 (плагинная система)

| Работа | Источник | Причина |
|---|---|---|
| Динамические маршруты для \`contributes.panels\` (хост добавляет маршрут в route-registry + lazy-iframe) | SPEC_06 §5 | касается роутера/сайдбара, большой |

## Правило

Любая крупная небезопасная работа без локального прогона тестов/typecheck
записывается сюда или в карту отложенных (\`docs/known-issues-deferred.md\`),
а не делается «вслепую».`,
    },
];
