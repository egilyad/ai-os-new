# 2026-11-23 — focus-trap-a11y

Статус: done

## Цель сессии

A11y-ядро Э2.5: исправить «silent failure» `useFocusTrap` — динамические элементы модалки, Escape и фокус вне контейнера.

## Что сделано (файлы + коммиты)

- `src/hooks/useFocusTrap.ts` — список фокусируемых элементов пересчитывается на каждый Tab; Escape вызывает опциональный `onEscape`; при отсутствии элементов фокус уходит в контейнер (`tabindex=-1` с восстановлением); возврат фокуса вне контейнера.
- `src/hooks/useFocusTrap.test.tsx` — 2 новых теста (Escape, динамические элементы), всего 11.
- Единый роадмап — отмечено в Э3.2 UX.

## Принятые решения (+ почему; кандидат в ADR?)

- `onEscape` хранится в ref и обновляется в отдельном эффекте, чтобы не переподписывать ловушку и не сбрасывать фокус при смене колбэка.
- Контейнер получает `tabindex=-1` только на время активной ловушки и возвращает исходное состояние при cleanup.
- Обработчик Tab пересчитывает список элементов — модальный контент часто меняется после открытия.

## Обнаруженные проблемы / гипотезы

- Факт: `eslint-plugin-jsx-a11y` не установлен — W3-010 остаётся открытым; установка требует сетевого npm install на слабом ПК, оставить CI/отдельному шагу.
- Гипотеза: 4 модалки из Э2.5 используют `useFocusTrap` не везде — аудит вызовов не проводился.
- Синхронизация ref через effect-addendum добавлена после предупреждения линтера; финальный ESLint чистый.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run useFocusTrap.test.tsx` — 11/11 passed.
- ESLint на двух файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Аудит 4 модалок на использование `useFocusTrap` и `role="dialog"`, затем 5 overview-хабов (Э2.1).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 4db589f
- Изменённых файлов: 2
  - M src/hooks/useFocusTrap.test.tsx
  - M src/hooks/useFocusTrap.ts
- Diff stat:
  - src/hooks/useFocusTrap.test.tsx | 48 +++++++++++++++++++++++++++++++++++++++--
  - src/hooks/useFocusTrap.ts | 45 +++++++++++++++++++++++++-------------
  - 2 files changed, 76 insertions(+), 17 deletions(-)
- Последние коммиты:
  - 4db589f feat(notifications): bridge domain events to notifications
  - c5f8fab feat(notifications): mount toast layer in app shell
  - 14867b7 feat(notifications): add EventBus-backed inbox service
  - 849bfab feat(diagnostics): show the selected run failure
  - ebb9355 feat(palette): surface failed runs from run history
