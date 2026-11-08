import React, { useState } from 'react';
import { BarChart3, Play, Download, ClipboardCopy, Gem } from 'lucide-react';
import { eventBus, EVENTS, crystalVault } from '../../kernel/instances';
import type { DebateSession, DebateVerdict } from '../../kernel/contracts/debate-types';

interface ExportData {
    topic: string;
    strategy: string;
    status: string;
    maxRounds: number;
    currentRound: number;
    participants: Array<{ id: string; name: string; role: string; model: string | undefined }>;
    arguments: Array<{
        id: string;
        agentId: string;
        content: string;
        round: number;
        timestamp: number;
        confidence: number | undefined;
    }>;
    graphMetrics: Record<string, unknown>;
    interpretation: Record<string, unknown>;
}

interface Props {
    session: DebateSession | null;
    verdict: DebateVerdict | null;
    t: (k: string) => string;
    onViewAnalysis: () => void;
    onReplay?: () => void;
}

function buildTranscript(session: DebateSession): string {
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
    if (session.arguments?.length) {
        lines.push('## Arguments');
        lines.push('');
        for (const a of session.arguments) {
            const agent = session.participants?.find((p) => p.id === a.agentId);
            lines.push(`### Round ${a.round} — ${agent?.name ?? a.agentId}`);
            lines.push('');
            lines.push(`> ${a.content.replace(/\n/g, '\n> ')}`);
            lines.push('');
            if (a.confidence !== undefined) {
                lines.push(`*Confidence: ${(a.confidence * 100).toFixed(0)}%*`);
                lines.push('');
            }
        }
    }
    lines.push('---');
    lines.push('');
    lines.push(`*Exported on ${new Date().toISOString()} from SuperAgents OS*`);
    return lines.join('\n');
}

const VerdictActionButtons: React.FC<Props> = ({
    session,
    verdict,
    t,
    onViewAnalysis,
    onReplay,
}) => {
    const [copying, setCopying] = useState(false);
    const [savingCrystal, setSavingCrystal] = useState(false);
    if (!session || session.status !== 'completed') return null;

    const handleSaveCrystal = async () => {
        if (!verdict || !session || savingCrystal) return;
        setSavingCrystal(true);
        try {
            const existing = await crystalVault.list({ status: 'semi' });
            const already = existing.some(
                (c) =>
                    c.provenance.originKind === 'debate' && c.provenance.originId === session.id,
            );
            if (already) {
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: t('debate.verdict.crystal_exists'),
                    type: 'warning',
                });
                return;
            }
            const proArgs = verdict.keyArguments.filter((a) => a.stance !== 'con');
            const conArgs = verdict.keyArguments.filter((a) => a.stance === 'con');
            const crystalId = await crystalVault.propose({
                content: {
                    statement: verdict.summary?.trim() || verdict.topic?.trim() || session.topic,
                    elaboration: verdict.reasoning?.trim() || undefined,
                    evidence: proArgs.map((a) => a.content).filter(Boolean),
                    evidenceRefs: proArgs
                        .filter((a) => a.content)
                        .map((a) => ({
                            claimId: a.argumentId,
                            quote: a.content,
                            agentId: a.agentId,
                            agentName: a.agentName,
                        })),
                },
                originKind: 'debate',
                originId: session.id,
                contributingAgents: (session.participants ?? [])
                    .map((p) => p.name)
                    .filter(Boolean),
                modelIds: (session.participants ?? [])
                    .map((p) => p.modelId)
                    .filter((m): m is string => Boolean(m)),
                totalTokensSpent: verdict.totalTokens ?? session.totalTokens ?? 0,
                applicableDomain: 'general',
            });
            await crystalVault.validate(crystalId, {
                debateId: session.id,
                proArguments: proArgs.map((a) => a.content).filter(Boolean),
                conArguments: conArgs.map((a) => a.content).filter(Boolean),
                reviewers: [],
                confidence: Math.min(0.95, verdict.confidence ?? 0.5),
            });
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: t('debate.verdict.crystal_saved'),
                type: 'success',
            });
        } catch {
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: t('debate.verdict.copy_failed'),
                type: 'error',
            });
        } finally {
            setSavingCrystal(false);
        }
    };

    const handleCopyTranscript = async () => {
        if (!session) return;
        setCopying(true);
        try {
            const text = buildTranscript(session);
            await navigator.clipboard.writeText(text);
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: t('debate.verdict.copied'),
                type: 'success',
            });
        } catch {
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: t('debate.verdict.copy_failed'),
                type: 'error',
            });
        } finally {
            setCopying(false);
        }
    };

    const handleExport = () => {
        const exportData: ExportData = {
            topic: session.topic,
            strategy: session.strategy,
            status: session.status,
            maxRounds: session.maxRounds,
            currentRound: session.currentRound,
            participants: (session.participants ?? []).map((p) => ({
                id: p.id,
                name: p.name,
                role: p.role,
                model: p.modelId,
            })),
            arguments: (session.arguments ?? []).map((a) => ({
                id: a.id,
                agentId: a.agentId,
                content: a.content,
                round: a.round,
                timestamp: a.timestamp,
                confidence: a.confidence,
            })),
            graphMetrics: (session as unknown as Record<string, unknown>).graphMetrics as Record<
                string,
                unknown
            >,
            interpretation: (session as unknown as Record<string, unknown>)
                .interpretation as Record<string, unknown>,
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debate-${(session.topic ?? '').slice(0, 50).replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
            a.remove();
        }, 100);
    };

    const btnBase: React.CSSProperties = {
        padding: '10px 20px',
        borderRadius: 10,
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    };

    return (
        <div style={{ display: 'flex', gap: 10, marginTop: '1rem', justifyContent: 'center' }}>
            <button
                onClick={handleCopyTranscript}
                disabled={copying}
                style={{
                    ...btnBase,
                    border: '1px solid rgba(16,185,129,0.3)',
                    background: 'var(--success-tint)',
                    color: '#34d399',
                }}
            >
                <ClipboardCopy size={16} /> {copying ? '...' : t('debate.verdict.copy_transcript')}
            </button>
            <button
                onClick={onViewAnalysis}
                style={{
                    ...btnBase,
                    border: '1px solid rgba(59,130,246,0.3)',
                    background: 'var(--accent-tint)',
                    color: '#60a5fa',
                }}
            >
                <BarChart3 size={16} /> {t('debate.verdict.view_analysis')}
            </button>
            {onReplay && (
                <button
                    onClick={onReplay}
                    style={{
                        ...btnBase,
                        border: '1px solid rgba(16,185,129,0.3)',
                        background: 'var(--success-tint)',
                        color: '#34d399',
                    }}
                >
                    <Play size={16} /> {t('common.retry')}
                </button>
            )}
            <button
                onClick={handleExport}
                style={{
                    ...btnBase,
                    border: '1px solid rgba(139,92,246,0.3)',
                    background: 'var(--purple-tint)',
                    color: 'var(--purple-muted)',
                }}
            >
                <Download size={16} /> {t('debate.verdict.export')}
            </button>
            <button
                onClick={() => void handleSaveCrystal()}
                disabled={savingCrystal}
                style={{
                    ...btnBase,
                    border: '1px solid rgba(16,185,129,0.3)',
                    background: 'var(--success-tint)',
                    color: '#34d399',
                }}
            >
                <Gem size={16} /> {savingCrystal ? '...' : t('debate.verdict.save_crystal')}
            </button>
        </div>
    );
};

export default VerdictActionButtons;
