import type { DebateSession } from '../../kernel/instances';

export function buildDebateMarkdown(session: DebateSession): string {
    const lines: string[] = [];
    lines.push(`# ${session.topic}`);
    lines.push('');
    lines.push(
        `**Strategy:** ${session.strategy} | **Rounds:** ${session.currentRound}/${session.maxRounds} | **Status:** ${session.status}`,
    );
    lines.push('');
    lines.push('---');
    lines.push('');
    if (session.consensus) {
        lines.push('## Consensus');
        lines.push('');
        lines.push(session.consensus);
        lines.push('');
        lines.push('---');
        lines.push('');
    }
    if (session.interpretation) {
        lines.push('## Interpretation');
        lines.push('');
        lines.push(session.interpretation.summary);
        lines.push('');
        lines.push('---');
        lines.push('');
    }
    if (session.participants?.length) {
        lines.push('## Participants');
        lines.push('');
        for (const p of session.participants) {
            lines.push(`- **${p.name}** (${p.role})${p.modelId ? ` — ${p.modelId}` : ''}`);
        }
        lines.push('');
        lines.push('---');
        lines.push('');
    }
    if (session.arguments?.length) {
        lines.push('## Arguments');
        lines.push('');
        for (const a of session.arguments) {
            const agent = session.participants?.find((p) => p.id === a.agentId);
            lines.push(`### Round ${a.round} — ${agent?.name ?? a.agentId}`);
            lines.push('');
            lines.push(`> ${a.content.replace(/\n/g, '\n> ')}`);
            lines.push('');
            lines.push(`*Confidence: ${((a.confidence ?? 0) * 100).toFixed(0)}%*`);
            lines.push('');
        }
    }
    lines.push('---');
    lines.push('');
    lines.push(`*Exported on ${new Date().toISOString()} from SuperAgents OS*`);
    lines.push('');
    return lines.join('\n');
}
