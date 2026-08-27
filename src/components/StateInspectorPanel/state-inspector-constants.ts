export const MAX_INLINE = 4;

export function valueType(v: unknown): string {
    if (v === null) return 'null';
    if (Array.isArray(v)) return `array(${v.length})`;
    if (typeof v === 'object') return 'object';
    if (typeof v === 'string') return 'string';
    if (typeof v === 'number') return 'number';
    if (typeof v === 'boolean') return 'boolean';
    return typeof v;
}

export function valueColor(v: unknown): string {
    const t = valueType(v);
    if (t === 'string') return '#86efac';
    if (t === 'number') return '#fcd34d';
    if (t === 'boolean') return '#f0abfc';
    if (t === 'null') return '#94a3b8';
    if (t.startsWith('array')) return '#7dd3fc';
    if (t.startsWith('object')) return '#c4b5fd';
    return '#e2e8f0';
}
