# 2026-11-24 — skillevaluator-pilot

Статус: done

## Цель сессии

Практический пилот SkillEvaluator: установить CLI, проверить наши скиллы и зафиксировать результаты.

## Что сделано (файлы + коммиты)

- venv в temp, Python 3.14.7, `skillevaluator` 1.0.1 (`pip install skillevaluator`).
- `harness-check ~/.config/opencode/skills` — найдено 8 ошибок frontmatter (неэкранированное двоеточие в `description`); все 8 `SKILL.md` исправлены (значения в кавычках).
- Повторный `harness-check` — schema-ошибок нет, `opencode` загружает все 8 скиллов; остальные харнессы выдают `not found` из-за расположения.
- `quality-check` — `overall_passed=true`, 0 critical/high, 79 warnings / 13 уникальных правил; `docs-writing` 81.2 (B), остальные 79.5 (C).
- `src/components/WikiPanel/wiki-skillevaluator.ts` — добавлен раздел «Пилот 23.11» с результатами; вика перегенерирована.

## Принятые решения (+ почему; кандидат в ADR?)

- Скиллы правились в пользовательских каталогах вне репозитория — это конфигурация агента, не код проекта.
- Двоеточия в `description` обёрнуты в двойные кавычки: это минимальное исправление, не меняющее содержание.
- Отчёты сохранены в temp, не в репозиторий — они периодические, а не исходники.

## Обнаруженные проблемы / гипотезы

- Факт: все 8 скиллов имели синтаксически невалидный YAML, при этом OpenCode их загружал — классический случай «скилл есть, но парсеры расходятся».
- Гипотеза: добавление `## Purpose`, примеров, обработки ошибок и `## Limitations` поднимет баллы до 85–90; это следующий улучшающий шаг.
- Локация скиллов мешает кросс-харнесной проверке: для `codex`/`claude-code` нужны зеркала в их каталогах.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `skillevaluator harness-check` / `quality-check` — прогон на 8 скиллах, отчёты JSON.
- ESLint на статье — без замечаний; docs:health зелёный после перегенерации.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Добавить в скиллы секции Purpose/Examples/Limitations и повторить quality-check; завести CI-шаблон `skill-checks.yml`.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ cb2594a
- Изменённых файлов: 8
  - M docs/inventory.json
  - M docs/wiki/dev-reality-map.md
  - M docs/wiki/dev-skillevaluator.md
  - M docs/wiki/docs-health.md
  - M docs/wiki/docs-inventory.md
  - M src/components/WikiPanel/wiki-skillevaluator.ts
  - M src/generated/wiki-checks.ts
  - M src/generated/wiki-docs-index.ts
- Diff stat:
  - docs/inventory.json | 6 +++---
  - docs/wiki/dev-reality-map.md | 6 +++---
  - docs/wiki/dev-skillevaluator.md | 16 ++++++++++++++++
  - docs/wiki/docs-health.md | 5 ++---
  - docs/wiki/docs-inventory.md | 10 +++++-----
  - src/components/WikiPanel/wiki-skillevaluator.ts | 16 ++++++++++++++++
  - src/generated/wiki-checks.ts | 2 +-
  - src/generated/wiki-docs-index.ts | 2 +-
  - 8 files changed, 47 insertions(+), 16 deletions(-)
- Последние коммиты:
  - cb2594a docs: add NVIDIA SkillEvaluator wiki article
  - c554ea7 fix(a11y): keyboard access to permission matrix cells
  - 9f9cc9b feat(roundtrip): validate export version in global panel
  - ade64eb test(roles): mock framer-motion exit animations in search test
  - 83a1c27 feat(roundtrip): add versioned export to permission matrix
