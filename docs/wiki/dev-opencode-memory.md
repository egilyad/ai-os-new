<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Память OpenCode: команды и скрипты непрерывности сессий

> Раздел: **Разработчикам** · Статус: verified · Теги: dev, opencode, память, контекст, контрольные точки

Источники: `scripts/opencode/session-index.mjs`, `scripts/opencode/context-build.mjs`, `scripts/opencode/project-state.mjs`, `scripts/opencode/checkpoint.mjs`, `scripts/opencode/session-search.mjs`, `scripts/opencode/wiki-find.mjs`, `scripts/opencode/stats.mjs`, `.opencode/command/`, `.superagents/memory/`

## Зачем

OpenCode не переносит контекст между сессиями. Чтобы новая сессия начиналась осведомлённо, в проекте есть система памяти: скрипты в `scripts/opencode/`, команды в `.opencode/command/` и артефакты в `.superagents/memory/`.

## Команды (slash-commands)

| Команда | Назначение |
| --- | --- |
| `/context` | Собрать контекст: git + последние сессии + контрольные точки + wiki-подсказки |
| `/status` | Снимок состояния: ветка, грязные файлы, stash, незапушенное, последняя точка |
| `/checkpoint <slug>` | Создать контрольную точку `docs/sessions/YYYY-MM-DD-<slug>.md` по шаблону |
| `/sessions <запрос>` | Поиск по прошлым сессиям (`--dir`, `--open`, `--since`, `--limit`) |
| `/wiki <тема>` | Поиск статей по `docs/manifest.json` |
| `/check` | Подбор уровня проверок L0–L4 (не гонять тяжёлое локально) |

## Скрипты (read-only, кроме checkpoint)

- `session-index.mjs` — читает локальную БД OpenCode (SQLite, только чтение) и строит `.superagents/memory/session-index.json` (метаданные сессий, без содержимого частей).
- `context-build.mjs` — генерирует `.superagents/memory/context.md` (выжимка ≤150 строк со ссылками; в промпт целиком не попадает).
- `project-state.mjs` — Git-состояние + последняя контрольная точка (для `/status`).
- `checkpoint.mjs` — создаёт контрольную точку с авто-фактами (git, diff, todo).
- `session-search.mjs` — поиск по индексу сессий.
- `wiki-find.mjs` — поиск статей/панелей по манифесту.
- `stats.mjs` — актуальные счётчики проекта (contracts/services/panels/events).

## Контрольные точки

Хранятся в `docs/sessions/` по шаблону: цель, сделано (файлы + коммиты), решения, проблемы/гипотезы, проверки, следующий логический шаг. Коммитятся вместе с работой — история сохраняется в git.

## Правило регенерации вики

Любое изменение `.md`/`.json` (включая `AGENTS.md` и `.superagents/memory/`) требует перегенерировать вики-артефакты (`npm run gen:wiki-*`), иначе CI упадёт на шаге «Wiki docs in sync».

## Связанное

- Инструмент «Codebase Memory MCP» (граф кода) — [Codebase Memory MCP: граф кода для агентов](./dev-codebase-memory-mcp.md).
- Общие практики разработки — [Разработчикам: обзор и слои](./dev-overview.md), [Скрипты и CLI](./dev-scripts.md).

---

## Связанные материалы

- [Разработчикам: обзор и слои](./dev-overview.md)
- [Скрипты и CLI](./dev-scripts.md)
- [Граф знаний](./dev-graph.md)
- [Карта документации](./docs-index.md)

[← Все материалы](./README.md)
