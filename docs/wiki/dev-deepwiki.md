<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# DeepWiki: облачная техническая документация на английском

> Раздел: **Разработчикам** · Статус: documented · Теги: dev, deepwiki, документация, english

Источники: `README.md`, `README_EN.md`

## Что это

**DeepWiki** (deepwiki.com) — облачный сервис от Cognition (создатели Devin). Он индексирует публичный репозиторий и автоматически генерирует профессиональную техническую документацию на английском: обзор архитектуры, разбор подсистем, диаграммы (Mermaid) и чат-запросы по коду («Ask Devin»).

Наш репозиторий: <https://deepwiki.com/egilyad/ai-os-new>. Индексация запускается с главной страницы (email для уведомления) и занимает ~2–10 минут (большие проекты дольше). Обновление вики после изменений ограничено: рефреш доступен раз в 8 дней.

## Использование

- Ссылка добавлена в README и README_EN (раздел «Документация»).
- Готовые страницы покрывают: Kernel Architecture, DI Container, EventBus, Dexie/DAL, Agents & Orchestration, Debate Runtime, LLM Providers & Routing, Chat/Assistant, Knowledge/Memory, Panels, Interoperability, CI/Testing, Glossary.
- Плюс отдельной локальной системы: DeepWiki — внешний (облачный) инструмент; для локального графа кода см. [Codebase Memory MCP: граф кода для агентов](./dev-codebase-memory-mcp.md).

## Ограничения

- Требуется публичный репозиторий (код уходит на серверы Cognition).
- Частота рефреша ограничена (8 дней).
- Документация на английском; для локальной RU-вики используй основной портал [Карта документации](./docs-index.md).

---

## Связанные материалы

- [Разработчикам: обзор и слои](./dev-overview.md)
- [Codebase Memory MCP: граф кода для агентов](./dev-codebase-memory-mcp.md)
- [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md)
- [Карта документации](./docs-index.md)

[← Все материалы](./README.md)
