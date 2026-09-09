export function estimateTokenCount(text: string): number {
    if (!text) return 0;
    let cjk = 0;
    let ascii = 0;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf)) {
            cjk++;
        } else {
            ascii++;
        }
    }
    return Math.ceil(cjk * 2 + ascii / 4);
}

export function countChars(text: string): number {
    return text.length;
}

export function formatTokenCount(tokens: number): string {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
    return String(tokens);
}
