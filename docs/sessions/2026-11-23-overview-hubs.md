# 2026-11-23 — overview-hubs

Статус: done

## Цель сессии

Э2.1 единого роадмапа: основа для пяти overview-хабов (agents / memory / debates / providers / background).

## Что сделано (файлы + коммиты)

- `src/kernel/contracts/overview-hub.ts` — `OverviewHubCard`, `IOverviewHubService`, статусы `ok/warning/error`.
- `src/kernel/services/overview-hub-service.ts` — агрегатор из пяти карточек с активными счётчиками, подсказками, статусами и ссылками на разделы.
- `src/kernel/services/overview-hub-service.test.ts` — 3 теста; добавлен в `test:stable`.
- Единый роадмап — Э3.2 UX обновлена.

## Принятые решения (+ почему; кандидат в ADR?)

- Агрегатор получает данные через инжектированные функции-провайдеры, а не импортирует сервисы/сторы напрямую: ядро не должно зависеть от UI-стора `useKeyStore`.
- Статус `warning` при нулевых счётчиках и `error` при наличии отказов — карточка сама подсказывает, куда идти.
- Пять карточек фиксированы в контракте — это HEAD-обзор, а не ещё пять панелей в навигации.

## Обнаруженные проблемы / гипотезы

- Факт: сервис пока не зарегистрирован в DI и не имеет UI — это модель/агрегатор для будущего компонента.
- Гипотеза: провайдеры данных лучше собрать в UI-слое (где доступны `useKeyStore`, `runHistoryService`, `notificationInboxService`), затем передать в конструктор.
- Ссылки карточек используют существующие маршруты (`agents`, `memory`, `debate`, `keys`, `diagnostics`) — новые маршруты не нужны.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run overview-hub-service.test.ts` — 3/3 passed.
- ESLint на трёх файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Собрать UI-компонент overview-хабов на основе сервиса и встроить его в `DashboardPanel` без новых маршрутов.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 6910002
- Изменённых файлов: 4
  - M package.json
  - ?? src/kernel/contracts/overview-hub.ts
  - ?? src/kernel/services/overview-hub-service.test.ts
  - ?? src/kernel/services/overview-hub-service.ts
- Diff stat:
  - package.json | 4 ++--
  - 1 file changed, 2 insertions(+), 2 deletions(-)
- Последние коммиты:
  - 6910002 fix(a11y): add dialog semantics and Escape to modals
  - fd05571 docs: require push at end of each session
  - 3218efd fix(a11y): make focus trap handle Escape and dynamic content
  - 4db589f feat(notifications): bridge domain events to notifications
  - c5f8fab feat(notifications): mount toast layer in app shell
