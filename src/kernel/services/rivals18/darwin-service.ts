import type { DataAccessLayer } from '../../dal/types';
import type { IDarwinService } from '../../contracts/rivals18';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Darwin');
export class DarwinService implements IDarwinService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async evolve(seed: string, gens=5){
        let best=seed; let score=seed.length % 10;
        for(let i=0;i<Math.max(1,Math.min(10,gens));i++){
            const mutated=best.slice(0,Math.floor(Math.random()*best.length)) + String.fromCharCode(97+Math.floor(Math.random()*26)) + best.slice(Math.floor(Math.random()*best.length));
            const s=mutated.length % 13;
            if(s>score){ best=mutated.slice(0,500); score=s; }
            await this.dal.kv.set(`darwin/${genId('gen')}`, { best: best.slice(0,100), score });
        }
        try{ this.events?.emit(EVENTS.DARWIN_EVOLVE, { task: seed.slice(0,200) }); }catch{}
        return { best: best.slice(0,300), score };
    }
}
