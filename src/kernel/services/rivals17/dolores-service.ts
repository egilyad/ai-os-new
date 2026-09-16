import type { DataAccessLayer } from '../../dal/types';
import type { IDoloresService } from '../../contracts/rivals17';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('DOLORES');
export class DoloresService implements IDoloresService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('DOLORES', 'init',{}); } async destroy(){}
    async scaffold(steps: Array<{ do: string; pre?: string; post?: string }>){
        const id=`dolores-${Date.now()}`;
        await this.dal.kv.set(`dolores/${id}`, { steps: steps.slice(0,10), trace: [] as string[] });
        return id;
    }
    async trace(){
        const rows=await this.dal.kv.list('dolores/');
        return rows.map(r=>r.id).slice(0,10);
    }
}
