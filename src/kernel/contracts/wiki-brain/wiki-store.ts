import type {
    TWikiPage,
    TWikiSource,
    TWikiLink,
    TWikiLogEntry,
    TWikiQueueTask,
    TWikiLintIssue,
} from './types';

export interface IWikiStore {
    // Sources
    putSource(s: TWikiSource): Promise<void>;
    getSource(id: string): Promise<TWikiSource | undefined>;
    getSourceBySha256(sha: string): Promise<TWikiSource | undefined>;
    listSources(opts?: { limit?: number; offset?: number }): Promise<TWikiSource[]>;
    deleteSource(id: string): Promise<void>;

    // Pages
    putPage(p: TWikiPage): Promise<void>;
    getPage(id: string): Promise<TWikiPage | undefined>;
    getPageBySlug(slug: string): Promise<TWikiPage | undefined>;
    listPages(opts?: { type?: TWikiPage['frontmatter']['type']; limit?: number }): Promise<TWikiPage[]>;
    deletePage(id: string): Promise<void>;
    bulkPutPages(pages: TWikiPage[]): Promise<void>;

    // Links
    putLink(l: TWikiLink): Promise<void>;
    linksFrom(slug: string): Promise<TWikiLink[]>;
    linksTo(slug: string): Promise<TWikiLink[]>;
    deleteLinksOfPage(slug: string): Promise<void>;

    // Log (append-only)
    appendLog(entry: TWikiLogEntry): Promise<void>;
    listLog(opts?: { limit?: number; op?: TWikiLogEntry['op'] }): Promise<TWikiLogEntry[]>;

    // Queue
    enqueue(task: TWikiQueueTask): Promise<void>;
    nextPending(): Promise<TWikiQueueTask | undefined>;
    updateTask(id: string, patch: Partial<TWikiQueueTask>): Promise<void>;
    listQueue(opts?: { status?: TWikiQueueTask['status'] }): Promise<TWikiQueueTask[]>;

    // Lint issues
    putIssue(i: TWikiLintIssue): Promise<void>;
    clearIssuesForRule(rule: TWikiLintIssue['rule']): Promise<void>;
    listIssues(opts?: { severity?: TWikiLintIssue['severity'] }): Promise<TWikiLintIssue[]>;
}
