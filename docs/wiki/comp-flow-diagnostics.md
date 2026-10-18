<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Сквозной контур: самодиагностика

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, контур, диагностика, здоровье, проверка, наблюдаемость

Источники: `src/kernel/services/runtime-intelligence/diagnostic-service.ts`, `src/kernel/services/advisor/diagnostics-engine.ts`, `src/kernel/services/probe-service.ts`, `src/kernel/services/key-management/key-diagnostics.ts`, `src/kernel/services/key-management/key-health.ts`, `src/kernel/services/agent-health-monitor.ts`, `src/kernel/services/truth-consistency-monitor.ts`, `src/kernel/services/consistency-checker.ts`, `src/kernel/services/health-sla-service.ts`, `src/components/HealthPanel/HealthPanel.tsx`, `src/main.tsx`

## Назначение

Показать **самодиагностику** как сквозной контур: запуск проверки → опрос провайдеров и ключей → проверка согласованности → агрегация здоровья и уведомления; с точками обрыва.

## Возможности

- Проверка ключей/провайдеров (`ProbeService.probeKey` / `probeAll`), в том числе под дебаты (`probeForDebate`).
- Диагностический прогон по области (`DiagnosticService.runDiagnostic(scope)`), движок — `DiagnosticsEngine`.
- Проверка истинности/согласованности состояния и исцеление (`TruthConsistencyMonitor`, `ConsistencyChecker`).
- Мониторинг здоровья агентов и системы (`AgentHealthMonitor`, `SYSTEM_HEALTH_CHANGED`).
- Dev-хелперы в консоли: `__probeAll`, `__checkConsistency`, `__getState`.

## Сквозной поток (по шагам)

1. **Запуск.** [Панель: Наблюдаемость (логи, трейсы, здоровье)](./panel-observability.md) (`HealthPanel.tsx`) или dev-хелперы `window.__probeAll` / `__checkConsistency` (только в DEV).
2. **Диагностический прогон.** `DiagnosticService.runDiagnostic(scope)` → `DiagnosticsEngine`; по завершении — событие `DIAGNOSTIC_COMPLETE`.
3. **Опрос ключей/провайдеров.** `ProbeService.probeAll()` → по каждому ключу `probeKey` (запуск `start()`, ожидание `STREAM_END`); эмитятся `KEY_HEALTH_CHECK_STARTED/COMPLETED/FAILED` и `KEY_PROBE_RESULT`.
4. **Проверка согласованности.** `TruthConsistencyMonitor.check(kernel.getState().providers, {})` сверяет проекцию и провайдеры; `ConsistencyChecker` формирует задачи исцеления.
5. **Исцеление.** В рамках `ConsistencyChecker` может запускаться «документационный дебат» (`runDocumentationDebate`) для задач типа правки документации.
6. **Мониторинг.** `AgentHealthMonitor` отслеживает агентов и эмитит `AGENT_HEALTH_CHANGE`; агрегат — `SYSTEM_HEALTH_CHANGED` (`observability:health:changed`).
7. **Уведомление.** Результаты диагностики ключей/бенчмарков идут в `NOTIFICATION`; панель отображает сводку.

## Обрывы цепочки (что происходит при ошибке)

- **Провал проверки ключа.** `KEY_HEALTH_CHECK_FAILED` + уведомление; здоровье ключа понижается, но контур продолжает работу.
- **Бенчмарк/советник ключа.** `KeyDiagnostics.runBenchmark` / `runAdvisor` сообщают результат через `NOTIFICATION`.
- **Несогласованность состояния.** `TruthConsistencyMonitor` возвращает отчёт; `ConsistencyChecker` ставит задачу исцеления (вплоть до документационного дебата).
- **SLA-здоровье — заглушка.** `HealthSlaService` помечен `@deprecated MOCK` и не отражает реальное SLA.

## Данные, события, восстановление

- **События:** `KEY_HEALTH_CHECK_STARTED/COMPLETED/FAILED`, `KEY_PROBE_RESULT`, `STREAM_END`, `DIAGNOSTIC_COMPLETE`, `AGENT_HEALTH_CHANGE`, `SYSTEM_HEALTH_CHANGED`, `NOTIFICATION`.
- **Связь:** ключи — [Компонент: управление ключами провайдеров](./comp-key-management.md); наблюдаемость — [Компонент: наблюдаемость (метрики, трейсы, мониторинг)](./comp-observability.md); провайдеры/роутинг — [Компонент: рантайм провайдеров](./comp-provider-runtime.md).
- **Восстановление:** результаты доступны после гидрации ([Сквозной контур: восстановление сессии](./comp-flow-restore.md)).

## Реализация

- Оркестрация: `src/kernel/services/runtime-intelligence/diagnostic-service.ts`, `src/kernel/services/advisor/diagnostics-engine.ts`.
- Проверки ключей: `src/kernel/services/probe-service.ts`, `src/kernel/services/key-management/key-diagnostics.ts`, `key-health.ts`.
- Согласованность/исцеление: `truth-consistency-monitor.ts`, `consistency-checker.ts`.
- Здоровье: `agent-health-monitor.ts`, `health-sla-service.ts` (MOCK).
- UI/хелперы: `src/components/HealthPanel/HealthPanel.tsx`, `src/main.tsx` (DEV-глобали `__probeAll`/`__checkConsistency`).

## Связи

- Диагностика системы — [Диагностика и известные проблемы](./diagnostics.md); ключи — [Компонент: управление ключами провайдеров](./comp-key-management.md); наблюдаемость — [Компонент: наблюдаемость (метрики, трейсы, мониторинг)](./comp-observability.md); провайдеры — [Компонент: рантайм провайдеров](./comp-provider-runtime.md); загрузка/гидрация — [Сквозной контур: восстановление сессии](./comp-flow-restore.md).

## Проверка работоспособности

- Тесты: `src/kernel/services/consistency-checker.test.ts`, `src/kernel/services/notification-webhook-service.test.ts`, тесты probe/health (см. профильные статьи).

## Состояние

- Подтверждено чтением кода; `HealthSlaService` остаётся MOCK-заглушкой — реальное SLA не считается.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)
- [Компонент: управление ключами провайдеров](./comp-key-management.md)
- [Компонент: наблюдаемость (метрики, трейсы, мониторинг)](./comp-observability.md)
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Сквозной контур: восстановление сессии](./comp-flow-restore.md)

[← Все материалы](./README.md)
