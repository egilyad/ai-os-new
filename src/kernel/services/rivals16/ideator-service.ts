import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IIdeatorService } from '../../contracts/rivals16';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Ideator');
export class IdeatorService implements IIdeatorService {
    constructor(private dal: DataAccessLayer, private llm?: ILLMClientService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async testDialogues(topic: string){
        const designs=['debate','brainstorm','critique'];
        const scores: Record<string,number>={};
        for (const d of designs) scores[d]=Math.round((0.5+Math.random()*0.5)*100)/100;
        const best=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0]?.[0]??'debate';
        await this.dal.kv.set(`ideator/${Date.now()}`, { topic: topic.slice(0,100), best, scores });
        return { best, scores };
    }
}
