<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# GitHub workflow: MCP, команды и автономия

> Раздел: **Разработчикам** · Статус: documented · Теги: dev, github, mcp, ci, команды, opencode

Источники: `opencode.jsonc`, `.opencode/command/sync.md`, `.opencode/command/pr.md`, `.opencode/command/ci.md`, `.opencode/agent/pr-reviewer.md`, `.opencode/skills/github-workflow/SKILL.md`

## Что это

Набор интеграций OpenCode с GitHub: официальный GitHub MCP-сервер, команды
`/sync`, `/pr`, `/ci`, агент-ревьюер `pr-reviewer` и скилл `github-workflow`
(правила коммитов/пушей/CI).

## Состав

**GitHub MCP** (`opencode.jsonc` → `mcp.github`):
- remote-сервер `https://api.githubcopilot.com/mcp/`, авторизация `Bearer {env:GITHUB_TOKEN}`.
- Нативные инструменты для issues/PR/checks.

**Команды** (`.opencode/command/`):
- `/sync` — безопасная синхронизация: `git fetch origin` + `git pull --ff-only` + статус.
- `/pr` — создать/обновить PR из текущей ветки (base=main), вернуть ссылку.
- `/ci` — статус GitHub Actions для последнего коммита/PR.

**Агент** (`.opencode/agent/pr-reviewer.md`): субагент-ревьюер, без права правки
(edit=deny), читает diff/checks через GitHub MCP и даёт вердикт.

**Скилл** (`.opencode/skills/github-workflow/SKILL.md`): правила — коммиты только по явной
просьбе либо авто-пуш в конце сессии; commitlint (заголовок ≤100 символов, нижний регистр);
запреты (`git reset --hard`, `git clean`, `git push --force`, `rm -rf`).

## Правила работы

1. `git status -sb` → `git add -A` → `git commit` (корректный заголовок) → `git push origin main`.
2. После пуша — `/ci` (или GitHub MCP); при красном прогоне — фиксить до зелёного.
3. PR — через `/pr`, ревью — через агента `pr-reviewer`.

## Связанное

- Карточки этих команд — в [OpenCode Sidekick: шпаргалка по командам и центр управления](./dev-opencode-sidekick.md).
- Система памяти и команды — [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md).
- CI-пайплайн — [Разработчикам: ворота качества и CI](./dev-ci.md).

---

## Связанные материалы

- [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md)
- [OpenCode Sidekick: шпаргалка по командам и центр управления](./dev-opencode-sidekick.md)
- [Разработчикам: ворота качества и CI](./dev-ci.md)
- [MCP-инструменты OpenCode: сводный каталог](./dev-mcp-tools.md)

[← Все материалы](./README.md)
