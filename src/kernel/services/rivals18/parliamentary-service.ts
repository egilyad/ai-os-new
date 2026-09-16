import type { DataAccessLayer } from '../../dal/types';
import type { IParliamentaryService } from '../../contracts/rivals18';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Parliament');
export class ParliamentaryService implements IParliamentaryService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('Parliament', 'init',{}); } async destroy(){}
    async run(topic: string){
        const teams=['OG','OO','CG','CO'];
        const ranking=[...teams].sort(()=>Math.random()-0.5);
        const pois=Math.floor(Math.random()*5);
        await this.dal.kv.set(`parliament/${Date.now()}`, { topic: topic.slice(0,100), ranking, pois });
        return { ranking, pois };
    }
}
