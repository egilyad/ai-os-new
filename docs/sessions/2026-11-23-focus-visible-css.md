# 2026-11-23 — focus-visible-css

Статус: done

## Цель сессии

A11y (W3-012): вернуть видимый индикатор фокуса там, где inline `outline:none` перебивал глобальный `:focus-visible`.

## Что сделано (файлы + коммиты)

- `src/styles/panels.css` — в конце добавлен `:focus-visible { outline: 2px solid var(--accent) !important; outline-offset: 2px !important; }`.
- Единый роадмап — отмечено в Э3.2 UX.

## Принятые решения (+ почему; кандидат в ADR?)

- Правило добавлено в последний загружаемый CSS (`panels.css`), чтобы перебить 17 локальных `outline:none`, включая `.assistant-keybar__select:focus` с высокой специфичностью.
- `!important` использован осознанно: клавиатурный фокус не должен теряться из-за стилей панелей.

## Обнаруженные проблемы / гипотезы

- Факт: `eslint-plugin-jsx-a11y` по-прежнему отсутствует — статический контроль разметки не ведётся.
- Гипотеза: drag-only UI (Э2.5 / 9.7) в `src/components` не найден через `draggable/onDragStart` — возможно, используется библиотека; отдельный аудит.
- Визуальная проверка фокуса в браузере не проводилась locally — оставить E2E/CI.

## Результаты проверок (typecheck/lint/test — что запускалось)

- Локальные тесты не запускались: изменён только CSS + документы.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Round-trip импорт 9 панелей (Э3.1) или статический аудит drag-only UI в библиотечных компонентах.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ d873f94
- Изменённых файлов: 1
  - M src/styles/panels.css
- Diff stat:
  - src/styles/panels.css | 5 +++++
  - 1 file changed, 5 insertions(+)
- Последние коммиты:
  - d873f94 feat(dashboard): embed five overview hubs
  - af9c8cd feat(overview): add five-hub aggregation service
  - 6910002 fix(a11y): add dialog semantics and Escape to modals
  - fd05571 docs: require push at end of each session
  - 3218efd fix(a11y): make focus trap handle Escape and dynamic content
