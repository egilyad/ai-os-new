import type { WikiArticle } from './wiki-articles';
import { CATALOG_MARKDOWN } from '../../generated/wiki-component-catalog';
import { PANEL_CATALOG_MARKDOWN } from '../../generated/wiki-panel-catalog';
import { DOCS_HEALTH_MARKDOWN } from '../../generated/wiki-docs-health';
import { DOCS_INVENTORY_MARKDOWN } from '../../generated/wiki-docs-inventory';
import { DOCS_STANDARD_MARKDOWN } from '../../generated/wiki-docs-standard';
import { DOCS_INDEX_MARKDOWN } from '../../generated/wiki-docs-index';
import { SYSTEM_MAP_MARKDOWN } from '../../generated/wiki-system-map';

// Auto-maintained catalogs: components, and the panel -> section -> route ->
// component -> article chain. Bodies come from the generators — edit those.
export const CATALOG_ARTICLES: WikiArticle[] = [
    {
        slug: 'dev-component-catalog',
        title: 'Каталог компонентов OS',
        section: 'dev',
        tags: ['dev', 'каталог', 'компоненты', 'связи'],
        freshness: 'verified',
        sources: ['scripts/gen-wiki-catalog.mjs', 'src/generated/wiki-component-catalog.ts'],
        related: ['dev-components', 'dev-services', 'dev-routing', 'dev-layout'],
        body: CATALOG_MARKDOWN,
    },
    {
        slug: 'panels-catalog',
        title: 'Каталог панелей: раздел → маршрут → компонент → статья',
        section: 'panels',
        tags: ['панели', 'каталог', 'маршруты', 'компоненты'],
        freshness: 'verified',
        sources: [
            'scripts/gen-wiki-panel-catalog.mjs',
            'src/generated/wiki-panel-catalog.ts',
            'src/route-registry-core.ts',
            'src/route-registry-system.ts',
            'src/route-registry-content.ts',
            'src/route-imports.ts',
        ],
        related: ['panels-guide', 'dev-routing', 'dev-layout', 'dev-component-catalog'],
        body: PANEL_CATALOG_MARKDOWN,
    },
    {
        slug: 'docs-health',
        title: 'Здоровье документации',
        section: 'diagnostics',
        tags: ['диагностика', 'документация', 'качество', 'метрики'],
        freshness: 'verified',
        sources: [
            'scripts/lib/docs-health.mjs',
            'scripts/gen-wiki-docs-health.mjs',
            'src/generated/wiki-docs-health.ts',
        ],
        related: ['dev-generators', 'dev-ci', 'panels-catalog', 'diagnostics'],
        body: DOCS_HEALTH_MARKDOWN,
    },
    {
        slug: 'docs-inventory',
        title: 'Инвентаризация документации',
        section: 'dev',
        tags: ['документация', 'инвентаризация', 'каталог', 'метрики'],
        freshness: 'verified',
        sources: [
            'scripts/gen-docs-inventory.mjs',
            'docs/inventory.json',
            'src/generated/wiki-docs-inventory.ts',
        ],
        related: ['docs-health', 'dev-generators', 'dev-layout', 'dev-ci'],
        body: DOCS_INVENTORY_MARKDOWN,
    },
    {
        slug: 'docs-standard',
        title: 'Стандарт документации',
        section: 'dev',
        tags: ['документация', 'стандарт', 'статусы', 'источники истины', 'языки'],
        freshness: 'verified',
        sources: [
            'scripts/lib/entity-model.mjs',
            'docs/entity-model.json',
            'scripts/gen-wiki-docs-standard.mjs',
        ],
        related: ['docs-inventory', 'docs-health', 'dev-generators', 'dev-conventions'],
        body: DOCS_STANDARD_MARKDOWN,
    },
    {
        slug: 'docs-index',
        title: 'Карта документации',
        section: 'guide',
        tags: ['документация', 'навигация', 'индекс', 'карта'],
        freshness: 'verified',
        sources: [
            'docs/manifest.json',
            'docs/inventory.json',
            'scripts/gen-wiki-docs-index.mjs',
        ],
        related: ['docs-standard', 'docs-inventory', 'docs-health', 'dev-generators'],
        body: DOCS_INDEX_MARKDOWN,
    },
    {
        slug: 'dev-system-map',
        title: 'Карта системы',
        section: 'architecture',
        tags: ['система', 'слои', 'агенты', 'стратегии', 'провайдеры', 'карта'],
        freshness: 'verified',
        sources: [
            'src/data/role-library.ts',
            'src/constants/pools.ts',
            'src/components/DebatePanel/wizard-constants.ts',
            'scripts/gen-wiki-system-map.mjs',
        ],
        related: ['docs-index', 'dev-service-map', 'panel-infra-meta', 'dev-generators'],
        body: SYSTEM_MAP_MARKDOWN,
    },
];
