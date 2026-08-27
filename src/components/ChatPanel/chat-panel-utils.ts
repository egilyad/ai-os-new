export function getProviderColor(provider: string | undefined): string {
    const colors: Record<string, string> = {
        openrouter: '#60a5fa',
        gemini: '#c084fc',
        groq: '#34d399',
        nvidia: '#fbbf24',
    };
    return colors[(provider || '').toLowerCase()] || '#94a3b8';
}

export const DEFAULT_MODELS: Record<string, string> = {
    OpenRouter: 'openai/gpt-4o',
    Gemini: 'gemini-3.1-flash-lite',
    Groq: 'llama-3.3-70b-versatile',
    NVIDIA: 'meta/llama-3.3-70b-instruct',
};

export type ExecutionMode = 'auto' | 'parallel' | 'single';

export function formatTime(ts: number, t: (key: string) => string): string {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString())
        return (
            t('chat.yesterday_prefix') +
            d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function groupSessions(
    sessions: { id: string; title: string; updatedAt: number }[],
    t: (key: string) => string,
): { label: string; sessions: typeof sessions }[] {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: Record<string, { label: string; sessions: typeof sessions }> = {
        today: { label: t('chat.session_group_today'), sessions: [] },
        yesterday: { label: t('chat.session_group_yesterday'), sessions: [] },
        week: { label: t('chat.session_group_week'), sessions: [] },
        earlier: { label: t('chat.session_group_earlier'), sessions: [] },
    };

    for (const s of sessions) {
        const d = new Date(s.updatedAt).toDateString();
        if (d === today) groups.today!.sessions.push(s);
        else if (d === yesterdayStr) groups.yesterday!.sessions.push(s);
        else if (s.updatedAt >= weekAgo.getTime()) groups.week!.sessions.push(s);
        else groups.earlier!.sessions.push(s);
    }

    return Object.values(groups).filter((g) => g.sessions.length > 0);
}
