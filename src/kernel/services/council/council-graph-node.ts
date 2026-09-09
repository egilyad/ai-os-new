/**
 * Council as a State-Graph node (Wave 2.3, forward-compatible with Wave 3).
 *
 * Wave 3 will introduce a full State Graph runtime (nodes + edges + routing).
 * This adapter already exposes a Council run in node shape so the graph can
 * import it without depending on Council internals:
 *
 *   { nodeType: 'council', id, run(input) -> { winnerId, summary, sessionId } }
 */
import type { ICouncilService } from '../../contracts/council';

export interface CouncilNodeInput {
    topic: string;
    /** Pre-seeded stances: participant name -> stance text. */
    stances?: Record<string, string>;
    doubleBlind?: boolean;
    factGathering?: boolean;
    maxRounds?: number;
}

export interface CouncilNodeOutput {
    sessionId: string;
    winnerId: string;
    summary: string;
}

export function createCouncilGraphNode(council: ICouncilService, nodeId = 'council') {
    return {
        nodeType: 'council' as const,
        id: nodeId,
        async run(input: CouncilNodeInput): Promise<CouncilNodeOutput> {
            const session = await council.createSession({
                topic: input.topic,
                config: {
                    topic: input.topic,
                    doubleBlind: input.doubleBlind,
                    factGathering: input.factGathering,
                    maxRounds: input.maxRounds,
                },
            });
            // Seed any provided stances as proposals.
            if (input.stances) {
                for (const member of session.participants) {
                    const stance = input.stances[member.name];
                    if (stance && (member.kind === 'proponent' || member.kind === 'opponent')) {
                        try {
                            await council.submitProposal(session.id, member.id, stance);
                        } catch {
                            // proposal phase may have advanced — best effort seeding
                        }
                    }
                }
            }
            // Drive to consensus deterministically (judges vote later or externally).
            let current = await council.getSession(session.id);
            while (current && current.phase !== 'consensus' && current.phase !== 'completed') {
                current = await council.advancePhase(session.id);
            }
            const done = await council.conclude(session.id);
            return {
                sessionId: done.id,
                winnerId: done.winnerId ?? 'draw',
                summary: done.summary ?? '',
            };
        },
    };
}

export type CouncilGraphNode = ReturnType<typeof createCouncilGraphNode>;
