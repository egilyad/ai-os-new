<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Obsidian Vault: рабочий буфер пользователя (интеграция)

> Раздел: **Разработчикам** · Статус: documented · Теги: dev, obsidian, vault, заметки, интеграция

Источники: `.opencode/command/vault.md`, `.opencode/command/vault-draft.md`, `.opencode/command/vault-saving.md`, `AGENTS.md`

## Что это

Obsidian Vault — локальная папка с Markdown-файлами, которая служит **человеко-ориентированным рабочим буфером** между пользователем, OpenCode и Assistant. Это не замена Wiki (единственный источник истины) и не замена Wiki-Brain — это тонкий внешний слой для заметок, черновиков решений, research-log и личных комментариев.

## Путь и структура

- Vault: `C:\ObsidianData\ObsidianOpenCode\opencode` (переменная `VAULT_ROOT` может переопределять).
- Папки: `inbox/` (новые черновики), `drafts/`, `projects/` (заметки проектов).

## Команды OpenCode

| Команда | Назначение |
| --- | --- |
| `/vault <запрос>` | Поиск и чтение заметок Vault (grep + чтение 1–3 файлов) |
| `/vault-draft` | Создать новую заметку-черновик в `inbox/` с YAML frontmatter |
| `/vault-saving` | Сохранить результат сессии/решения как черновик в `inbox/` |

## Правила и безопасность

- Vault для агента — **read-only reference**: существующие заметки не редактируются.
- Разрешено только создание новых файлов в `inbox/`/`drafts/`.
- Перед записью в Vault — подтверждение пользователя.
- Заметки цитируются с путём (provenance).

## Связь с системой

- Vault дополняет `docs/sessions/` (контрольные точки) и `docs/wiki/` (каноническая документация).
- Черновики могут «созревать» в статьи Wiki через генераторы `gen:wiki-*`.
- Obsidian URI (`obsidian://open?vault=...&file=...`) позволяет открывать заметки из любого места.

---

## Связанные материалы

- [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md)
- [DeepWiki: облачная техническая документация на английском](./dev-deepwiki.md)
- [Разработчикам: обзор и слои](./dev-overview.md)

[← Все материалы](./README.md)
