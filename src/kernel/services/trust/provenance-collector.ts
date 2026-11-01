import type { IEventBus } from '../../types/interfaces';
import type { IProvenanceLinker } from '../../contracts/provenance-link';
import { EVENTS } from '../../events/event-names';

/**
 * ProvenanceCollector — мост «события → связи provenance».
 *
 * Автоматически связывает дебаты/кристаллы/синтез/память при наступлении
 * соответствующих событий (debate→crystal, synthesis→crystal и т.д.).
 * Автономен и безопасен: лишние события не ломают поток.
 */
export class ProvenanceCollector {
    private unsubs: Array<() => void> = [];
    private started = false;

    constructor(
        private events: IEventBus,
        private linker: IProvenanceLinker,
    ) {}

    start(): void {
        if (this.started) return;
        this.started = true;

        this.unsubs.push(
            this.events.on(EVENTS.DEBATE_VERDICT_GENERATED, (data: unknown) => {
                const d = data as { sessionId?: string };
                if (d?.sessionId) {
                    this.linker.link(
                        { kind: 'debate', id: d.sessionId },
                        { kind: 'knowledge', id: `verdict:${d.sessionId}` },
                        'derived_from',
                    );
                }
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.CRYSTAL_FORMED, (data: unknown) => {
                const d = data as { crystalId?: string; statement?: string };
                if (d?.crystalId) {
                    this.linker.link(
                        { kind: 'knowledge', id: `verdict:${d.crystalId}` },
                        { kind: 'crystal', id: d.crystalId },
                        'synthesized_into',
                    );
                }
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.SYNTHESIS_COMPLETED, (data: unknown) => {
                const d = data as { synthesisId?: string };
                if (d?.synthesisId) {
                    this.linker.link(
                        { kind: 'synthesis', id: d.synthesisId },
                        { kind: 'knowledge', id: `synthesis:${d.synthesisId}` },
                        'derived_from',
                    );
                }
            }),
        );
    }

    destroy(): void {
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        this.started = false;
    }
}
