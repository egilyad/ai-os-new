<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 26: остатки

> Раздел: **История разработки** · Статус: verified · Теги: аудит, зона 26

## Что проверено и исправлено

- PolicyEditorPanel: ConditionEditor терпит отсутствующий массив values; RuleList безопасно рендерит правило без id (пустая строка) и без массива actions.
- AnalyticsPanel: DecisionsTab терпит запись без массива scores; PricingPanel — отсутствующий budget (dailyAverage/monthlyBudget через optional chaining), а refreshData нормализует prices/overrides к объектам; ProviderHealthSection/ProvidersTab терпят отсутствующие avgTTFT/reliability/avgTPS/selectionRate (0/— вместо NaN).
- PerformanceProfilerPanel/ServiceDetailPanel: селекция без min/max/totalLatency не даёт NaN (0), сообщение об ошибке без строки не роняет slice.
- DriftDetectorPanel: запись агента без driftScore (0), история без content (пустая строка), fetched без driftScore — guards.
- VulnTargetingPanel: edges терпит не-массив (slice и length), stats без averageConfidence/attackRatio/supportRatio — guards.
- AquariumPanel: фигура/легенда/выбранная ячейка с отсутствующим provider не роняют toLowerCase (пустая строка).
- BookmarksPanel: карточка и панель терпят закладку без массива tags; refresh не роняет панель на не-массиве; seedDemo больше не даёт unhandled rejection (ошибка в баннер); getAllTags терпит не-массив.
- CausalDebugger: scope с отсутствующими requestIds/providerIds/keyIds не роняет join; TraceListPanel терпит запись/scope без этих массивов; ConsistencyCheckSection терпит отчёт без массива mismatches.
- RivalsHub: legacy-цикл без goal (пустая строка), чат/раунд без members/turns (пустые массивы), тулкит без prefixes (пустой join), блок без content; setBlocks терпит не-массив.
- AgentJournalPanel/JournalEntryCard: неизвестный исход показывается серым (не undefined-цвет), запись без tags/durationMs/tokensUsed не роняет рендер.
- AlertLayer: refreshAlerts терпит не-массив от keyService.getAlerts.
- NvidiaEnterprise: таблица ключей терпит ключ без provider (фильтр и тест не роняют toLowerCase); PlatformBudgetSection терпит не-массив incidents (пустой список вместо краха sort).
- FleetPanel: вкладка Rivals терпит цикл без goal и очередь без refId (пустые строки).
- Проверены без правок: TechniquePanels (общий сгенерированный паттерн уже guarded, есть smoke-тест), KeyNotesPanel/NoteCard и NoteInputForm, LiveCognition (MissionControl/LiveWorkspace — try/catch и optional chaining), UsageHeatmap, RivalLabsPanel/RivalServiceCard, BudgetPanel-секции, PerformanceProfilerPanel/components.
- Тесты: AlertLayer +1 (getAlerts вернул не-массив), RivalsHub +1 (legacy-циклы/чаты/тулкиты/блоки без опциональных полей), DriftDetectorPanel/VulnTargetingPanel/AnalyticsPanel — существующие тесты покрывают рендер.
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией, ESLint по изменённым файлам — 0 ошибок.

## Отложено, требует проверки

- Palette/CommandPalette/NotificationCenter/CustomizationPanel и прочие мелкие тултипы — не тронуты, отдельного аудита не было.
- Реальные payload сервисов (policy/analytics/driftTargeting/bookmarks/causal/rivals/nvidia/fleet) против guards не гонялись — только моки/транспиляция.
- LiveCognition/IntelligenceGraph и DashboardPanel/AgentLiveBoard живьём не проверялись.
- KeyNotesPanel: FilePreviewModal/KeySelectorSidebar не аудировались.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
