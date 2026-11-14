import Dexie, { type Table } from 'dexie';
import type { SidecarAttachment } from '../../types/attachment-types';

/**
 * AttachmentDB — separate Dexie instance for sidecar image/visual evidence.
 * Kept apart from the main schema (same pattern as WikiBrain / ProjectGraph).
 */
export class AttachmentDB extends Dexie {
    attachments!: Table<SidecarAttachment, string>;

    constructor(dbName = 'aios-attachments') {
        super(dbName);
        this.version(1).stores({
            attachments: 'id, projectId, sourceKind, sourceRef, createdAt',
        });
    }
}

let _db: AttachmentDB | undefined;

export function createAttachmentDB(dbName = 'aios-attachments'): AttachmentDB {
    if (!_db) _db = new AttachmentDB(dbName);
    return _db;
}

export function getAttachmentDB(): AttachmentDB {
    if (!_db) throw new Error('AttachmentDB not initialized — call createAttachmentDB() first');
    return _db;
}
