import type { DebateSession, DebateInterpretation } from '../../contracts/debate-types';
import type { ProjectRepository } from '../../dal/project-repository';

/**
 * Полноценный Markdown-документ Research Brief со всеми разделами.
 * Не просто дамп аргументов: резюме, схема, таблица фактов, ключевые пункты,
 * ограничения, источники.
 */
export function buildResearchBriefMarkdown(
    session: DebateSession,
    interpretation: DebateInterpretation | undefined,
): string {
    const args = session.arguments ?? [];
    const topic = session.topic ?? 'Untitled debate';
    const lines: string[] = [];

    lines.push(`# Research Brief: ${topic}`);
    lines.push('');
    lines.push(`- Date: ${new Date().toISOString()}`);
    lines.push(`- Debate: ${session.id}`);
    lines.push(`- Strategy: ${session.strategy ?? 'unknown'}`);
    lines.push(`- Participants: ${session.participants?.length ?? 0}`);
    lines.push(`- Rounds: ${session.currentRound ?? 0}`);
    lines.push(`- Arguments: ${args.length}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    if (interpretation?.researchBrief) {
        lines.push(interpretation.researchBrief);
    } else if (interpretation?.summary) {
        lines.push(interpretation.summary);
    } else {
        lines.push('No summary available.');
    }
    lines.push('');

    // Diagram (tree-style)
    lines.push('## Diagram');
    lines.push('');
    lines.push('```text');
    lines.push(topic);
    const participants = session.participants ?? [];
    if (participants.length > 0) {
        lines.push('  |');
        participants.forEach((p, i) => {
            lines.push(`  +-- ${p.name} [${p.role ?? 'neutral'}]`);
            if (i < participants.length - 1) lines.push('  |');
        });
    }
    lines.push('```');
    lines.push('');

    // Key points (top arguments)
    lines.push('## Key points');
    lines.push('');
    const topArgs = args.slice(-12);
    if (topArgs.length === 0) {
        lines.push('- No arguments recorded.');
    } else {
        topArgs.forEach((a) => {
            const content = (a.content ?? '').trim().replace(/\s+/g, ' ');
            lines.push(`- [${a.agentName ?? a.agentId}] ${content.slice(0, 300)}`);
        });
    }
    lines.push('');

    // Facts table
    lines.push('## Facts');
    lines.push('');
    lines.push('| # | Agent | Role | Statement |');
    lines.push('| --- | --- | --- | --- |');
    args.slice(-12).forEach((a, i) => {
        const content = (a.content ?? '').trim().replace(/\s+/g, ' ');
        lines.push(`| ${i + 1} | ${a.agentName ?? a.agentId} | ${a.position ?? ''} | ${content.slice(0, 200)} |`);
    });
    lines.push('');

    // Limitations
    lines.push('## Limitations');
    lines.push('');
    lines.push('- Conclusions are based on agent arguments; verify critical sources separately.');
    if ((session.currentRound ?? 0) < 3) {
        lines.push('- Short debate: results are preliminary.');
    }
    lines.push('');

    // Sources (from arguments, if any metadata present)
    lines.push('## Sources');
    lines.push('');
    const sources = new Set<string>();
    args.forEach((a) => {
        const meta = (a as unknown as { metadata?: { sources?: string[] } }).metadata;
        if (meta?.sources) meta.sources.forEach((s) => sources.add(s));
    });
    if (sources.size === 0) {
        lines.push('- No explicit sources recorded.');
    } else {
        sources.forEach((s) => lines.push(`- ${s}`));
    }
    lines.push('');

    return lines.join('\n');
}

/**
 * Сохраняет Research Brief как файл проекта: `DebateResults/<slug>.md`.
 * Использует существующий repo.putFile; попадание в граф обеспечивает
 * проекция workspace:file:written.
 */
export async function exportResearchBriefToProject(
    repo: ProjectRepository,
    projectId: string,
    session: DebateSession,
    interpretation: DebateInterpretation | undefined,
): Promise<{ path: string } | undefined> {
    if (!projectId) return undefined;
    const slug = (session.topic ?? `debate-${session.id}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || `debate-${session.id}`;
    const path = `DebateResults/${slug}.md`;
    const content = buildResearchBriefMarkdown(session, interpretation);
    const now = Date.now();
    await repo.putFile({
        projectId,
        path,
        content,
        createdAt: now,
        updatedAt: now,
    });
    return { path };
}
