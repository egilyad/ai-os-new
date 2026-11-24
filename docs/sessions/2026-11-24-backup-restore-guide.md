# 2026-11-24 — backup-restore-guide

Статус: done

## Цель сессии

Э3.4: инструкция по резервному копированию и восстановлению SuperAgents OS.

## Что сделано (файлы + коммиты)

- `src/components/WikiPanel/wiki-backup-guide.ts` — статья `guide-backup-restore`: экспорт/импорт браузерных данных через `/export-import`, версия формата, пароль, порядок восстановления, ограничения, CLI `db-backup`, чеклист проверки бэкапа.
- `src/components/WikiPanel/wiki-articles.ts` — статья добавлена в корпус.
- `docs/wiki/guide-backup-restore.md` — сгенерирован.
- Единый роадмап — Э3.4 обновлена.

## Принятые решения (+ почему; кандидат в ADR?)

- Статья добавляется в исходный корпус WikiPanel, не в `docs/wiki/` напрямую — генераторы перезаписывают docs.
- Разделены два хранилища: IndexedDB браузера (ExportImportPanel) и серверные JSON/bin (`db-backup`) — это разные бэкапы.
- В порядке восстановления vault/ключи идут первыми: без разблокированного хранилища импорт ключей может быть пропущен.

## Обнаруженные проблемы / гипотезы

- Факт: первая версия статьи ссылалась на несуществующий slug `panel-export-import`; docs-health поймал 2 hard-проблемы, ссылка заменена на `comp-flow-restore`.
- Гипотеза: стоит добавить отдельную wiki-статью для панели `/export-import` — сейчас маршрут есть, статьи нет.
- Автоматической проверки «бэкап разворачивается» нет — только ручной чеклист.

## Результаты проверок (typecheck/lint/test — что запускалось)

- ESLint на двух файлах — без замечаний.
- Полная перегенерация вики + `docs:health` — OK.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

E2E с негативными ветками (таймаут провайдера, отмена, чтение истории после reload) и Э3.3 (SSoT: theme mirror, выбор дебата, provider/ключ-состояние).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ e089be9
- Изменённых файлов: 19
  - M docs/graph.json
  - M docs/inventory.json
  - M docs/manifest.json
  - M docs/wiki/README.md
  - M docs/wiki/coverage-matrix.md
  - M docs/wiki/dev-checks.md
  - M docs/wiki/dev-graph.md
  - M docs/wiki/dev-reality-map.md
  - M docs/wiki/docs-health.md
  - M docs/wiki/docs-index.md
- Diff stat:
  - docs/graph.json | 83 ++++++++++++++++++++++++++++---
  - docs/inventory.json | 18 +++----
  - docs/manifest.json | 33 +++++++++++-
  - docs/wiki/README.md | 7 +--
  - docs/wiki/coverage-matrix.md | 8 +--
  - docs/wiki/dev-checks.md | 20 ++++----
  - docs/wiki/dev-graph.md | 14 +++---
  - docs/wiki/dev-reality-map.md | 12 ++---
  - docs/wiki/docs-health.md | 21 +++++---
  - docs/wiki/docs-index.md | 8 +--
  - docs/wiki/docs-inventory.md | 6 +--
  - src/components/WikiPanel/wiki-articles.ts | 2 +
  - src/generated/wiki-checks.ts | 2 +-
  - src/generated/wiki-coverage.ts | 2 +-
  - src/generated/wiki-docs-health.ts | 2 +-
  - src/generated/wiki-docs-index.ts | 2 +-
  - src/generated/wiki-graph.ts | 2 +-
  - 17 files changed, 176 insertions(+), 66 deletions(-)
- Последние коммиты:
  - e089be9 feat(onboarding): enable local mock demo provider
  - ed7fa93 ci: gate mirrored agent skills with SkillEvaluator
  - 2cb21f6 docs: record skill quality uplift to grade A
  - b2b31cc docs: record SkillEvaluator pilot results
  - cb2594a docs: add NVIDIA SkillEvaluator wiki article
