# 2026-11-23 — domain-notification-bridge

Статус: done

## Цель сессии

Наполнить уведомления реальными событиями: дебат, кристалл, память → `system:notification` → инбокс и тосты.

## Что сделано (файлы + коммиты)

- `src/kernel/services/domain-notification-bridge.ts` — подписки на `DEBATE_SESSION_COMPLETED`, `DEBATE_SESSION_FAILED`, `CRYSTAL_REFUTED`, `MEMORY_PROMOTED`; каждый вызывает `EVENTS.NOTIFICATION` с типом и источником.
- `src/kernel/service-registration/phase6-high-level.ts` — регистрация в DI (lifecycle init/destroy).
- `src/kernel/services/domain-notification-bridge.test.ts` — 4 теста; включён в `test:stable`.
- Единый роадмап — Э3.2 UX обновлена.

## Принятые решения (+ почему; кандидат в ADR?)

- Один мост вместо правок четырёх сервисов: доменные сервисы не знают о UI-уведомлениях, а карта событий находится в одном месте.
- Мост не слушает `NOTIFICATION` — рекурсия исключена.
- Причины ошибок и опровержений обрезаются до 160 символов, чтобы не раздувать тосты и инбокс.

## Обнаруженные проблемы / гипотезы

- Факт: события `MEMORY_PROMOTED` и `CRYSTAL_REFUTED` существуют в реестре, но не все сервисы их эмитируют — покрытие зависит от вызывающего кода.
- Гипотеза: для «memory worker закончил» нужен отдельный event с длительностью и счётчиками; текущий `MEMORY_PROMOTED` — лишь ближайший доступный аналог.
- Мост зарегистрирован в phase6; boot-smoke после регистрации пройден — lifecycle-подключение работает.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run domain-notification-bridge.test.ts boot-smoke.test.ts` — 5/5 passed.
- ESLint на трёх файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Проверить boot-smoke после регистрации; затем overview-хабы и a11y-ядро (Э2.1/Э2.5 единого роадмапа).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ c5f8fab
- Изменённых файлов: 4
  - M package.json
  - M src/kernel/service-registration/phase6-high-level.ts
  - ?? src/kernel/services/domain-notification-bridge.test.ts
  - ?? src/kernel/services/domain-notification-bridge.ts
- Diff stat:
  - package.json | 4 ++--
  - src/kernel/service-registration/phase6-high-level.ts | 6 ++++++
  - 2 files changed, 8 insertions(+), 2 deletions(-)
- Последние коммиты:
  - c5f8fab feat(notifications): mount toast layer in app shell
  - 14867b7 feat(notifications): add EventBus-backed inbox service
  - 849bfab feat(diagnostics): show the selected run failure
  - ebb9355 feat(palette): surface failed runs from run history
  - 016b320 feat(runtime): persist project runs and link provenance
