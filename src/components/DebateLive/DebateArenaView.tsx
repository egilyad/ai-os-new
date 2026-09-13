import React, { useMemo } from 'react';
import { useDebateLiveStore } from '../../stores/debateLiveStore';
import { CircularLayout } from './CircularLayout';
import { JudgeCenter } from './JudgeCenter';
import { SocratesMascot } from './SocratesMascot';
import { debateEngine } from '../../kernel/instances';
import type { ArenaLayout } from '../../kernel/contracts/debate-emotion';
import { useTranslation } from '../../i18n/useTranslation';

interface DebateArenaViewProps {
    sessionId: string | null;
    layout?: ArenaLayout;
    minHeight?: number;
}

/**
 * Embeddable live arena: same subscriptions as the standalone DebateLivePanel,
 * but driven by an explicit sessionId so it can live inside the debate run
 * view (start → live → verdict) instead of a separate route.
 * Pure consumer of the engine + live store — never drives the debate.
 */
export const DebateArenaView: React.FC<DebateArenaViewProps> = ({
    sessionId,
    layout = 'circle',
    minHeight = 480,
}) => {
    const { t } = useTranslation();
    const streamingContent = useDebateLiveStore((s) => s.streamingContent);
    const currentThinking = useDebateLiveStore((s) => s.currentThinking);

    const sessions = debateEngine.getAllSessions();
    const session = useMemo(
        () => sessions.find((s) => s.id === sessionId) ?? null,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sessionId, sessions.length],
    );
    const participants = useMemo(
        () => session?.topology.nodes.filter((n) => n.role !== 'judge') ?? [],
        [session],
    );
    const judge = useMemo(
        () => session?.topology.nodes.find((n) => n.role === 'judge') ?? null,
        [session],
    );

    let activeSpeakerId: string | null = null;
    if (session) {
        for (const p of participants) {
            if (streamingContent.get(`${session.id}:${p.id}`)) {
                activeSpeakerId = p.id;
                break;
            }
        }
        if (!activeSpeakerId) {
            for (const p of participants) {
                if (currentThinking.get(`${session.id}:${p.id}`)) {
                    activeSpeakerId = p.id;
                    break;
                }
            }
        }
    }

    return (
        <div style={{ position: 'relative', width: '100%', minHeight, overflow: 'hidden' }}>
            {session ? (
                <>
                    <div
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--slate-500)',
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: 'rgba(0,0,0,0.3)',
                            display: 'inline-block',
                            marginBottom: 8,
                        }}
                        aria-live="polite"
                        role="status"
                    >
                        {session.phase} · {t('debate_live.round_label', { n: session.round })}
                    </div>
                    <CircularLayout
                        participants={participants}
                        activeSpeakerId={activeSpeakerId}
                        sessionId={session.id}
                        layout={layout}
                    />
                    {judge && (
                        <JudgeCenter judge={judge} sessionId={session.id} phase={session.phase} />
                    )}
                    <SocratesMascot />
                </>
            ) : (
                <div style={{ color: 'var(--slate-500)', fontSize: '0.9rem', textAlign: 'center' }}>
                    {t('debate_live.empty')}
                </div>
            )}
        </div>
    );
};

export default DebateArenaView;
