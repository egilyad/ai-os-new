/**
 * Sidecar attachments — visual evidence bound to knowledge sources
 * (wiki pages, debates, tasks). Stored next to text as data-URL payloads,
 * available for vision-enabled assistants (roadmap note: images from sidecar).
 */

export type AttachmentSourceKind = 'wiki' | 'debate' | 'task' | 'project' | 'note';

export interface SidecarAttachment {
    id: string;
    projectId?: string;
    sourceKind: AttachmentSourceKind;
    /** Slug / entity id the attachment belongs to. */
    sourceRef: string;
    caption: string;
    mimeType: string;
    /** base64-encoded payload (no data: prefix). */
    dataB64: string;
    width?: number;
    height?: number;
    createdAt: number;
}

export interface RegisterAttachmentInput {
    projectId?: string;
    sourceKind: AttachmentSourceKind;
    sourceRef: string;
    caption: string;
    mimeType: string;
    dataB64: string;
    width?: number;
    height?: number;
}
