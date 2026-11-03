# Спецификация: Плагинная система

> Статус: готово к реализации. Приоритет: P2. Обоснование: `NEW_COMPONENTS №1`, `ROADMAP_09 §P3`.
> Источники: VS Code extensions (contributes/activationEvents), Chrome MV3 (permissions/sandbox), Obsidian, n8n.

---

## 1. Цель

- Подключать сторонние модули (сервисы, панели, инструменты, MCP-серверы, подписки на события) без правки ядра.
- Безопасно (изоляция + принцип минимальных привилегий).

## 2. Манифест плагина (схема)

```jsonc
{
  "id": "publisher.plugin-id",
  "name": "...",
  "description": "...",
  "version": "1.2.0",
  "engines": { "os": "^0.1.0" }, // минимальная версия ядра (SemVer)
  "activationEvents": ["onTool:search", "onEvent:agent:start"],
  "contributes": {
    "services": [{ "id": "search-provider" }],
    "panels": [
      { "id": "main", "titleKey": "plugin.x.main", "entry": "ui/index.html" },
    ],
    "tools": [
      {
        "name": "search",
        "schema": "schemas/search.json",
        "handler": "handlers/search.js",
      },
    ],
    "mcpServers": [{ "name": "my-mcp" }],
    "subscriptions": [
      { "event": "agent:start", "handler": "handlers/onAgentStart.js" },
    ],
  },
  "permissions": [
    "storage:local",
    "fetch:https://api.example.com",
    "ui:panel",
    "event:subscribe:agent:start",
  ],
}
```

## 3. Безопасная изоляция (реализуемо сегодня)

- **Логика/агенты** → Web Worker (нет DOM; ограничить fetch через allowlist-прокси).
- **UI/панели** → sandboxed iframe (`sandbox="allow-scripts allow-forms"` **без** `allow-same-origin`), связь через `postMessage` + проверка `event.origin` и схемы сообщений.
- **Хост**: строгий CSP (script-src nonce, object-src none) — защита от инъекций.
- **Сеть**: только через allowlist-прокси (permission `fetch:<origin>`), не произвольный fetch.
- **Секреты**: никогда не передавать в контекст плагина; только через RPC-мост с авторизацией.
- **Ресурсы**: таймауты/квоты в Worker; watchdog; per-plugin limits.

## 4. Хост-менеджер

- `src/kernel/services/plugins/plugin-registry.ts` — реестр (id→manifest+р).
- `plugin-loader.ts` — чтение манифеста, валидация (Zod), подключение.
- `plugin-host.ts` — для « (iframes), RPC-мост (postMessage), CSP.
- `plugin-worker.ts` — изоляция логики (Worker), API `context.registerService(...)`.
- Регистрация в DI: `register('pluginRegistry', ...)`; `pluginLoader` интегрируется с `Container`/`lazyService`.

## 5. Интеграция с приложением

- Сервисы: через `context.registerService(id, impl)` (как LSP); DI хоста разрешает только `permissions`-сервисы.
- Панели: `contributes.panels` → хост добавляет маршрут в `route-registry`/`route-imports` (динамически) + lazy-iframe.
- Инструменты: `contributes.tools` → регистрация в `ToolService` (активация по `onTool:<name>`).
- MCP: `contributes.mcpServers` → `MCPService` (клиент к внешнему серверу или встроенный).
- События: `contributes.subscriptions` → подписка на `EventBus` (активация по `onEvent:<имя>`).

## 6. Версионирование/совместимость

- `engines.os` — мин. версия ядра; breaking changes только в мажорной версии ядра + миграционный слой.
- Proposed API (preview) — флаг, запрет в прод-плагинах без согласия.

## 7. Безопасность: чек-лист

- Не комбинировать `allow-scripts` + `allow-same-origin` в iframe.
- Проверять `event.origin` и валидировать схему сообщений.
- Запрет удалённо хостируемого кода (MV3-принцип).
- Creds/токены только через мост с авторизацией.

## 8. UI

- `PluginMarketplacePanel` (локальный каталог), `PluginManagerPanel` (установленные: включить/выключить/версии/permissions).

## 9. Тесты

- Манифест: валидация, versioning, permissions.
- Изоляция: iframe/Worker границы, отсутствие утечки origin, CSP.
- Интеграция: плагин добавляет панель/инструмент/сервис/событие → работает.
- Безопасность: неавторизованный доступ блокируется.

## 10. Definition of Done

- Плагин (манифест) подключается без правки ядра; панель/инструмент/сервис/событие работают; изоляция и permissions подтверждены тестами; UI-каталог есть.
