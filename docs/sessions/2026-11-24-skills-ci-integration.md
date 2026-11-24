# 2026-11-24 — skills-ci-integration

Статус: done

## Цель сессии

Встроить проверку скиллов в CI репозитория и синхронизировать пользовательские скиллы с репозиторием.

## Что сделано (файлы + коммиты)

- `scripts/sync-agent-skills.mjs` + npm-скрипт `sync:skills` — копирует `SKILL.md` из `~/.config/opencode/skills` в `.opencode/skills`, пропуская неизменённые.
- Зеркало 8 скиллов закоммичено в `.opencode/skills/` (плюс существующий `github-workflow`).
- `.github/workflows/skill-checks.yml` — reusable workflow NVIDIA SkillEvaluator 1.0.1, `paths: .opencode/skills`, `min-score: 85`, `llm: false`.
- Статья `dev-skillevaluator` дополнена разделом «Внедрение в репозиторий».

## Принятые решения (+ почему; кандидат в ADR?)

- Зеркало в репозитории, а не прямой доступ CI к домашней папке: CI не имеет доступа к пользовательской конфигурации.
- Синхронизация через явный скрипт, а не автокопирование при сборке: изменения скиллов остаются видимыми в diff.
- Порог 85 выбран по фактическому минимуму (87.2) с запасом; при падении качества гейт сразу покажет регрессию.

## Обнаруженные проблемы / гипотезы

- Факт: Tier 2 требует провайдера эмбеддингов и ключа — без него не запускается; в CI пока только Tier 1.
- Гипотеза: при росте числа скиллов понадобится `skill-catalog.json` и отдельный job Tier 2 с ключом.
- Publication eligibility остаётся `Incomplete` — безопасность и живая оценка не пройдены.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `quality-check .opencode/skills` — 9/9 проходят, минимум 87.2 (A/B), 0 ошибок.
- ESLint на скрипте и статье — без замечаний; вика перегенерирована.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Дождаться первого прогона `Skill checks` в GitHub Actions; при необходимости поднять `github-workflow` до A и подключить Tier 2 с ключом.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 2cb21f6
- Изменённых файлов: 18
  - M docs/inventory.json
  - M docs/wiki/dev-reality-map.md
  - M docs/wiki/dev-skillevaluator.md
  - M docs/wiki/docs-inventory.md
  - M package.json
  - M src/components/WikiPanel/wiki-skillevaluator.ts
  - M src/generated/wiki-checks.ts
  - M src/generated/wiki-docs-index.ts
  - ?? .github/workflows/skill-checks.yml
  - ?? .opencode/skills/code-review/
- Diff stat:
  - docs/inventory.json | 6 +++---
  - docs/wiki/dev-reality-map.md | 4 ++--
  - docs/wiki/dev-skillevaluator.md | 7 +++++++
  - docs/wiki/docs-inventory.md | 6 +++---
  - package.json | 1 +
  - src/components/WikiPanel/wiki-skillevaluator.ts | 7 +++++++
  - src/generated/wiki-checks.ts | 2 +-
  - src/generated/wiki-docs-index.ts | 2 +-
  - 8 files changed, 25 insertions(+), 10 deletions(-)
- Последние коммиты:
  - 2cb21f6 docs: record skill quality uplift to grade A
  - b2b31cc docs: record SkillEvaluator pilot results
  - cb2594a docs: add NVIDIA SkillEvaluator wiki article
  - c554ea7 fix(a11y): keyboard access to permission matrix cells
  - 9f9cc9b feat(roundtrip): validate export version in global panel
