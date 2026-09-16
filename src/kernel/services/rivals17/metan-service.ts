import type { DataAccessLayer } from '../../dal/types';
import type { IMetanService } from '../../contracts/rivals17';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Metan');
export class MetanService implements IMetanService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('Metan', 'init',{}); } async destroy(){}
    async buildHierarchy(root: string, depth=2){
        const d=Math.max(1,Math.min(4,depth));
        let agents=1;
        for(let i=1;i<=d;i++) agents*=2;
        await this.dal.kv.set(`metan/${root.slice(0,40)}/${Date.now()}`, { root: root.slice(0,100), depth: d, agents });
        return { agents, depth: d };
    }
}
