export function constantTimeEqual(a: string, b: string): boolean {
    const maxLen = Math.max(a.length, b.length);
    let result = 0;
    for (let i = 0; i < maxLen; i++) {
        result |= a.charCodeAt(i % a.length) ^ b.charCodeAt(i % b.length);
    }
    return result === 0 && a.length === b.length;
}
