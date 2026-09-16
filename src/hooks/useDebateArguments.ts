import { useMemo } from 'react';
import { useActiveDebateStore } from '../stores/activeDebateStore';

/**
 * Argument shape consumed by quality-technique panels.
 * Mirrors the local `Arg` type used across DriftDetector/StanceDrift/etc.
 */
export interface PanelArg {
    id: string;
    agentId: string;
    agentName: string;
    content: string;
    round: number;
}

/**
 * Canonical real-debate argument source for quality panels.
 *
 * Reads `DebateSession.arguments` from the active debate (multi-session
 * projection) and maps them to the panel `PanelArg` shape. Falls back to an
 * empty array when no debate is active — panels keep their demo seed in that
 * case, so standalone/test usage is unaffected.
 *
 * This is the "real data path" counterpart to `useRealAgents` (which only
 * fixed agent *identity*). Here the panel analyzes ACTUAL debate arguments
 * instead of hardcoded demo content.
 */
export function useDebateArguments(): {
    args: PanelArg[];
    sessionId: string | null;
    topic: string | null;
    hasLiveDebate: boolean;
} {
    const session = useActiveDebateStore((s) => s.session);

    const args = useMemo<PanelArg[]>(() => {
        const raw = session?.arguments ?? [];
        return raw.map((a) => ({
            id: a.id,
            agentId: a.agentId,
            agentName: a.agentName,
            content: a.content,
            round: a.round,
        }));
    }, [session]);

    return {
        args,
        sessionId: session?.id ?? null,
        topic: session?.topic ?? null,
        hasLiveDebate: args.length > 0,
    };
}
