# 2026-11-23 — export-version-guard

Статус: done

## Цель сессии

Э3.1: защитить глобальный round-trip от несовместимых файлов и уточнить фактическое покрытие панелей.

## Что сделано (файлы + коммиты)

- `src/components/ExportImportPanel/export-version.ts` — `EXPORT_VERSION` и `validateExportVersion`: файлы без версии принимаются (legacy), нестроковая/неизвестная версия отвергается.
- `src/components/ExportImportPanel.tsx` — экспорт использует константу, импорт проверяет версию до разбора секций.
- `src/components/ExportImportPanel/export-version.test.ts` — 2 теста; добавлен в `test:stable`.
- Единый роадмап — уточнено покрытие Э3.1.

## Принятые решения (+ почему; кандидат в ADR?)

- Аудит показал: `ExportImportPanel` уже имеет 11 секций с export/import — старый пункт «9 панелей без импорта» в основном закрыт, точечная оболочка нужна только там, где экспорт живёт вне глобального панеля.
- Отсутствие `version` трактуется как legacy-файл: старые бэкапы пользователей должны импортироваться.
- Неизвестная версия — явная ошибка, а не попытка импортировать непонятные данные.

## Обнаруженные проблемы / гипотезы

- Факт: `vitest` с пулом `forks` не смог поднять воркер на слабом ПК; тест прогнан с `--pool=threads` — 2/2.
- Гипотеза: стоит добавить `--pool=threads` в локальные точечные проверки, но не менять CI-конфиг без причины.
- ESLint: 0 ошибок, 9 предсуществующих предупреждений.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run export-version.test.ts --pool=threads` — 2/2.
- ESLint на трёх файлах — 0 ошибок.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Обновить вики-статью о round-trip с фактическим покрытием (11 секций + 3 точечных пилота) и вернуться к Э3.4 (demo-провайдер) или a11y-остатку.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ ade64eb
- Изменённых файлов: 4
  - M package.json
  - M src/components/ExportImportPanel.tsx
  - ?? src/components/ExportImportPanel/export-version.test.ts
  - ?? src/components/ExportImportPanel/export-version.ts
- Diff stat:
  - package.json | 4 ++--
  - src/components/ExportImportPanel.tsx | 5 ++++-
  - 2 files changed, 6 insertions(+), 3 deletions(-)
- Последние коммиты:
  - ade64eb test(roles): mock framer-motion exit animations in search test
  - 83a1c27 feat(roundtrip): add versioned export to permission matrix
  - 5f9f7d0 feat(roundtrip): add versioned envelope to provider export
  - caf15fd feat(roundtrip): add id deduplication and import modes
  - 5327806 feat(memory): add versioned export and validated import
