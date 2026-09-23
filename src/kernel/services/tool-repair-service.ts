/**
 * Tool Repair — AGEMS Phase 12.4
 * Fixes common LLM mistakes in tool_use before sending back.
 */
export function repairToolCall(_tool: string, input: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = { ...input };
    // Fix missing required fields: coerce undefined → "" for string fields
    for (const [k, v] of Object.entries(out)) {
        if (v === undefined) out[k] = '';
    }
    // Fix wrong types: numbers as strings
    for (const [k, v] of Object.entries(out)) {
        if (typeof v === 'string' && /^\d+$/.test(v) && k.toLowerCase().includes('count') || k.toLowerCase().includes('limit')) {
            const n = Number(v);
            if (!Number.isNaN(n)) out[k] = n;
        }
    }
    // Fix tool name typos: trim and lower
    // (caller should validate tool exists via ToolCatalog)
    return out;
}

export function isRepairableError(error: string): boolean {
    return /missing required|invalid type|expected string|required field/i.test(error);
}
