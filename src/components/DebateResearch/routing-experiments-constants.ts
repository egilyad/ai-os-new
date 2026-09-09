export const STRATEGIES = ['round-robin', 'latency-first', 'cost-first', 'random'];

export const MODELS = [
    'llama-3.3-70b',
    'gemini-3.1-flash-lite',
    'mixtral-8x7b',
    'gpt-4o-mini',
    'qwen-2.5-7b',
    'llama-3.1-8b',
];

export const chipStyle = (selected: boolean, color: string): React.CSSProperties => ({
    padding: '0.25rem 0.55rem',
    borderRadius: 5,
    border: `1px solid ${selected ? color : 'rgba(255,255,255,0.06)'}`,
    background: selected ? `${color}18` : 'transparent',
    color: selected ? color : 'var(--slate-500)',
    cursor: 'pointer',
    fontSize: '0.72rem',
    fontWeight: 600,
    transition: 'all 0.15s',
});

export const thStyle: React.CSSProperties = {
    padding: '0.35rem 0.55rem',
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--slate-500)',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textAlign: 'right',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
};

export const tdStyle: React.CSSProperties = {
    padding: '0.3rem 0.55rem',
    fontSize: '0.72rem',
    color: 'var(--slate-300)',
    textAlign: 'right',
    whiteSpace: 'nowrap',
};
