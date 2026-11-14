import type { IWikiEditService, StagedEdit } from '../../contracts/wiki-brain/wiki-edit.service';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { TWikiPage } from '../../contracts/wiki-brain/types';
import { wikiId } from './wiki-brain-dexie';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

export interface WikiEditServiceDeps {
    eventBus?: { emit(event: string, data?: unknown): void };
}

const LOGGER = rootLogger.child('WikiEdit');

const STAGED_KEY = 'wiki_staged_edits_v1';

function wikilinks(body: string): string[] {
    const found: string[] = [];
    const re = /\[\[([^\]]+)\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
        const capture = m[1];
        if (capture) found.push(capture.trim().toLowerCase());
    }
    return found;
}

/**
 * WikiEditService — F2: runtime-validated staged edits.
 *
 * Each edit is validated against structural rules (dead links, missing
 * frontmatter) before commit; rejected edits are dropped. Commits are
 * idempotent (page replaced atomically via put on same id).
 */
export class WikiEditService implements IWikiEditService {
    private staged: StagedEdit[] = [];
    private initialized = false;

    constructor(
        private store: IWikiStore,
        private kv: {
            get(id: string): Promise<unknown | null>;
            set(id: string, v: unknown): Promise<void>;
        },
        private deps: WikiEditServiceDeps = {},
    ) {}

    private async ensureInit(): Promise<void> {
        if (this.initialized) return;
        this.initialized = true;
        try {
            const saved = (await this.kv.get(STAGED_KEY)) as StagedEdit[] | null;
            if (Array.isArray(saved)) this.staged = saved;
        } catch {
            /* kv unavailable */
        }
    }

    private async persist(): Promise<void> {
        try {
            await this.kv.set(STAGED_KEY, this.staged);
        } catch {
            /* best-effort */
        }
    }

    private validatePage(page: TWikiPage): string[] {
        const issues: string[] = [];
        if (!page.frontmatter.slug || !page.frontmatter.title || !page.frontmatter.type) {
            issues.push('missing-frontmatter');
        }
        return issues;
    }

    async stageEdit(page: TWikiPage): Promise<{ edit?: StagedEdit; issues: string[] }> {
        await this.ensureInit();
        const structural = this.validatePage(page);
        const slugs = new Set((await this.store.listPages({ limit: 10000 })).map((p) => p.slug));
        const dead = wikilinks(page.body).filter((t) => !slugs.has(t));
        const issues = [...structural, ...dead.map((t) => `dead-wikilink:[[${t}]]`)];
        if (issues.length > 0) {
            return { issues };
        }
        const edit: StagedEdit = {
            id: wikiId('se'),
            pageId: page.id,
            page,
            issues: [],
            status: 'staged',
            createdAt: new Date().toISOString(),
        };
        const existing = this.staged.findIndex(
            (e) => e.pageId === page.id && e.status === 'staged',
        );
        if (existing >= 0) this.staged[existing] = edit;
        else this.staged.push(edit);
        await this.persist();
        return { edit, issues: [] };
    }

    async commitStaged(id: string): Promise<boolean> {
        await this.ensureInit();
        const idx = this.staged.findIndex((e) => e.id === id && e.status === 'staged');
        if (idx < 0) return false;
        const edit = this.staged[idx]!;
        try {
            await this.store.putPage(edit.page);
            edit.status = 'committed';
            edit.committedAt = new Date().toISOString();
            await this.persist();
            this.deps.eventBus?.emit(EVENTS.WIKI_EDIT_COMMITTED, {
                editId: edit.id,
                pageId: edit.pageId,
            });
            return true;
        } catch (e) {
            LOGGER.warn('WikiEdit', 'commit failed', { id, error: e });
            return false;
        }
    }

    async rejectStaged(id: string): Promise<void> {
        await this.ensureInit();
        this.staged = this.staged.filter((e) => e.id !== id);
        await this.persist();
    }

    async listStaged(): Promise<StagedEdit[]> {
        await this.ensureInit();
        return this.staged.filter((e) => e.status === 'staged');
    }
}
