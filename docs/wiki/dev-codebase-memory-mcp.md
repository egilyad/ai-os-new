<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Codebase Memory MCP: граф кода для агентов

> Раздел: **Разработчикам** · Статус: verified · Теги: dev, mcp, граф, поиск, opencode

Источники: `scripts/opencode/`, `.opencode/command/`, `docs/wiki/dev-opencode-memory.md`

## Что это

**Codebase Memory MCP** (CBM) — локальный MCP-сервер, который индексирует репозиторий в граф знаний (tree-sitter, 158 языков) и отвечает на структурные запросы: символы, вызовы, архитектура, импакт изменений. Работает 100% локально, без API-ключей и телеметрии.

Установлен в `C:/Users/evgeny/AppData/Local/Programs/codebase-memory-mcp/`, подключён как MCP-сервер `codebase-memory` в глобальном `opencode.jsonc`. Индекс хранится вне репозитория, в домашнем кэше пользователя.

## Инструменты (17)

- `search_graph` — поиск символов (BM25/regex, фильтры по полям).
- `trace_path` — трассировка вызовов inbound/outbound, data flow, cross-service (HTTP-связки).
- `get_architecture` — архитектурная сводка (языки, пакеты, entry points, слои, маршруты).
- `detect_changes` — импакт незакоммиченных изменений по git diff.
- `query_graph` — multi-hop запросы (Cypher).
- `check_index_coverage` — проверка, что нужные пути проиндексированы.
- остальные: `get_code_snippet`, `get_file_outline`, `search_code`, `list_projects`, `index_status`, `manage_adr`, и др.

## Особенности

- Первая инициализация сервера медленная (~40 сек); дальнейшие запросы быстрые.
- CLI-режим: `codebase-memory-mcp cli <tool> --args-file <json>` (например, для проверок вне чата).
- Индекс проекта ai-os-new: ~38.7K узлов, ~175K рёбер (функции, методы, классы, интерфейсы, маршруты, каналы EventBus).

## Полезные паттерны

- «Что сломается при изменении X?» → `trace_path` (inbound) по символу X.
- «Как устроен проект?» → `get_architecture` (aspects: structure/boundaries/layers/routes).
- «Найди, где используется сервис Y» → `search_graph` + `trace_path`.
- «Проверь, что я не сломал ничего» → `detect_changes` (git diff → импакт).

## Связанное

- Система памяти OpenCode (команды/скрипты) — [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md).
- MCP-интеграция в целом — [Компонент: интеграции и интероперабельность](./comp-integrations-interop.md).

---

## Связанные материалы

- [Разработчикам: обзор и слои](./dev-overview.md)
- [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md)
- [Компонент: интеграции и интероперабельность](./comp-integrations-interop.md)
- [Граф знаний](./dev-graph.md)

[← Все материалы](./README.md)
