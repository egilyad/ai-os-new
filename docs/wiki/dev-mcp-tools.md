<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# MCP-инструменты OpenCode: сводный каталог

> Раздел: **Разработчикам** · Статус: documented · Теги: dev, mcp, инструменты, opencode, каталог

Источники: `opencode.jsonc`, `AGENTS.md`, `.opencode/command/`

## Подключённые MCP-серверы

| Сервер | Тип | Что даёт | Инструменты |
| --- | --- | --- | --- |
| **Context7** | remote | Актуальная документация библиотек/API | `resolve-library-id`, `query-docs` |
| **Codebase Memory (CBM)** | local | Граф кода: символы, вызовы, архитектура | `search_graph`, `trace_path`, `get_architecture`, `detect_changes`, `query_graph` |
| **desk-mcp (Computer Use)** | local | Управление рабочим столом Windows | `computer_*` (46 шт: экран, мышь, клавиатура, окна, OCR, UIA, браузер CDP) |
| **Playwright** | local | Браузерная автоматизация | `playwright_*` |
| **aios-tasks** | local | AGEMS-задачи для внешних агентов | `task_list/get/create/next/claim/release/set_status/delete` |

## Команды OpenCode

| Команда | Назначение |
| --- | --- |
| `/context` | Собрать контекст: git + сессии + контрольные точки + wiki |
| `/status` | Снимок состояния проекта |
| `/checkpoint <slug>` | Контрольная точка в docs/sessions/ |
| `/sessions <запрос>` | Поиск по прошлым сессиям |
| `/wiki <тема>` | Поиск статей по manifest.json |
| `/check` | Уровни проверок L0-L4 |
| `/vault`, `/vault-draft`, `/vault-saving` | Obsidian Vault: чтение, черновики |
| `/autonomy-status`, `/autonomy-next`, `/autonomy-complete` | Autonomy Governor: автономная работа по плану |
| `/import-roadmap <файл>` | Парсит роадмап в задачи (кандидаты в AGEMS) |
| `/ci` | Статус последних GitHub Actions ранов |

## Скрипты (scripts/opencode/)

`session-index`, `context-build`, `project-state`, `checkpoint`, `session-search`, `wiki-find`, `stats`, `autonomy-state`, `autonomy-next`, `import-roadmap`, `ci-status`.

## Установленные сторонние инструменты

- **desk-mcp** (Computer Use): `C:\Users\evgeny\AppData\Local\Programs\desk-mcp` — требует исключение Defender (AMSI).
- **Codebase Memory MCP**: `C:\Users\evgeny\AppData\Local\Programs\codebase-memory-mcp`.
- **Context7**: remote MCP, API-ключ в глобальном конфиге.

## Безопасность

- Bash: всё allow, кроме необратимого (`git reset --hard`, `rm -rf`, `format`, `*opencode.db*`).
- `computer_launch`/`computer_close_window` требуют `confirm: true`.
- MCP-inструменты работают в рамках глобальных разрешений.

---

## Связанные материалы

- [Codebase Memory MCP: граф кода для агентов](./dev-codebase-memory-mcp.md)
- [Computer Use: управление рабочим столом Windows (desk-mcp)](./dev-computer-use.md)
- [Obsidian Vault: рабочий буфер пользователя (интеграция)](./dev-obsidian-vault.md)
- [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md)
- [Autonomy Governor: автономная работа по плану](./dev-autonomy-governor.md)
- [DeepWiki: облачная техническая документация на английском](./dev-deepwiki.md)

[← Все материалы](./README.md)
