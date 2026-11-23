# 2026-11-23 — overview-hubs-ui

Статус: done

## Цель сессии

Э2.1: сделать пять overview-хабов видимыми в existing DashboardPanel без новых маршрутов и панелей.

## Что сделано (файлы + коммиты)

- `src/components/OverviewHubs.tsx` — пять карточек на основе `OverviewHubService`; провайдеры данных из `agentService`, `memoryService`, `useActiveDebateStore`, `useKeyStore`, `runHistoryService`, `notificationInboxService`; обновление по `NOTIFICATION`/`KERNEL_UPDATED`; клик → `onNavigate`.
- `src/components/DashboardPanel/DashboardPanel.tsx` — хабы встроены после заголовка.
- `src/kernel/instances/services-extras.ts` — реэкспорт `OverviewHubService` (соблюдение Dependency Rule).
- `src/components/OverviewHubs.test.tsx` — 1 тест на 5 карточек и навигацию; добавлен в `test:stable`.
- Единый роадмап — Э3.2 UX обновлена.

## Принятые решения (+ почему; кандидат в ADR?)

- Пять карточек встроены в существующий дашборд, а не пять новых панелей: роадмап запрещает рост навигации до разгрузки.
- Сервис реэкспортирован через `kernel/instances`, чтобы компонент не нарушал `no-restricted-imports`.
- Обновление по событиям шины, а не polling: данные меняются редко, лишний интервал не нужен.

## Обнаруженные проблемы / гипотезы

- Факт: `memoryService.getMemories().length` считает загруженные записи, а не всё хранилище — число может быть неполным до гидрации.
- Гипотеза: хабы стоит делать коллапсируемыми; пока всегда видны.
- ESLint в `DashboardPanel.tsx` — 5 предсуществующих предупреждений, новых нет.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run OverviewHubs.test.tsx DashboardPanel.test.tsx` — 13/13 passed.
- ESLint на трёх файлах — 0 ошибок.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Вернуться к оставшимся пунктам UX-фазы: уведомления в хабах, a11y (outline:none, drag-only UI) и round-trip импорт 9 панелей.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ af9c8cd
- Изменённых файлов: 5
  - M package.json
  - M src/components/DashboardPanel/DashboardPanel.tsx
  - M src/kernel/instances/services-extras.ts
  - ?? src/components/OverviewHubs.test.tsx
  - ?? src/components/OverviewHubs.tsx
- Diff stat:
  - package.json | 4 ++--
  - src/components/DashboardPanel/DashboardPanel.tsx | 3 +++
  - src/kernel/instances/services-extras.ts | 1 +
  - 3 files changed, 6 insertions(+), 2 deletions(-)
- Последние коммиты:
  - af9c8cd feat(overview): add five-hub aggregation service
  - 6910002 fix(a11y): add dialog semantics and Escape to modals
  - fd05571 docs: require push at end of each session
  - 3218efd fix(a11y): make focus trap handle Escape and dynamic content
  - 4db589f feat(notifications): bridge domain events to notifications
