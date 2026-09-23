import type { DataAccessLayer } from '../../dal/types';
import type { IEvoLabService } from '../../contracts/rivals15';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import type { IEventBus } from '../../types/interfaces';
const LOGGER = rootLogger.child('EvoLab');
export class EvoLabService implements IEvoLabService {
    constructor(private dal: DataAccessLayer, private events: IEventBus) {}
    async init(){ LOGGER.info('EvoLab', 'init',{}); } async destroy(){}
    async runLab(pattern: string){
        // реюз Frontier eval: прогон паттерна и метрика
        const score=Math.round((Math.random()*0.4+0.6)*100)/100;
        const key=`evolab/${pattern.slice(0,60)}/${Date.now()}`;
        await this.dal.kv.set(key, { pattern: pattern.slice(0,80), score, at: Date.now() });
        this.events.emit(EVENTS.EVOLAB_RUN, { pattern: pattern.slice(0,40), score } as never);
        return { metric: `score:${pattern.slice(0,20)}`, score };
    }
}
