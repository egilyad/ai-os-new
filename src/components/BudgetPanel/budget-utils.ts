export const fmtUSD = (v: number, locale: string): string =>
    new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(v);

export const usageColor = (pct: number) => {
    if (pct >= 90) return '#ef4444';
    if (pct >= 75) return '#f59e0b';
    if (pct >= 50) return '#3b82f6';
    return '#10b981';
};
