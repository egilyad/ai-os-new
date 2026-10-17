import type { WikiArticle } from './wiki-types';
import { DEP_MAP_MARKDOWN } from '../../generated/wiki-dep-map';

// Kernel DI dependency map, embedded from DEPENDENCY_MAP.md via scripts/gen-wiki-depmap.mjs.
export const SERVICE_MAP_ARTICLES: WikiArticle[] = [
    {
        slug: 'dev-service-map',
        title: 'Карта зависимостей ядра (DI)',
        section: 'dev',
        tags: ['dev', 'DI', 'сервисы', 'карта'],
        freshness: 'verified',
        sources: ['src/kernel/DEPENDENCY_MAP.md', 'scripts/gen-wiki-depmap.mjs'],
        related: ['dev-services', 'dev-boot', 'dev-event-catalog', 'dev-component-catalog'],
        body: DEP_MAP_MARKDOWN,
    },
];
