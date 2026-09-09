export async function computeMemoryId(
    content: string,
    source: string,
    type: string,
): Promise<string> {
    const raw = `${source}:${type}:${content}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 12);
    return `mem-${hashHex}`;
}
