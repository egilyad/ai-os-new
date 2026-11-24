# 2026-11-24 — skill-quality-improvement

Статус: done

## Цель сессии

Поднять качество всех 8 скиллов по результатам SkillEvaluator quality-check.

## Что сделано (файлы + коммиты)

- Во все 8 `SKILL.md` в `~/.config/opencode/skills` добавлены секции `## Purpose`, `## Examples`, `## Error handling`, `## Limitations`, `## Troubleshooting` с триггером `Use for:`.
- Повторный `quality-check`: 92.8/100 (Grade A) у всех 8, предупреждений 79 → 32, `overall_passed=true`.
- Повторный `harness-check`: schema-ошибок нет, `opencode` загружает все 8.
- Статья `dev-skillevaluator` обновлена результатами «после».

## Принятые решения (+ почему; кандидат в ADR?)

- Добавлял структуру, не переписывая содержание скиллов: оценка выросла на +13 баллов минимальной правкой.
- Триггер `Use for:` добавлен на английском — по suggestion самого evaluator'а (`Add trigger context: 'Use for...'`).
- Скиллы лежат вне репозитория: это конфигурация агента, commit в ai-os-new не требуется.

## Обнаруженные проблемы / гипотезы

- Факт: CI-шаблон `skill-checks.yml` пока не заведён — в репозитории нет папки со скиллами, шаблон проверял бы не то. Нужно сначала зеркалировать скиллы в репо или завести отдельный репозиторий скиллов.
- Гипотеза: Tier 2 покажет пересечения между скиллами после добавления одинаковых секций; стоит прогнать перед публикацией каталога.
- Оставшиеся 32 предупреждения — в основном info/low по конкретным правилам, не блокируют.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `skillevaluator quality-check` / `harness-check` — повторный прогон на 8 скиллах.
- ESLint на статье — без замечаний; вика перегенерирована.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Зеркалировать скиллы в репозиторий и завести `skill-checks.yml`; перед этим — `tier2` на дубли.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ b2b31cc
- Изменённых файлов: 7
  - M docs/inventory.json
  - M docs/wiki/dev-reality-map.md
  - M docs/wiki/dev-skillevaluator.md
  - M docs/wiki/docs-inventory.md
  - M src/components/WikiPanel/wiki-skillevaluator.ts
  - M src/generated/wiki-checks.ts
  - M src/generated/wiki-docs-index.ts
- Diff stat:
  - docs/inventory.json | 6 +++---
  - docs/wiki/dev-reality-map.md | 4 ++--
  - docs/wiki/dev-skillevaluator.md | 3 ++-
  - docs/wiki/docs-inventory.md | 6 +++---
  - src/components/WikiPanel/wiki-skillevaluator.ts | 3 ++-
  - src/generated/wiki-checks.ts | 2 +-
  - src/generated/wiki-docs-index.ts | 2 +-
  - 7 files changed, 14 insertions(+), 12 deletions(-)
- Последние коммиты:
  - b2b31cc docs: record SkillEvaluator pilot results
  - cb2594a docs: add NVIDIA SkillEvaluator wiki article
  - c554ea7 fix(a11y): keyboard access to permission matrix cells
  - 9f9cc9b feat(roundtrip): validate export version in global panel
  - ade64eb test(roles): mock framer-motion exit animations in search test
