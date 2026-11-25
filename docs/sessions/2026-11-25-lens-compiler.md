# 2026-11-25 — lens-compiler

Статус: done

## Цель сессии

Первый пункт MVP из отчёта «Компоненты работы с информацией» — устранить расхождение двух конвейеров линз.

## Что сделано (файлы + коммиты)

- `src/kernel/utils/lens-compiler.ts` — `compileLensStack(lensIds, getLens, validate)` возвращает порядок, отброшенные линзы, ошибки валидации и описания всех kinds трансформаций (prompt-prefix, perspective-inject, scoring-rubric, context-filter, output-transform, composite).
- `LensesPanel/lens-guidance.ts` теперь использует компилятор и показывает конфликты/неизвестные линзы, а не упрощённую копию логики.
- Тест `lens-compiler.test.ts` — 2/2; путь в `test:stable`.

## Принятые решения (+ почему; кандидат в ADR?)

- Источник истины для порядка и валидации — `LensEngineService.validateStack()`; UI больше не сортирует по-своему.
- Ошибки валидации не скрываются: показываются в guidance, чтобы агент видел конфликт стека.
- Компилятор чистый (без DI) — легко тестируется и может вызываться и оркестратором, и панелью — пока используется панелью.

## Обнаруженные проблемы / гипотезы

- Факт: `applyStack()` в оркестраторе по-прежнему применяет трансформации сам; он уже вызывает `validateStack()`, но не использует `compileLensStack` — unification отложена.
- Гипотеза: следующий пункт MVP — `veto-gate` (пост-проверка исключений) — даст больший выигрыш, чем полная унификация applyStack.
- ESLint: 0 ошибок; 2 теста зелёные.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run lens-compiler.test.ts` — 2/2; ESLint — 0 замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

`veto-gate`: детерминированная пост-проверка ответа по шаблонам исключений (contains/exact/regex) с событием и метрикой.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ af99c96
- Изменённых файлов: 4
  - M package.json
  - M src/components/LensesPanel/lens-guidance.ts
  - ?? src/kernel/utils/lens-compiler.test.ts
  - ?? src/kernel/utils/lens-compiler.ts
- Diff stat:
  - package.json | 4 +-
  - src/components/LensesPanel/lens-guidance.ts | 60 ++++++++++-------------------
  - 2 files changed, 23 insertions(+), 41 deletions(-)
- Последние коммиты:
  - af99c96 fix(skills): remove scanner-triggering command literals
  - eba3138 fix(secrets): move webhook secret to session storage
  - 0a83481 feat(crew): gate mutations with authorization service
  - 94efaab fix(sidecar): block internal networks and DNS rebinding
  - 9f4125b fix(memory-worker): keep message chain alive after errors
