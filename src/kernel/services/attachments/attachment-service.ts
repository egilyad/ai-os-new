import type { RegisterAttachmentInput, SidecarAttachment } from '../../types/attachment-types';
import { AttachmentDB, createAttachmentDB } from './attachment-dexie';

export interface AttachmentFilter {
    projectId?: string;
    sourceKind?: string;
    sourceRef?: string;
}

export interface AttachmentSummary {
    id: string;
    projectId?: string;
    sourceKind: string;
    sourceRef: string;
    caption: string;
    mimeType: string;
    width?: number;
    height?: number;
    createdAt: number;
}

const ATTACHMENT_ID = (() => {
    let n = 0;
    return () => `att-${Date.now()}-${++n}`;
})();

/**
 * AttachmentService — sidecar visual evidence store.
 * Images live next to text sources (wiki pages, debates, tasks) and can be
 * handed to vision-capable LLM calls.
 */
export class AttachmentService {
    private db: AttachmentDB;

    constructor(db?: AttachmentDB) {
        this.db = db ?? createAttachmentDB();
    }

    async register(input: RegisterAttachmentInput): Promise<SidecarAttachment> {
        const now = Date.now();
        const attachment: SidecarAttachment = {
            id: ATTACHMENT_ID(),
            projectId: input.projectId,
            sourceKind: input.sourceKind,
            sourceRef: input.sourceRef,
            caption: input.caption,
            mimeType: input.mimeType,
            dataB64: input.dataB64,
            width: input.width,
            height: input.height,
            createdAt: now,
        };
        await this.db.attachments.put(attachment);
        return attachment;
    }

    async list(filter: AttachmentFilter = {}): Promise<AttachmentSummary[]> {
        let items = await this.db.attachments.toArray();
        if (filter.projectId) items = items.filter((a) => a.projectId === filter.projectId);
        if (filter.sourceKind) items = items.filter((a) => a.sourceKind === filter.sourceKind);
        if (filter.sourceRef) items = items.filter((a) => a.sourceRef === filter.sourceRef);
        return items
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((a) => ({
                id: a.id,
                projectId: a.projectId,
                sourceKind: a.sourceKind,
                sourceRef: a.sourceRef,
                caption: a.caption,
                mimeType: a.mimeType,
                width: a.width,
                height: a.height,
                createdAt: a.createdAt,
            }));
    }

    async get(id: string): Promise<SidecarAttachment | undefined> {
        return this.db.attachments.get(id);
    }

    async detach(id: string): Promise<boolean> {
        const existing = await this.db.attachments.get(id);
        if (!existing) return false;
        await this.db.attachments.delete(id);
        return true;
    }

    async count(): Promise<number> {
        return this.db.attachments.count();
    }
}
