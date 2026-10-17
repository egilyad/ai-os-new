import type { WikiArticle } from './wiki-articles';
import { SCRIPTS_MARKDOWN } from '../../generated/wiki-scripts';
import { TESTS_MARKDOWN } from '../../generated/wiki-tests';

// Auto-maintained tooling catalogs: npm scripts + purpose of scripts/cli/server files,
// and the test surface (per-area counts + the CI gate set).
// Bodies come from the generators (scripts/gen-wiki-scripts.mjs, gen-wiki-tests.mjs).
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
    {
        slug: 'dev-tests-catalog',
        title: 'Каталог тестов',
        section: 'dev',
        tags: ['dev', 'тесты', 'каталог', 'CI'],
        freshness: 'verified',
        sources: ['scripts/gen-wiki-tests.mjs', 'package.json'],
        related: ['dev-testing', 'dev-ci', 'dev-scripts', 'dev-overview'],
        body: TESTS_MARKDOWN,
    },
];
