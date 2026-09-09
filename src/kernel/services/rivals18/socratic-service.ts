import type { DataAccessLayer } from '../../dal/types';
import type { ISocraticService } from '../../contracts/rivals18';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Socratic');
export class SocraticService implements ISocraticService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async ask(question: string){ const q=question.slice(0,300); const list=(await this.dal.kv.get<string[]>('socratic/queue'))??[]; list.push(q); await this.dal.kv.set('socratic/queue', list.slice(-20)); }
    async discuss(topic: string){
        const qs=(await this.dal.kv.get<string[]>('socratic/queue'))??[];
        return `Socratic seminar on ${topic.slice(0,80)}: ${qs.slice(-3).join(' | ') || 'What is the essence?'}`;
    }
}
