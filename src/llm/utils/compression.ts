import { estimateTokenCount } from './token-counter';

export interface CompressionResult {
    text: string;
    originalTokens: number;
    compressedTokens: number;
    ratio: number;
}

export interface CompressOptions {
    maxTokens?: number;
    strategy?: 'truncate-head' | 'truncate-tail' | 'truncate-middle' | 'drop-system';
}

export function compressText(text: string, options?: CompressOptions): CompressionResult {
    const originalTokens = estimateTokenCount(text);
    const max = options?.maxTokens ?? 4096;

    if (originalTokens <= max) {
        return { text, originalTokens, compressedTokens: originalTokens, ratio: 1 };
    }

    const strategy = options?.strategy ?? 'truncate-middle';
    let compressed = text;

    switch (strategy) {
        case 'truncate-head': {
            const chars = Math.floor((max / originalTokens) * text.length);
            compressed = text.slice(0, chars) + '\n[truncated...]';
            break;
        }
        case 'truncate-tail': {
            const chars = Math.floor((max / originalTokens) * text.length);
            compressed = '[truncated...]\n' + text.slice(-chars);
            break;
        }
        case 'truncate-middle': {
            const halfChars = Math.floor((max / 2 / originalTokens) * text.length);
            compressed = text.slice(0, halfChars) + '\n[...]\n' + text.slice(-halfChars);
            break;
        }
        case 'drop-system':
            break;
    }

    const compressedTokens = estimateTokenCount(compressed);
    return {
        text: compressed,
        originalTokens,
        compressedTokens,
        ratio: compressedTokens / originalTokens,
    };
}

export function compressMessages(
    messages: Array<{ role: string; content: string }>,
    options?: CompressOptions & { keepSystem?: boolean },
): Array<{ role: string; content: string }> {
    let result = messages;

    if (!options?.keepSystem && options?.strategy === 'drop-system') {
        result = result.filter((m) => m.role !== 'system');
    }

    const maxTokens = options?.maxTokens ?? 4096;
    const totalTokens = result.reduce((s, m) => s + estimateTokenCount(m.content), 0);

    if (totalTokens <= maxTokens) return result;

    if (result.length <= 1) {
        const compressed = compressText(result[0]!.content, {
            ...options,
            strategy: options?.strategy === 'drop-system' ? 'truncate-middle' : options?.strategy,
        } as CompressOptions);
        return [{ ...result[0]!, content: compressed.text }];
    }

    const perMsg = Math.floor(maxTokens / result.length);
    return result.map((m) => {
        const tokens = estimateTokenCount(m.content);
        if (tokens <= perMsg) return m;
        const compressed = compressText(m.content, {
            maxTokens: perMsg,
            strategy: 'truncate-middle',
        });
        return { ...m, content: compressed.text };
    });
}

export function getCompressionStats(results: CompressionResult[]): {
    totalOriginal: number;
    totalCompressed: number;
    overallRatio: number;
} {
    const totalOriginal = results.reduce((s, r) => s + r.originalTokens, 0);
    const totalCompressed = results.reduce((s, r) => s + r.compressedTokens, 0);
    return {
        totalOriginal,
        totalCompressed,
        overallRatio: totalOriginal > 0 ? totalCompressed / totalOriginal : 1,
    };
}
