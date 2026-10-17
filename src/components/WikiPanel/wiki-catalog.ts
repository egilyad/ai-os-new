import type { WikiArticle } from './wiki-articles';
import { CATALOG_MARKDOWN } from '../../generated/wiki-component-catalog';

// Auto-maintained catalog: every UI component and the kernel layers it touches.
// Body comes from the generator (scripts/gen-wiki-catalog.mjs) — edit that, not this.
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
];
