/**
 * Pull the first JSON value out of an LLM reply. Models often wrap JSON in
 * markdown fences or prose; we find the outermost object/array braces instead
 * of assuming a clean response.
 */
export function extractJson(text: string): unknown {
    const cleaned = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let start = -1;
    if (firstBrace === -1) start = firstBracket;
    else if (firstBracket === -1) start = firstBrace;
    else start = Math.min(firstBrace, firstBracket);

    if (start === -1) throw new Error('No JSON object/array found in the LLM reply');

    const open = cleaned[start];
    const close = open === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < cleaned.length; i += 1) {
        const ch = cleaned[i];
        if (inString) {
            if (escape) escape = false;
            else if (ch === '\\') escape = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') {
            inString = true;
            continue;
        }
        if (ch === open) depth += 1;
        else if (ch === close) {
            depth -= 1;
            if (depth === 0) {
                return JSON.parse(cleaned.slice(start, i + 1));
            }
        }
    }
    throw new Error('Unbalanced JSON in the LLM reply');
}
