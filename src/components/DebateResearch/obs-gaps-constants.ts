
export const scoreColor = (pct: number) =>
    pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

export const barStyle: React.CSSProperties = {
    height: 5,
    borderRadius: 3,
    background: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    flex: 1,
    minWidth: 60,
};

export const fillBar = (pct: number, color: string): React.CSSProperties => ({
    width: `${pct}%`,
    height: '100%',
    borderRadius: 3,
    background: color,
    transition: 'width 0.5s',
});
