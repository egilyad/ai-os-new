<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: тайм-тревел, снапшоты и каузальность

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, тайм-тревел, снапшоты, каузальность

Источники: `src/kernel/services/temporal-replay-service.ts`, `src/kernel/services/snapshot-service.ts`, `src/kernel/services/causal-timeline-service.ts`, `src/kernel/services/counterfactual-explanation-service.ts`, `src/kernel/services/causal-scope-manager.ts`

## Назначение

Перемещаться во времени: переиграть прошлое, снять/сравнить состояние, показать причинно-следственные цепочки и объяснить «а что если».

## Возможности

- Воспроизведение событий (`TemporalReplayService`), снимки состояния и их сравнение (`SnapshotService`: `RuntimeState`, `SystemSnapshot`, `SnapshotDiff`).
- Каузальная лента решений (`CausalTimelineService`) и управление областью причинности (`causal-scope-manager.ts`).
- Контрфактические объяснения (`CounterfactualExplanationService`).

## Реализация

- `temporal-replay-service.ts` (`TemporalReplayService`, ~371 ст.): реплей событий по временному окну, пересчёт скоров (`applyEvent`), `rescore` через routerService, `flipFrame` (первый кадр-лидер), read-only (сохраняет/восстанавливает sim-state).
- `snapshot-service.ts` (`SnapshotService` + типы): снапшоты, diff, restore, replay снимков.
- `causal-timeline-service.ts` (`CausalTimelineService`): слушает `system:decision`, `recordDecision` (evict при 200), `getRelevantEvents` (фильтр по scope).
- `causal-scope-manager.ts`: группировка requestId по provider/key-overlap (`MAX_SCOPES=100`, `maxScopeSize=10`).
- `counterfactual-engine.ts` + `counterfactual-explanation-service.ts` + `counterfactual-narrative-service.ts`: override-прогон через routerService (simState), scoreDiffs, декомпозиция по COMPONENT_KEYS.
- В дебатах есть свои аналоги: `debate-runtime/causal-graph-builder.ts`, `counterfactual-service.ts`, `replay-selector.ts`, `debate-snapshot-bridge.ts`.

## Связи

- Источник событий — [Компонент: журналирование событий (event sourcing)](./comp-event-sourcing.md); подтверждение/сверка — [Компонент: консистентность и дрейф](./comp-consistency.md).
- Панели: [Панели: История, аудит, версии, деплой](./panel-history-audit.md), [Панели: Теневые прогоны и стратегия](./panel-shadow.md), [Панели: Симуляция и контрфакты](./panel-simulation.md).

## Проверка работоспособности

- Есть тесты `snapshot-service.test.ts`, а также в дебатах `causal-graph-builder.test.ts`, `counterfactual-service.test.ts`, `replay-selector.test.ts`.
- **Пробел:** нет unit-тестов на `CausalScopeManager`, `CausalTimelineService`, `TemporalReplayService`, `CounterfactualEngine/Explanation/Narrative`.
- Ручная: снять снапшот, изменить состояние, сравнить и переиграть.

## Состояние

- Реализовано; снапшоты и дебатовые аналоги покрыты тестами, верхнеуровневый replay — без выделенного теста.
- **Известный дефект:** `CausalTimelineService.getTrace` возвращает пустой `timeline: []` (массив никогда не заполняется) — потребители временной шкалы получают пустоту. Подробно — `docs/audits/cognitive-simulation-audit.md` (C2).

---

## Связанные материалы

- [Компонент: журналирование событий (event sourcing)](./comp-event-sourcing.md)
- [След исполнения: журнал, раны, зомби](./execution-trail.md)
- [Панели: История, аудит, версии, деплой](./panel-history-audit.md)
- [Панели: Теневые прогоны и стратегия](./panel-shadow.md)
- [Панели: Симуляция и контрфакты](./panel-simulation.md)

[← Все материалы](./README.md)
