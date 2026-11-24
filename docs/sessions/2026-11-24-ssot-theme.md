# 2026-11-24 — ssot-theme

Статус: done

## Цель сессии

Э3.3 SSoT: устранить тройной mirror темы (boot, settings, CommandPalette).

## Что сделано (файлы + коммиты)

- `src/kernel/utils/theme-preference.ts` — единые `THEME_STORAGE_KEY`, валидация, `readStoredTheme`, `setTheme`, `resolveInitialTheme`, `applyThemeToDocument`.
- `theme-init.ts`, `settings-service.ts`, `CommandPalette.tsx` переведены на общий модуль; ключ `theme` в CommandPalette больше не используется.
- `src/kernel/utils/theme-preference.test.ts` — 3 теста; путь в `test:stable`.
- Единый роадмап — Э3.3 обновлена.

## Принятые решения (+ почему; кандидат в ADR?)

- Boot-путь читает хранилище, но не пишет его: системное предпочтение используется только если пользователь ничего не выбирал.
- `setTheme` пишет localStorage и применяет `data-theme` атомарно для всех интерактивных точек.
- Валидация по WHITELIST тем не даёт невалидному значению попасть в DOM.

## Обнаруженные проблемы / гипотезы

- Факт: `settingsService` продолжает хранить `theme` в своём KV — это вторая копия; для полного SSoT нужно читать/писать только theme-preference, но это изменит формат настроек.
- Гипотеза: 8.3/8.4/8.7 (debate selection, provider/key projections) требуют большего рефакторинга сторов — отдельный шаг.
- ESLint: 0 ошибок, 4 предсуществующих предупреждения в CommandPalette.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run theme-preference.test.ts` — 3/3; ESLint на пяти файлах — 0 ошибок.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

8.3/8.4/8.7: один источник для выбора дебата и provider/ключ-состояния; затем wiki-статьи для панелей.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ d8e9b5c
- Изменённых файлов: 6
  - M package.json
  - M src/components/CommandPalette.tsx
  - M src/kernel/services/settings-service.ts
  - M src/theme-init.ts
  - ?? src/kernel/utils/theme-preference.test.ts
  - ?? src/kernel/utils/theme-preference.ts
- Diff stat:
  - package.json | 4 ++--
  - src/components/CommandPalette.tsx | 18 ++++++++++--------
  - src/kernel/services/settings-service.ts | 7 +++----
  - src/theme-init.ts | 32 +++-----------------------------
  - 4 files changed, 18 insertions(+), 43 deletions(-)
- Последние коммиты:
  - d8e9b5c fix(server): scope HTTP API to company bearer
  - 66463ba fix(gateway): whitelist process adapter binaries and env
  - f615d5e fix(server): isolate code-runner env and restrict binaries
  - 09c83d4 fix(audit): bridge dead letters, isolate WAL, gate governance
  - 027f8ed fix(authz): deny implicit system calls, gate AUTOPILOT, secure pairing
