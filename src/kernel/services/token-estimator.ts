/**
 * Token Estimator — AGEMS port, Phase 12.4.
 * Estimates token count from text using character-based heuristic.
 */

// Approximate tokens per character by language/script
const CHARS_PER_TOKEN: Record<string, number> = {
    latin: 4,   // ~4 chars per token for English
    cyrillic: 3, // ~3 chars per token for Russian
    cjk: 1.5,   // ~1.5 chars per token for CJK
    code: 3.5,   // ~3.5 chars per token for code
    default: 3.5,
};

function getScriptType(text: string): string {
    // Simple heuristic based on character ranges
    if (/[\u0400-\u04FF]/.test(text)) return 'cyrillic';
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)) return 'cjk';
    if (/[{}[\];:()=>]/.test(text)) return 'code';
    return 'latin';
}

/**
 * Estimate token count from text.
 * Uses character-based heuristic (~4 chars per token for English).
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    const script = getScriptType(text);
    const charsPerToken = CHARS_PER_TOKEN[script] ?? CHARS_PER_TOKEN.default;
    return Math.ceil(text.length / charsPerToken);
}

/**
 * Estimate tokens for a message array.
 */
export function estimateMessageTokens(messages: Array<{ role: string; content: string }>): number {
    let total = 0;
    for (const msg of messages) {
        // Overhead for role/formatting: ~4 tokens per message
        total += 4;
        total += estimateTokens(msg.content);
    }
    // Conversation overhead
    total += 3;
    return total;
}

/**
 * Truncate text to fit within a token budget.
 */
export function truncateToTokenBudget(text: string, maxTokens: number): string {
    const charsPerToken = CHARS_PER_TOKEN[getScriptType(text)] ?? CHARS_PER_TOKEN.default;
    const maxChars = Math.floor(maxTokens * charsPerToken);
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars) + '...';
}
