// Wiki corpus: articles for panels that previously had no dedicated article.
// These are hand-written, code-referenced guides.

import type { WikiArticle } from './wiki-types';

export const PANELS_EXTRA_ARTICLES: WikiArticle[] = [
    {
        slug: 'panel-exceptions',
        title: 'Исключения (вето)',
        section: 'panels',
        tags: ['панели', 'политики', 'исключения'],
        freshness: 'documented',
        sources: ['src/components/ExceptionsPanel/ExceptionsPanel'],
        related: ['panel-governance'],
        body: `## Исключения

Панель показывает исключения/вето, наложенные на операции политиками или вручную. Применяется вместе с [[panel-governance]] для контроля над нежелательными действиями агентов.

Компонент: \`src/components/ExceptionsPanel/ExceptionsPanel\`.`,
    },
    {
        slug: 'panel-memory-center',
        title: 'Memory Center',
        section: 'panels',
        tags: ['панели', 'память'],
        freshness: 'documented',
        sources: ['src/components/MemoryCenterPanel/MemoryCenterPanel'],
        related: ['memory', 'panel-memory-palace'],
        body: `## Memory Center

Центральная панель управления памятью: обзор магазинов, связи и статистика. Связана с [[memory]] и [[panel-memory-palace]].

Компонент: \`src/components/MemoryCenterPanel/MemoryCenterPanel\`.`,
    },
    {
        slug: 'panel-nav-graph',
        title: 'Граф навигации',
        section: 'panels',
        tags: ['панели', 'навигация'],
        freshness: 'documented',
        sources: ['src/components/NavGraphPanel/NavGraphPanel'],
        related: ['dev-routing'],
        body: `## Граф навигации

Визуализирует маршруты и связи между панелями приложения, помогая ориентироваться в навигационной структуре.

Компонент: \`src/components/NavGraphPanel/NavGraphPanel\`.`,
    },
    {
        slug: 'panel-defect-map',
        title: 'Карта дефектов',
        section: 'panels',
        tags: ['панели', 'диагностика', 'дефекты'],
        freshness: 'documented',
        sources: ['src/components/DefectMapPanel/DefectMapPanel'],
        related: ['panel-observability', 'diagnostics'],
        body: `## Карта дефектов

Сводная карта известных дефектов и их статусов по подсистемам. Используется для навигации по отложенным проблемам.

Компонент: \`src/components/DefectMapPanel/DefectMapPanel\`.`,
    },
    {
        slug: 'panel-wiki-brain',
        title: 'Вики-мозг',
        section: 'panels',
        tags: ['панели', 'вики', 'знания'],
        freshness: 'documented',
        sources: ['src/components/WikiBrainPanel'],
        related: ['panel-wiki', 'memory'],
        body: `## Вики-мозг

Панель индексации и запросов к вики-базе знаний: ингест, линтинг, поиск и граф связей. Дополняет [[panel-wiki]].

Компонент: \`src/components/WikiBrainPanel\`.`,
    },
    {
        slug: 'panel-architecture-map',
        title: 'Карта архитектуры',
        section: 'panels',
        tags: ['панели', 'архитектура'],
        freshness: 'documented',
        sources: ['src/components/ArchitectureMapPanel'],
        related: ['architecture', 'dev-overview'],
        body: `## Карта архитектуры

Визуальная схема слоёв и связей системы: kernel, сервисы, события, сторы и UI. Связана с [[architecture]] и [[dev-overview]].

Компонент: \`src/components/ArchitectureMapPanel\`.`,
    },
    {
        slug: 'panel-plugins',
        title: 'Плагины',
        section: 'panels',
        tags: ['панели', 'плагины'],
        freshness: 'documented',
        sources: ['src/components/PluginManagerPanel'],
        related: ['panel-plugin-marketplace', 'panel-infra-meta'],
        body: `## Плагины

Управление установленными плагинами: загрузка манифестов, активация, выгрузка и статус. Маркетплейс — [[panel-plugin-marketplace]].

Компонент: \`src/components/PluginManagerPanel\`.`,
    },
    {
        slug: 'panel-plugin-marketplace',
        title: 'Маркетплейс плагинов',
        section: 'panels',
        tags: ['панели', 'плагины'],
        freshness: 'documented',
        sources: ['src/components/PluginMarketplacePanel'],
        related: ['panel-plugins'],
        body: `## Маркетплейс плагинов

Каталог доступных плагинов с установкой в один клик. Управление установленным — [[panel-plugins]].

Компонент: \`src/components/PluginMarketplacePanel\`.`,
    },
];
