# 2026-11-23 — notification-inbox

Статус: done

## Цель сессии

Первый шаг UX-фазы: inbox уведомлений на EventBus (`system:notification`) с сохранением и respect к focus-состоянию вкладки.

## Что сделано (файлы + коммиты)

- `src/kernel/contracts/notification-inbox.ts` — `INotificationInboxService`, `InboxItem`, `InboxType`.
- `src/kernel/services/notification-inbox-service.ts` — подписка на `EVENTS.NOTIFICATION`, лимит 100 записей, сохранение в KV, `list/markRead/markAllRead/clear`, desktop-notification только при `document.hidden` и разрешении.
- `src/kernel/service-registration/phase6-high-level.ts` — регистрация в DI; `src/kernel/instances/services-extras.ts` — ленивый экспорт для будущего UI.
- `src/kernel/services/notification-inbox-service.test.ts` — 4 теста; добавлен в `test:stable`.
- Единый роадмап — отмечено в Э3.2 UX.

## Принятые решения (+ почему; кандидат в ADR?)

- Inbox не эмитит события обратно в шину — он только потребляет `system:notification`, чтобы не вызвать рекурсию.
- Desktop-notification показывается только когда вкладка скрыта и пользователь дал разрешение; при отсутствии Notification API сервис молча продолжает вести inbox.
- Ошибки KV fail-soft: уведомление всё равно остаётся в памяти.

## Обнаруженные проблемы / гипотезы

- Факт: UI-панели/тоста для инбокса пока нет — сервис доступен через DI/экспорт, но пользователь его не видит.
- Гипотеза: для toast нужно подписаться на `push()` на уровне компонента и уважать `document.hidden` — отдельный шаг.
- Сейчас источник уведомлений один (`system:notification`); события «дебат завершён», «кристалл опровергнут», «memory worker закончил» должны эмитить NOTIFICATION в своих сервисах — проверить покрытие.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run notification-inbox-service.test.ts boot-smoke.test.ts` — 5/5 passed.
- ESLint на пяти изменённых TS-файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Toast-слой поверх инбокса + подписка доменных событий на NOTIFICATION; затем overview-хабы и a11y-ядро.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 849bfab
- Изменённых файлов: 6
  - M package.json
  - M src/kernel/instances/services-extras.ts
  - M src/kernel/service-registration/phase6-high-level.ts
  - ?? src/kernel/contracts/notification-inbox.ts
  - ?? src/kernel/services/notification-inbox-service.test.ts
  - ?? src/kernel/services/notification-inbox-service.ts
- Diff stat:
  - package.json | 4 ++--
  - src/kernel/instances/services-extras.ts | 4 ++++
  - src/kernel/service-registration/phase6-high-level.ts | 10 ++++++++++
  - 3 files changed, 16 insertions(+), 2 deletions(-)
- Последние коммиты:
  - 849bfab feat(diagnostics): show the selected run failure
  - ebb9355 feat(palette): surface failed runs from run history
  - 016b320 feat(runtime): persist project runs and link provenance
  - 4348ff3 feat(graph): link run provenance into project graph
  - 6a4b52a feat(history): persist artifact provenance and search failures
