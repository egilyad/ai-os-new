import type { JournalEntry } from '../../kernel/services/agent-journal-service';

export const OUTCOME_COLORS: Record<JournalEntry['outcome'], string> = {
    success: '#10b981',
    failure: '#ef4444',
    partial: '#f59e0b',
    in_progress: '#3b82f6',
};
