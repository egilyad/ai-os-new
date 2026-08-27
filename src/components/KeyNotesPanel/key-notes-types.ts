export interface AttachedFile {
    name: string;
    size: number;
    type: string;
    dataUrl: string;
}

import type { KeyNote } from '../../kernel/types/metrics-types';

export interface EnhancedNote extends KeyNote {
    attachments?: AttachedFile[];
    tags?: string[];
}

export const MAX_FILE_SIZE = 1024 * 1024;
export const MAX_TOTAL_SIZE = 3 * 1024 * 1024;
