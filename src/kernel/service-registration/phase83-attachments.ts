/**
 * Phase 83 — sidecar attachments (visual evidence store).
 *
 *  - attachmentService: Dexie-backed store for image/visual evidence bound to
 *    knowledge sources (wiki pages, debates, tasks). Feeds vision-capable
 *    assistant flows (roadmap: images from sidecar).
 */
import type { Phase } from './helpers';
import { AttachmentService } from '../services/attachments/attachment-service';

export const registerPhase83: Phase = ({ register }) => {
    register('attachmentService', () => new AttachmentService());
};
