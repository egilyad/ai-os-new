import type { DataAccessLayer } from '../../dal/types';
import type { IWorldModelService } from '../../contracts/rivals12';
import type { ICuriosityService } from '../../contracts/rivals12';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Curio');
export class CuriosityService implements ICuriosityService {
    constructor(private dal: DataAccessLayer, private world?: IWorldModelService) {}
    async init(){ LOGGER.info('Curio', 'init',{}); } async destroy(){}
    async bonus(state: string, action: string){
        if (this.world) {
            const pred = await this.world.predict(state, action).catch(()=>null);
            if (!pred) return 1;
            return Math.abs(pred.reward) < 0.01 ? 0.9 : 0.1;
        }
        const key = `curio-visits/${state.slice(0,60)}/${action.slice(0,40)}`;
        const visits = (await this.dal.kv.get<number>(key)) ?? 0;
        await this.dal.kv.set(key, visits+1);
        return 1 / (1 + visits);
    }
    async pickAction(state: string, actions: string[]){
        let best = actions[0] as string; let bestB=-1;
        for (const a of actions){ const b=await this.bonus(state,a); if(b>bestB){ bestB=b; best=a; } }
        return best;
    }
}
