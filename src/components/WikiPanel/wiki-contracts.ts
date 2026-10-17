import type { WikiArticle } from './wiki-types';
import { CONTRACTS_MARKDOWN } from '../../generated/wiki-contracts';

// Auto-maintained catalog of kernel contracts (interfaces/types) and their implementers.
// Body comes from the generator (scripts/gen-wiki-contracts.mjs) — edit that, not this.
export const CONTRACT_ARTICLES: WikiArticle[] = [
    {
        slug: 'dev-contracts',
        title: 'Контракты ядра',
        section: 'dev',
        tags: ['dev', 'контракты', 'интерфейсы', 'каталог'],
        freshness: 'verified',
        sources: ['scripts/gen-wiki-contracts.mjs', 'src/kernel/contracts/'],
        related: ['dev-services', 'dev-service-map', 'dev-component-catalog', 'dev-overview'],
        body: CONTRACTS_MARKDOWN,
    },
];
