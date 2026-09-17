/**
 * Extended Thinking Extraction — AGEMS Phase 12.2
 * Normalizes reasoning/thinking across 5 providers.
 */

export interface ThinkingBlock {
    provider: string;
    raw: string;
    normalized: string;
}

export function extractThinking(provider: string, response: unknown): ThinkingBlock | null {
    try {
        const p = provider.toLowerCase();

        // Anthropic: content blocks [{type:'thinking', thinking:{content}}]
        if (p.includes('anthropic')) {
            const r = response as { content?: Array<{ type: string; thinking?: { content: string }; text?: string }> };
            const blk = r.content?.find((c) => c.type === 'thinking');
            if (blk?.thinking?.content) return { provider, raw: blk.thinking.content, normalized: blk.thinking.content.trim() };
        }

        // Google Gemini: reasoningContent or thought
        if (p.includes('gemini') || p.includes('google')) {
            const r = response as { reasoningContent?: string; thought?: string; candidates?: Array<{ content?: { parts?: Array<{ thought?: boolean; text?: string }> } }> };
            if (r.reasoningContent) return { provider, raw: r.reasoningContent, normalized: r.reasoningContent.trim() };
            if (r.thought) return { provider, raw: r.thought, normalized: r.thought.trim() };
            const part = r.candidates?.[0]?.content?.parts?.find((x) => x.thought);
            if (part?.text) return { provider, raw: part.text, normalized: part.text.trim() };
        }

        // DeepSeek: <think>...</think> tags in content
        if (p.includes('deepseek')) {
            const r = response as { content?: string };
            const m = r.content?.match(/<think>([\s\S]*?)<\/think>/i);
            if (m?.[1]) return { provider, raw: m[0], normalized: m[1].trim() };
        }

        // GLM/Zhipu: thinking field
        if (p.includes('glm') || p.includes('zhipu')) {
            const r = response as { thinking?: string; content?: string };
            if (r.thinking) return { provider, raw: r.thinking, normalized: r.thinking.trim() };
        }

        // Ollama: delta.reasoning
        if (p.includes('ollama')) {
            const r = response as { delta?: { reasoning?: string }; reasoning?: string };
            const v = r.delta?.reasoning ?? r.reasoning;
            if (v) return { provider, raw: v, normalized: v.trim() };
        }

        return null;
    } catch {
        return null;
    }
}
