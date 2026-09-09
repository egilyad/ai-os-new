import type { DataAccessLayer } from '../../dal/types';
import type { ISynService } from '../../contracts/rivals16';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Syn');
export class SynService implements ISynService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async remember(kind: string, text: string){ await this.dal.kv.set(`syn-mem/${kind}/${Date.now()}`, text.slice(0,1000)); }
    async sleep(){
        const rows=await this.dal.kv.list('syn-mem/');
        let compressed=0;
        for (const r of rows.slice(0,20)) {
            const v=r.value as string;
            if (v.length>200) { await this.dal.kv.set(r.id, v.slice(0,200)+' [compressed]'); compressed++; }
        }
        return compressed;
    }
    async loop(){
        const rows=await this.dal.kv.list('syn-mem/');
        return `Syn default loop: ${rows.length} typed memories, sleep consolidates`;
    }
}
