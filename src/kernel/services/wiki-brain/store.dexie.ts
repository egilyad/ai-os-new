import { createWikiBrainDB, getWikiBrainDB } from './wiki-brain-dexie';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type {
    TWikiSource,
    TWikiPage,
    TWikiLink,
    TWikiLogEntry,
    TWikiQueueTask,
    TWikiLintIssue,
} from '../../contracts/wiki-brain/types';

export class WikiDexieStore implements IWikiStore {
    constructor() {
        // Гарантируем инициализацию отдельной БД Wiki Brain до любого доступа.
        createWikiBrainDB();
    }

    private get db() {
        return getWikiBrainDB();
    }

    async putSource(s: TWikiSource) {
        await this.db.sources.put(s);
    }

    async getSource(id: string) {
        return this.db.sources.get(id);
    }

    async getSourceBySha256(sha: string) {
        return this.db.sources.where('sha256').equals(sha).first();
    }

    async listSources(opts: { limit?: number; offset?: number } = {}) {
        const { limit = 100, offset = 0 } = opts;
        return this.db.sources.orderBy('importedAt').reverse().offset(offset).limit(limit).toArray();
    }

    async deleteSource(id: string) {
        await this.db.sources.delete(id);
        const affected = await this.db.pages
            .filter((p) => p.frontmatter.sources.some((s) => s.sourceId === id))
            .toArray();
        if (affected.length > 0) {
            await this.db.pages.bulkDelete(affected.map((p) => p.id));
        }
    }

    async putPage(p: TWikiPage) {
        await this.db.pages.put(p);
    }

    async getPage(id: string) {
        return this.db.pages.get(id);
    }

    async getPageBySlug(slug: string) {
        return this.db.pages.where('slug').equals(slug).first();
    }

    async listPages(opts: { type?: TWikiPage['frontmatter']['type']; limit?: number } = {}) {
        let query = this.db.pages.toCollection();
        if (opts.type) query = this.db.pages.where('frontmatter.type').equals(opts.type);
        return query.limit(opts.limit ?? 100).toArray();
    }

    async deletePage(id: string) {
        await this.db.pages.delete(id);
    }

    async bulkPutPages(pages: TWikiPage[]) {
        await this.db.pages.bulkPut(pages);
    }

    async putLink(l: TWikiLink) {
        await this.db.links.put(l);
    }

    async linksFrom(slug: string) {
        return this.db.links.where('fromSlug').equals(slug).toArray();
    }

    async linksTo(slug: string) {
        return this.db.links.where('toSlug').equals(slug).toArray();
    }

    async deleteLinksOfPage(slug: string) {
        const ids = await this.db.links
            .where('[fromSlug+toSlug]')
            .between([slug, ''], [slug, '\uffff'])
            .primaryKeys();
        await this.db.links.bulkDelete(ids);
    }

    async appendLog(entry: TWikiLogEntry) {
        await this.db.log.put(entry);
    }

    async listLog(opts: { limit?: number; op?: TWikiLogEntry['op'] } = {}) {
        const { limit = 100, op } = opts;
        const query = op ? this.db.log.where('op').equals(op) : this.db.log.toCollection();
        const rows = await query.toArray();
        return rows.sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, limit);
    }

    async enqueue(task: TWikiQueueTask) {
        await this.db.queue.put(task);
    }

    async nextPending() {
        const tasks = await this.db.queue.where('status').equals('pending').sortBy('priority');
        return tasks[0];
    }

    async updateTask(id: string, patch: Partial<TWikiQueueTask>) {
        const current = await this.db.queue.get(id);
        if (!current) throw new Error(`Task ${id} not found`);
        await this.db.queue.put({ ...current, ...patch });
    }

    async listQueue(opts: { status?: TWikiQueueTask['status'] } = {}) {
        const { status } = opts;
        return status
            ? this.db.queue.where('status').equals(status).toArray()
            : this.db.queue.toArray();
    }

    async putIssue(i: TWikiLintIssue) {
        await this.db.issues.put(i);
    }

    async clearIssuesForRule(rule: TWikiLintIssue['rule']) {
        const ids = await this.db.issues.where('rule').equals(rule).primaryKeys();
        await this.db.issues.bulkDelete(ids);
    }

    async listIssues(opts: { severity?: TWikiLintIssue['severity'] } = {}) {
        const { severity } = opts;
        return severity
            ? this.db.issues.where('severity').equals(severity).toArray()
            : this.db.issues.toArray();
    }
}
