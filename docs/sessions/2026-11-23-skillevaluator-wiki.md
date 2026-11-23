# 2026-11-23 — skillevaluator-wiki

Статус: done

## Цель сессии

Изучить NVIDIA SkillEvaluator и добавить статью в вику с планом внедрения в SuperAgents OS и локальные скиллы.

## Что сделано (файлы + коммиты)

- `src/components/WikiPanel/wiki-skillevaluator.ts` — статья `dev-skillevaluator`: три tiers, команды, Harness Check (включая `opencode`), методология Skill Lift с цифрами из блога NVIDIA, план внедрения в 6 шагов, ограничения.
- `src/components/WikiPanel/wiki-articles.ts` — статья добавлена в корпус.
- `docs/wiki/dev-skillevaluator.md` — сгенерирован.
- Единый роадмап — упоминание в исследовательском бэклоге.

## Принятые решения (+ почему; кандидат в ADR?)

- Статья добавлена в исходный корпус WikiPanel, а не напрямую в `docs/wiki/` — иначе gen-wiki-* перезапишет её.
- `freshness: 'documented'`: инструмент внешний, процитированы первоисточники (GitHub, docs, технический блог), но локально CLI не запускался.
- План внедрения разделён на keyless-гейт (Tier 1) и платные/песочные tiers — чтобы не блокировать слабый ПК.

## Обнаруженные проблемы / гипотезы

- Факт: Harness Check 1.0.1 поддерживает OpenCode — это прямо покрывает наши скиллы в `~/.config/opencode/skills` и `~/.agents/skills`.
- Гипотеза: для браузерного ядра нужен серверный контур (sidecar/sync-server), так как CLI на Python не запускается из браузера.
- Источники носят experimental-статус без SLA; профили харнессов привязаны к версиям.

## Результаты проверок (typecheck/lint/test — что запускалось)

- Полная перегенерация вики — OK; `docs:health` — OK.
- ESLint на двух файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Практический пилот: установить CLI в venv, прогнать `harness-check` по папкам скиллов, завести CI-шаблон `skill-checks.yml` и сохранить отчёты.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ c554ea7
- Изменённых файлов: 16
  - M docs/graph.json
  - M docs/inventory.json
  - M docs/manifest.json
  - M docs/wiki/README.md
  - M docs/wiki/dev-checks.md
  - M docs/wiki/dev-reality-map.md
  - M docs/wiki/docs-index.md
  - M docs/wiki/docs-inventory.md
  - M src/components/WikiPanel/wiki-articles.ts
  - M src/generated/wiki-checks.ts
- Diff stat:
  - docs/graph.json | 54 +++++++++++++++++++++++++++----
  - docs/inventory.json | 12 +++----
  - docs/manifest.json | 31 +++++++++++++++++-
  - docs/wiki/README.md | 7 ++--
  - docs/wiki/dev-checks.md | 2 +-
  - docs/wiki/dev-reality-map.md | 6 ++--
  - docs/wiki/docs-index.md | 3 +-
  - docs/wiki/docs-inventory.md | 6 ++--
  - src/components/WikiPanel/wiki-articles.ts | 2 ++
  - src/generated/wiki-checks.ts | 2 +-
  - src/generated/wiki-coverage.ts | 2 +-
  - src/generated/wiki-docs-health.ts | 2 +-
  - src/generated/wiki-docs-index.ts | 2 +-
  - src/generated/wiki-graph.ts | 2 +-
  - 14 files changed, 104 insertions(+), 29 deletions(-)
- Последние коммиты:
  - c554ea7 fix(a11y): keyboard access to permission matrix cells
  - 9f9cc9b feat(roundtrip): validate export version in global panel
  - ade64eb test(roles): mock framer-motion exit animations in search test
  - 83a1c27 feat(roundtrip): add versioned export to permission matrix
  - 5f9f7d0 feat(roundtrip): add versioned envelope to provider export
