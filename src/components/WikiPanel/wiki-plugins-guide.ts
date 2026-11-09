import type { WikiArticle } from './wiki-types';

/**
 * Плагинная система (SPEC_06 / P3-1): что есть, как использовать,
 * как написать собственный плагин.
 */
export const PLUGINS_GUIDE_ARTICLES: WikiArticle[] = [
    {
        slug: 'plugins-guide',
        title: 'Плагины: возможности и использование',
        section: 'dev',
        tags: ['разработчикам', 'плагины', 'SPEC_06'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/plugins/plugin-host.ts',
            'src/kernel/services/plugins/plugin-loader.ts',
            'src/kernel/contracts/plugin.ts',
            'src/components/PluginManagerPanel.tsx',
            'src/components/PluginMarketplacePanel.tsx',
        ],
        related: ['plugins-create', 'panel-plugins', 'panel-plugin-marketplace', 'dev-status-debt'],
        reviewed: { at: '2026-11-09', by: 'mercury' },
        body: `## Что такое плагин

Плагин — это самодостаточный модуль с манифестом (JSON), который расширяет систему через декларативный блок \`contributes\`. Ядро не знает внутренностей плагина: всё, что плагин умеет, описано в манифесте и исполняется через изолированные порты.

## Что плагин умеет (contributes)

| Блок | Что даёт | Порт исполнения |
|---|---|---|
| \`tools\` | Новые инструменты для агентов и дебатов | \`PluginHost\` → \`ToolService\` |
| \`panels\` | Новые панели UI (маршрут \`/plugin/<id>\`) | \`PluginPanelFrame\` (iframe) |
| \`services\` | Сервисы плагина, вызываемые по id | \`PluginHost.callService\` |
| \`mcpServers\` | Встроенные локальные MCP-серверы | \`PluginHost\` → \`MCPService\` |
| \`subscriptions\` | Подписки на события EventBus | \`PluginHost.registerSubscriptions\` |

## Права (permissions)

Манифест обязан декларировать permissions:
- \`tool:*\` или \`tool:<name>\` — инструменты (при включённом \`enforceToolPermissions\` плагин без них не загрузится);
- \`event:subscribe:<event>\`, \`mcp:<server>\`, \`service:<id>\` — аналогично.

## Как использовать готовые плагины

1. Открой панель **Плагины** (\`/plugins\`): статусы, активация/деактивация, списки панелей и инструментов.
2. Открой **Плагины — маркетплейс** (\`/plugin-marketplace\`): встроенный каталог демо-плагинов с кнопками «Установить» / «Удалить».
3. Установленные панели появляются в сайдбаре (секция «Плагины») и открываются по \`/plugin/<id>\` в sandboxed iframe (\`allow-scripts\`, без \`allow-same-origin\`).

## Каталог демо-плагинов

Встроенные примеры (src/kernel/services/plugins/plugin-marketplace-catalog.ts):
- \`demo.search\` — инструмент + подписка на событие;
- \`demo.weather\` — инструмент;
- \`demo.mcp\` — встроенный MCP-сервер;
- \`demo.service\` — сервис плагина.

## Безопасность

- Код инструментов исполняется в изолированном Web Worker (\`PluginWorkerClient\`), без доступа к DOM/window/localStorage.
- Панели — в sandboxed iframe (без same-origin).
- Таймауты, лимиты вызовов инструментов (10) и политика permissions встроены в хост.`,
    },
    {
        slug: 'plugins-create',
        title: 'Как написать свой плагин',
        section: 'dev',
        tags: ['разработчикам', 'плагины', 'SPEC_06'],
        freshness: 'verified',
        sources: [
            'src/kernel/contracts/plugin.ts',
            'src/kernel/services/plugins/plugin-manifest.ts',
            'src/kernel/services/plugins/plugin-marketplace-catalog.ts',
        ],
        related: ['plugins-guide', 'panel-plugins'],
        reviewed: { at: '2026-11-09', by: 'mercury' },
        body: `## Минимальный манифест

\`\`\`json
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
\`\`\`

Требования валидатора: id (dotted), name, semver-version, engines.os, contributes + permissions.

## Шаг 1: инструмент

1. Добавь \`contributes.tools\` и permission \`tool:<name>\`.
2. Подключи манифест через \`PluginLoader.load(manifest, executor)\`, где executor — функция \`(name, args) => Promise<string>\`.
3. Во время исполнения worker может запросить \`executeTool\` — хост проверит, что инструмент в \`allowedTools\`, и вызовет executor.

## Шаг 2: панель

1. Добавь \`contributes.panels\`: \`{ "id": "my.dashboard", "entry": "panels/dashboard.html" }\`.
2. Создай HTML-файл по пути entry (автономный, без доступа к localStorage приложения).
3. После установки панель появится в сайдбаре и по адресу \`/plugin/my.dashboard\`.

## Шаг 3: сервис и подписки

- \`contributes.services\`: \`[{ "id": "my.provider" }]\` + permission \`service:my.provider\`; обработчик передаётся в \`loader.load(..., serviceHandlers)\`.
- \`contributes.subscriptions\`: \`[{ "event": "agent:start" }]\` + permission \`event:subscribe:agent:start\`; обработчик — в аргументе eventHandler.

## Как зарегистрировать плагин в системе

\`\`\`ts
import { PluginLoader } from '../kernel/services/plugins/plugin-loader';
import { validateManifest } from '../kernel/services/plugins/plugin-manifest';

const manifest = { /* как выше */ };
const validation = validateManifest(manifest);
if (!validation.ok) throw new Error(validation.errors.join('; '));

const loader = new PluginLoader({ registry, host, enforceToolPermissions: true });
await loader.load(manifest, executor, context, eventHandler, serviceHandlers);
\`\`\`

Для демонстрации добавь свой манифест в \`plugin-marketplace-catalog.ts\` — он появится в маркетплейсе.

## Рекомендации

- Инструменты должны возвращать строки (JSON-сериализуемое).
- Не используй глобальные синглтоны приложения — только порты, которые даёт хост.
- Проверяй валидность манифеста до загрузки.`,
    },
];
