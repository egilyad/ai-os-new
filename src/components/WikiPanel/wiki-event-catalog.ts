import type { WikiArticle } from './wiki-articles';
import { EVENT_CATALOG_MARKDOWN } from '../../generated/wiki-event-catalog';

// Auto-maintained catalog of every bus event (source: event-registry.ts).
// Body comes from the generator (scripts/gen-wiki-events.mjs) — edit that, not this.
export const EVENT_ARTICLES: WikiArticle[] = [
    {
        slug: 'dev-event-catalog',
        title: 'Каталог событий шины',
        section: 'dev',
        tags: ['dev', 'события', 'каталог', 'шина'],
        freshness: 'verified',
        sources: ['scripts/gen-wiki-events.mjs', 'src/kernel/events/event-registry.ts'],
        related: ['dev-events', 'dev-services', 'dev-overview'],
        body: EVENT_CATALOG_MARKDOWN,
    },
];
