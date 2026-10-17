import type { WikiArticle } from './wiki-articles';
import { CATALOG_MARKDOWN } from '../../generated/wiki-component-catalog';
import { PANEL_CATALOG_MARKDOWN } from '../../generated/wiki-panel-catalog';

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
];
