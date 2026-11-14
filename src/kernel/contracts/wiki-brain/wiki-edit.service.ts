import type { TWikiPage } from './types';

export interface StagedEdit {
    id: string;
    pageId: string;
    page: TWikiPage;
    issues: string[];
    status: 'staged' | 'committed' | 'rejected';
    createdAt: string;
    committedAt?: string;
}

export interface IWikiEditService {
    /** Validate and stage an edit; returns issues (empty = valid). */
    stageEdit(page: TWikiPage): Promise<{ edit?: StagedEdit; issues: string[] }>;
    /** Commit a staged edit (dedups and puts the page). */
    commitStaged(id: string): Promise<boolean>;
    /** Reject and discard a staged edit. */
    rejectStaged(id: string): Promise<void>;
    /** List current staged edits. */
    listStaged(): Promise<StagedEdit[]>;
}
