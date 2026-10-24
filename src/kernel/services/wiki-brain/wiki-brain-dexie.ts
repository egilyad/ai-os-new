import Dexie, { type Table } from 'dexie';
import type {
    TWikiSource,
    TWikiPage,
    TWikiLink,
    TWikiLogEntry,
    TWikiQueueTask,
    TWikiLintIssue,
} from '../../contracts/wiki-brain/types';

/**
 * Wiki Brain keeps its own IndexedDB instance so its versioning never touches
 * the main Dexie schema of the product. The cost is a tiny separate database.
 */
export class WikiBrainDB extends Dexie {
    sources!: Table<TWikiSource, string>;
    pages!: Table<TWikiPage, string>;
    links!: Table<TWikiLink, string>;
    log!: Table<TWikiLogEntry, string>;
    queue!: Table<TWikiQueueTask, string>;
    issues!: Table<TWikiLintIssue, string>;

    constructor(dbName = 'aios-wiki-brain') {
        super(dbName);
        this.version(1).stores({
            sources: 'id, sha256, importedAt, kind, [kind+importedAt]',
            pages: 'id, &slug, [frontmatter.type], frontmatter.updatedAt, *frontmatter.tags, sha256',
            links: 'id, fromSlug, toSlug, [fromSlug+toSlug], kind',
            log: 'id, ts, op, [op+ts]',
            queue: 'id, status, priority, [status+priority]',
            issues: 'id, rule, severity, pageId, detectedAt',
        });
    }
}

let _db: WikiBrainDB | undefined;

export function createWikiBrainDB(dbName = 'aios-wiki-brain'): WikiBrainDB {
    if (!_db) _db = new WikiBrainDB(dbName);
    return _db;
}

export function getWikiBrainDB(): WikiBrainDB {
    if (!_db) throw new Error('WikiBrainDB not initialized — call createWikiBrainDB() first');
    return _db;
}

export function wikiId(prefix: string): string {
    const uuid =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${uuid}`;
}
