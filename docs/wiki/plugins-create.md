<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Как написать свой плагин

> Раздел: **Разработчикам** · Статус: verified · Теги: разработчикам, плагины, SPEC_06

Источники: `src/kernel/contracts/plugin.ts`, `src/kernel/services/plugins/plugin-manifest.ts`, `src/kernel/services/plugins/plugin-marketplace-catalog.ts`

Проверено по коду: 2026-11-09 · mercury

## Минимальный манифест

```json
{
  "id": "my.plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "engines": { "os": "4.5.0" },
  "contributes": {
    "tools": [{ "name": "my.hello", "handler": "handlers/hello.js" }]
  },
  "permissions": ["tool:my.hello"]
}
```

Требования валидатора: id (dotted), name, semver-version, engines.os, contributes + permissions.

## Шаг 1: инструмент

1. Добавь `contributes.tools` и permission `tool:<name>`.
2. Подключи манифест через `PluginLoader.load(manifest, executor)`, где executor — функция `(name, args) => Promise<string>`.
3. Во время исполнения worker может запросить `executeTool` — хост проверит, что инструмент в `allowedTools`, и вызовет executor.

## Шаг 2: панель

1. Добавь `contributes.panels`: `{ "id": "my.dashboard", "entry": "panels/dashboard.html" }`.
2. Создай HTML-файл по пути entry (автономный, без доступа к localStorage приложения).
3. После установки панель появится в сайдбаре и по адресу `/plugin/my.dashboard`.

## Шаг 3: сервис и подписки

- `contributes.services`: `[{ "id": "my.provider" }]` + permission `service:my.provider`; обработчик передаётся в `loader.load(..., serviceHandlers)`.
- `contributes.subscriptions`: `[{ "event": "agent:start" }]` + permission `event:subscribe:agent:start`; обработчик — в аргументе eventHandler.

## Как зарегистрировать плагин в системе

```ts
import { PluginLoader } from '../kernel/services/plugins/plugin-loader';
import { validateManifest } from '../kernel/services/plugins/plugin-manifest';

const manifest = { /* как выше */ };
const validation = validateManifest(manifest);
if (!validation.ok) throw new Error(validation.errors.join('; '));

const loader = new PluginLoader({ registry, host, enforceToolPermissions: true });
await loader.load(manifest, executor, context, eventHandler, serviceHandlers);
```

Для демонстрации добавь свой манифест в `plugin-marketplace-catalog.ts` — он появится в маркетплейсе.

## Рекомендации

- Инструменты должны возвращать строки (JSON-сериализуемое).
- Не используй глобальные синглтоны приложения — только порты, которые даёт хост.
- Проверяй валидность манифеста до загрузки.

---

## Связанные материалы

- [Плагины: возможности и использование](./plugins-guide.md)
- [Плагины](./panel-plugins.md)

[← Все материалы](./README.md)
