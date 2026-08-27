import type { ICrystalVaultService } from '../../contracts/knowledge-crystal';
import type { DebateVerdict } from '../../contracts/debate-types';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('CrystalDebateBridge');

/**
 * CrystalDebateBridge — listens to debate verdicts and proposes crystals
 * distilled from the verdict's key arguments (plan §2.2).
 *
 * A debate verdict with strong confidence (≥ 0.55) becomes a 'semi' crystal
 * (validated) so the normal crystallize() flow can promote it later.
 */
export class CrystalDebateBridge {
    private unsubs: Array<() => void> = [];
    private handled = new Set<string>();

    constructor(
        private deps: {
            eventBus: IEventBus;
            crystalVault: ICrystalVaultService;
        },
    ) {}

    init(): void {
        this.unsubs.push(
            this.deps.eventBus.onSafe<{ sessionId: string; verdict: DebateVerdict }>(
                EVENTS.DEBATE_VERDICT_GENERATED,
                (data) => {
                    void this.onVerdict(data.sessionId, data.verdict);
                },
            ),
        );
    }

    destroy(): void {
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        this.handled.clear();
    }

    private async onVerdict(sessionId: string, verdict: DebateVerdict | undefined): Promise<void> {
        if (!verdict || this.handled.has(sessionId)) return;
        this.handled.add(sessionId);

        const statement = verdict.summary?.trim() || verdict.topic?.trim();
        if (!statement || statement.length < 24) return;

        const proArguments = (verdict.keyArguments ?? [])
            .filter((a) => a.stance !== 'con')
            .map((a) => a.content)
            .filter(Boolean);
        const conArguments = (verdict.keyArguments ?? [])
            .filter((a) => a.stance === 'con')
            .map((a) => a.content)
            .filter(Boolean);

        try {
            const crystalId = await this.deps.crystalVault.propose({
                content: {
                    statement,
                    elaboration: verdict.reasoning?.trim() || undefined,
                    evidence: proArguments,
                },
                originKind: 'debate',
                originId: sessionId,
                contributingAgents: [],
                modelIds: [],
                totalTokensSpent: verdict.totalTokens ?? 0,
                applicableDomain: 'general',
            });

            await this.deps.crystalVault.validate(crystalId, {
                debateId: sessionId,
                proArguments,
                conArguments,
                reviewers: [],
                confidence: Math.min(0.95, verdict.confidence ?? 0.5),
            });

            LOGGER.info('CrystalDebateBridge', 'crystal proposed from debate verdict', {
                sessionId,
                crystalId,
                confidence: verdict.confidence,
            });
        } catch (e) {
            LOGGER.warn('CrystalDebateBridge', 'failed to propose crystal from verdict', {
                sessionId,
                error: e,
            });
        }
    }
}
