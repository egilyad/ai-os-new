import type { ArchFinding } from '../../kernel/contracts/architecture-review';

export function typeColor(type: string): string {
    return type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#60a5fa';
}

export function groupByType(findings: ArchFinding[]): Record<string, ArchFinding[]> {
    const groups: Record<string, ArchFinding[]> = { error: [], warning: [], info: [] };
    for (const f of findings) groups[f.type]!.push(f);
    return groups;
}

export function filterFindings(findings: ArchFinding[], query: string): ArchFinding[] {
    if (!query.trim()) return findings;
    const q = query.toLowerCase();
    return findings.filter(
        (f) =>
            f.message.toLowerCase().includes(q) ||
            f.file?.toLowerCase().includes(q) ||
            f.category.toLowerCase().includes(q),
    );
}
