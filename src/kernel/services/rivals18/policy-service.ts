import type { IPolicyDebateService } from '../../contracts/rivals18';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('PolicyDebate');
export class PolicyDebateService implements IPolicyDebateService {
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async run(topic: string, plan: string){
        const advantages=[`Advantage of ${plan.slice(0,40)}: solves ${topic.slice(0,30)}`];
        const disadvantages=[`Disadvantage: cost of ${plan.slice(0,30)}`];
        return { advantages, disadvantages };
    }
}
