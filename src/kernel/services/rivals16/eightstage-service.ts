import type { DataAccessLayer } from '../../dal/types';
import type { IEightStageService } from '../../contracts/rivals16';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('EightStage');
const STAGES=['ingest','normalize','link','candidate','score','synthesize','verify','publish'];
export class EightStageService implements IEightStageService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('EightStage', 'init',{}); } async destroy(){}
    async run(topic: string){
        const out: string[]=[];
        for (const s of STAGES){ const v=`${s}: ${topic.slice(0,60)}-ok`; out.push(v); await this.dal.kv.set(`eight/${s}/${Date.now()}`, v); }
        try{ this.events?.emit(EVENTS.EIGHTSTAGE_RUN, { topic: topic.slice(0,200), stages: out.length }); }catch{ /* best-effort */ }
        return out;
    }
}
