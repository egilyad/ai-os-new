import type { WikiArticle } from './wiki-types';
import { STORES_MARKDOWN } from '../../generated/wiki-stores';
import { I18N_MARKDOWN } from '../../generated/wiki-i18n';

// Auto-maintained layer catalogs: UI state (stores) and localization (i18n).
// Bodies come from the generators (scripts/gen-wiki-stores.mjs, gen-wiki-i18n.mjs).
export const LAYER_ARTICLES: WikiArticle[] = [
    {
        slug: 'dev-store-catalog',
        title: 'Каталог сторов',
        section: 'dev',
        tags: ['dev', 'сторы', 'состояние', 'каталог'],
        freshness: 'verified',
        sources: ['scripts/gen-wiki-stores.mjs', 'src/stores/'],
        related: ['dev-stores', 'dev-services', 'dev-contracts', 'dev-overview'],
        body: STORES_MARKDOWN,
    },
    {
        slug: 'dev-i18n-catalog',
        title: 'Каталог локализации',
        section: 'dev',
        tags: ['dev', 'i18n', 'локали', 'каталог'],
        freshness: 'verified',
        sources: ['scripts/gen-wiki-i18n.mjs', 'src/i18n/translations/'],
        related: ['dev-i18n', 'dev-components', 'dev-overview'],
        body: I18N_MARKDOWN,
    },
];
