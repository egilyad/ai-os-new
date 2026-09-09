import type { DataAccessLayer } from '../../dal/types';
import type { IEightStageService } from '../../contracts/rivals16';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('EightStage');
const STAGES=['ingest','normalize','link','candidate','score','synthesize','verify','publish'];
export class EightStageService implements IEightStageService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async run(topic: string){
        const out: string[]=[];
        for (const s of STAGES){ const v=`${s}: ${topic.slice(0,60)}-ok`; out.push(v); await this.dal.kv.set(`eight/${s}/${Date.now()}`, v); }
        return out;
    }
}
