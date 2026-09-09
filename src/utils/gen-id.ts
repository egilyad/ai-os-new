export function genId(prefix = ''): string {
    return `${prefix}${prefix ? '-' : ''}${Date.now().toString(36)}-${crypto.randomUUID()}`;
}
