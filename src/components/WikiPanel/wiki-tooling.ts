import type { WikiArticle } from './wiki-articles';
import { SCRIPTS_MARKDOWN } from '../../generated/wiki-scripts';

// Auto-maintained tooling catalog: npm scripts + purpose of scripts/cli/server files.
// Body comes from the generator (scripts/gen-wiki-scripts.mjs) — edit that, not this.
export const TOOLING_ARTICLES: WikiArticle[] = [
    {
        slug: 'dev-scripts',
        title: 'Скрипты и CLI',
        section: 'dev',
        tags: ['dev', 'скрипты', 'cli', 'команды'],
        freshness: 'verified',
        sources: ['scripts/gen-wiki-scripts.mjs', 'package.json'],
        related: ['dev-ci', 'dev-generators', 'dev-testing', 'dev-overview'],
        body: SCRIPTS_MARKDOWN,
    },
];
