import type { TournamentMatch } from './tournament-types';

export const statusColors: Record<TournamentMatch['status'], string> = {
    pending: '#64748b',
    active: '#3b82f6',
    completed: '#10b981',
};

export const roleColors: Record<string, string> = {
    pro: '#10b981',
    con: '#ef4444',
    neutral: '#64748b',
};
