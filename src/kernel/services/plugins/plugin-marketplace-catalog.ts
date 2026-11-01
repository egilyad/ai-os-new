import type { MarketplaceEntry } from '../../contracts/plugin-marketplace';

/**
 * Встроенный локальный каталог демо-плагинов (SPEC_06 §8).
 *
 * Демо-плагины демонстрируют возможности system: инструменты, подписки на
 * события, permissions. Используются как примеры и для проверки интеграции.
 */
export const PLUGIN_MARKETPLACE_CATALOG: MarketplaceEntry[] = [
    {
        manifest: {
            id: 'demo.search',
            name: 'Demo Search Provider',
            description: 'Демо-плагин, добавляющий инструмент поиска по памяти.',
            version: '1.0.0',
            engines: { os: '4.5.0' },
            contributes: {
                tools: [{ name: 'demo.search', handler: 'handlers/search.js' }],
                subscriptions: [{ event: 'agent:start', handler: 'handlers/onAgentStart.js' }],
            },
            permissions: ['tool:demo.search', 'event:subscribe:agent:start'],
        },
        blurb: 'Пример плагина с инструментом и подпиской на событие.',
        category: 'demo',
    },
    {
        manifest: {
            id: 'demo.weather',
            name: 'Demo Weather',
            description: 'Демо-плагин с инструментом погоды (через мост executeTool).',
            version: '1.0.0',
            engines: { os: '4.5.0' },
            contributes: {
                tools: [{ name: 'demo.weather', handler: 'handlers/weather.js' }],
            },
            permissions: ['tool:demo.weather'],
        },
        blurb: 'Пример плагина с одним инструментом.',
        category: 'demo',
    },
    {
        manifest: {
            id: 'demo.mcp',
            name: 'Demo MCP Bridge',
            description: 'Демо-плагин, встраивающий локальный MCP-сервер.',
            version: '1.0.0',
            engines: { os: '4.5.0' },
            contributes: {
                mcpServers: [{ name: 'demo-bridge' }],
            },
            permissions: ['mcp:demo-bridge'],
        },
        blurb: 'Пример плагина со встроенным MCP-сервером.',
        category: 'demo',
    },
];
