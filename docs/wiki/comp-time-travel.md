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

- `temporal-replay-service.ts` (`TemporalReplayService`), `snapshot-service.ts` (`SnapshotService` + типы), `causal-timeline-service.ts` (`CausalTimelineService`), `counterfactual-explanation-service.ts` (`CounterfactualExplanationService`).
- В дебатах есть свои аналоги: `debate-runtime/causal-graph-builder.ts`, `counterfactual-service.ts`, `replay-selector.ts`, `debate-snapshot-bridge.ts`.

## Связи

- Источник событий — [Компонент: журналирование событий (event sourcing)](./comp-event-sourcing.md); подтверждение/сверка — [Компонент: консистентность и дрейф](./comp-consistency.md).
- Панели: [Панели: История, аудит, версии, деплой](./panel-history-audit.md), [Панели: Теневые прогоны и стратегия](./panel-shadow.md), [Панели: Симуляция и контрфакты](./panel-simulation.md).

## Проверка работоспособности

- Есть тесты `snapshot-service.test.ts`, а также в дебатах `causal-graph-builder.test.ts`, `counterfactual-service.test.ts`, `replay-selector.test.ts`.
- Ручная: снять снапшот, изменить состояние, сравнить и переиграть.

## Состояние

- Реализовано; снапшоты и дебатовые аналоги покрыты тестами, верхнеуровневый replay — без выделенного теста.

---

## Связанные материалы

- [Компонент: журналирование событий (event sourcing)](./comp-event-sourcing.md)
- [След исполнения: журнал, раны, зомби](./execution-trail.md)
- [Панели: История, аудит, версии, деплой](./panel-history-audit.md)
- [Панели: Теневые прогоны и стратегия](./panel-shadow.md)
- [Панели: Симуляция и контрфакты](./panel-simulation.md)

[← Все материалы](./README.md)
