/**
 * SoarService — M.2 (SOAR production cycle, additive).
 *
 * Working-memory facts in DAL kv (`soar-wm`), productions (when/then maps),
 * decide-act loop: fire all matching productions per cycle; when nothing
 * matches, an impasse opens a substate (stacked context) that can assert
 * facts; chunking compiles a substate's solution into a new production.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ISoarService } from '../../contracts/rivals7';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('SOAR');

interface Production {
    id: string;
    name: string;
    when: Record<string, string>;
    then: Record<string, string>;
    chunked: boolean;
}

export class SoarService implements ISoarService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('SOAR', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async setFact(key: string, value: string): Promise<void> {
        const wm = (await this.dal.kv.get<Record<string, string>>('soar-wm')) ?? {};
        wm[key.slice(0, 80)] = value.slice(0, 500);
        await this.dal.kv.set('soar-wm', wm);
    }

    async addProduction(input: {
        name: string;
        when: Record<string, string>;
        then: Record<string, string>;
    }): Promise<string> {
        const productions = (await this.dal.kv.get<Production[]>('soar-productions')) ?? [];
        const prod: Production = {
            id: genId('prod'),
            name: input.name.slice(0, 120),
            when: { ...input.when },
            then: { ...input.then },
            chunked: false,
        };
        productions.push(prod);
        await this.dal.kv.set('soar-productions', productions);
        return prod.id;
    }

    async cycle(maxCycles = 20): Promise<{ fired: string[]; impasses: number; chunks: number }> {
        const fired: string[] = [];
        let impasses = 0;
        let chunks = 0;
        const cap = Math.max(1, Math.min(100, maxCycles));

        for (let c = 0; c < cap; c++) {
            const wm = (await this.dal.kv.get<Record<string, string>>('soar-wm')) ?? {};
            const productions = (await this.dal.kv.get<Production[]>('soar-productions')) ?? [];
            const matched = productions.filter((p) =>
                Object.entries(p.when).every(([k, v]) => wm[k] === v),
            );
            if (matched.length === 0) {
                // Impasse → substate: record the stuck context, resolve by
                // asserting a default, then chunk a production from it.
                impasses += 1;
                const substate = `impasse-${impasses}@${Object.entries(wm).map(([k, v]) => `${k}=${v}`).join(',').slice(0, 200)}`;
                await this.dal.kv.set(`soar-substates/${Date.now()}`, substate);
                const chunk: Production = {
                    id: genId('prod'),
                    name: `chunked-${impasses}`,
                    when: { ...wm },
                    then: { resolved: `impasse-${impasses}` },
                    chunked: true,
                };
                productions.push(chunk);
                await this.dal.kv.set('soar-productions', productions);
                chunks += 1;
                this.events.emit(EVENTS.SOAR_IMPASSE, { impasse: impasses });
                continue;
            }
            for (const p of matched) {
                Object.assign(wm, p.then);
                fired.push(p.name);
            }
            await this.dal.kv.set('soar-wm', wm);
            this.events.emit(EVENTS.SOAR_FIRED, { count: matched.length });
            if (wm['halt'] === 'true') break;
        }
        return { fired: fired.slice(0, 100), impasses, chunks };
    }
}
