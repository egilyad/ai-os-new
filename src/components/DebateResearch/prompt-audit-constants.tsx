export const GROUP_COLORS: Record<string, string> = {
    Technical: '#3b82f6',
    Analytical: '#a855f7',
    Creative: '#f59e0b',
    Management: '#06b6d4',
    Specialized: '#10b981',
    Documentation: '#8b5cf6',
};

export const STRATEGY_COLORS: Record<string, string> = {
    Critical: '#ef4444',
    Analytical: '#a855f7',
    Creative: '#f59e0b',
    Documentary: '#3b82f6',
    Managerial: '#06b6d4',
    General: '#64748b',
};

export const GROUP_ORDER = [
    'Technical',
    'Analytical',
    'Creative',
    'Management',
    'Specialized',
    'Documentation',
];

export const suggestionTypeColor = (type: string) =>
    type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#60a5fa';
