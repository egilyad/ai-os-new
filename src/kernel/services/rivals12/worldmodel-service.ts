import type { DataAccessLayer } from '../../dal/types';
import type { IWorldModelService } from '../../contracts/rivals12';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('WorldModel');
export class WorldModelService implements IWorldModelService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('WorldModel', 'init',{}); } async destroy(){}
    async record(state: string, action: string, next: string, reward: number){
        const key = `world/${state.slice(0,80)}/${action.slice(0,40)}`;
        const list = (await this.dal.kv.get<Array<{next:string;reward:number}>>(key)) ?? [];
        list.push({ next: next.slice(0,80), reward });
        if (list.length>20) list.splice(0, list.length-20);
        await this.dal.kv.set(key, list);
    }
    async predict(state: string, action: string){
        const list = await this.dal.kv.get<Array<{next:string;reward:number}>>(`world/${state.slice(0,80)}/${action.slice(0,40)}`);
        if (!list || list.length===0) return null;
        const counts = new Map<string,{c:number; r:number}>();
        for (const e of list){ const cur=counts.get(e.next)??{c:0,r:0}; cur.c++; cur.r+=e.reward; counts.set(e.next,cur); }
        let best = ''; let bestC=-1; let bestR=0;
        for (const [k,v] of counts) if (v.c>bestC){ bestC=v.c; best=k; bestR=v.r/v.c; }
        return { next: best, reward: Math.round(bestR*100)/100 };
    }
    async imagine(start: string, actions: string[]){
        const out: Array<{state:string;reward:number}> = [];
        let cur = start;
        for (const a of actions.slice(0,10)) {
            const pred = await this.predict(cur, a);
            if (!pred) break;
            out.push({ state: pred.next, reward: pred.reward });
            cur = pred.next;
        }
        return out;
    }
}
