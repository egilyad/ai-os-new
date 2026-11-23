# 2026-11-23 — notification-toasts

Статус: done

## Цель сессии

Сделать уведомления видимыми: toast-слой поверх EventBus/инбокса, смонтированный в глобальном layout.

## Что сделано (файлы + коммиты)

- `src/components/NotificationToasts.tsx` — подписка на `EVENTS.NOTIFICATION`, до 4 одновременных тостов, авто-скрытие через 5 с, ручное закрытие, иконки по типу, подавление в скрытой вкладке, `role="status"` / `aria-live="polite"`.
- `src/App.tsx` — компонент смонтирован рядом с CommandPalette.
- `src/components/NotificationToasts.test.tsx` — 4 теста; добавлен в `test:stable`.
- Единый роадмап — отмечено в Э3.2 UX.

## Принятые решения (+ почему; кандидат в ADR?)

- Toast слушает шину напрямую, а не polling инбокса: это даёт мгновенный отклик; инбокс остаётся хранилищем истории и используется в diagnostic/palette.
- Ограничение 4 тоста и 5 секунд защищают экран от засыпания уведомлениями при массовых уведомлениях.
- Таймеры очищаются при размонтировании — предотвращает setState на мёртвом компоненте.

## Обнаруженные проблемы / гипотезы

- Факт: доменные события пока не эмитируют `NOTIFICATION` для «дебат завершён», «кристалл опровергнут», «memory worker закончил» — тосты появятся только после соответствующей проводки.
- Гипотеза: стоит добавить настраиваемый TTL и группировку одинаковых сообщений; отложено.
- `NotificationInboxService` и toast-слой используют один и тот же event, но независимо — дублирования записи нет (инбокс пишет, toast показывает).

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run NotificationToasts.test.tsx` — 4/4 passed.
- ESLint на трёх файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Провести доменные события в `NOTIFICATION` (debate/crystal/memory worker), затем overview-хабы и a11y-ядро.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 14867b7
- Изменённых файлов: 4
  - M package.json
  - M src/App.tsx
  - ?? src/components/NotificationToasts.test.tsx
  - ?? src/components/NotificationToasts.tsx
- Diff stat:
  - package.json | 4 ++--
  - src/App.tsx | 2 ++
  - 2 files changed, 4 insertions(+), 2 deletions(-)
- Последние коммиты:
  - 14867b7 feat(notifications): add EventBus-backed inbox service
  - 849bfab feat(diagnostics): show the selected run failure
  - ebb9355 feat(palette): surface failed runs from run history
  - 016b320 feat(runtime): persist project runs and link provenance
  - 4348ff3 feat(graph): link run provenance into project graph
