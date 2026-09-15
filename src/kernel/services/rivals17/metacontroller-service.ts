import type { IEventBus } from '../../types/interfaces';
import type { IMetaControllerService } from '../../contracts/rivals17';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('MetaCtrl');
const CATALOG=['blackboard','storm','debate','synthesis','genius','reflexion'];
export class MetaControllerService implements IMetaControllerService {
    constructor(_events: IEventBus) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async pick(task: string){
        const low=task.toLowerCase();
        if (low.includes('debate')||low.includes('спор')) return 'debate';
        if (low.includes('research')||low.includes('исслед')) return 'storm';
        if (low.includes('blackboard')) return 'blackboard';
        if (low.includes('synthesis')) return 'synthesis';
        const choice=CATALOG[Math.floor(Math.random()*CATALOG.length) as number] as string;
        return choice;
    }
}
