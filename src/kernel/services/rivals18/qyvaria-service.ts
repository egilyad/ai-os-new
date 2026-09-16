import type { DataAccessLayer } from '../../dal/types';
import type { IQyvariaService } from '../../contracts/rivals18';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Qyvaria');
export class QyvariaService implements IQyvariaService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async addNode(name: string, neighbors: string[] = []){
        await this.dal.kv.set(`qyvaria/${name.slice(0,80)}`, { neighbors: neighbors.slice(0,10).map(n=>n.slice(0,80)), causal: [] as string[] });
    }
    async causal(from: string, to: string){
        const f=await this.dal.kv.get<Record<string,unknown>>(`qyvaria/${from}`) ?? { neighbors: [] as string[], causal: [] as string[] };
        const c=(f as Record<string,unknown>).causal as string[];
        c.push(to.slice(0,80));
        await this.dal.kv.set(`qyvaria/${from}`, f);
    }
    async query(start: string){
        const visited=new Set<string>(); const queue=[start]; const out:string[]=[];
        while(queue.length>0 && out.length<10){
            const cur=queue.shift() as string;
            if(visited.has(cur)) continue;
            visited.add(cur); out.push(cur);
            const node=await this.dal.kv.get<Record<string,unknown>>(`qyvaria/${cur}`);
            const neighs=[...((node as Record<string,unknown>)?.neighbors as string[] ?? []), ...((node as Record<string,unknown>)?.causal as string[] ?? [])];
            for(const n of neighs) if(!visited.has(n)) queue.push(n);
        }
        try{ this.events?.emit(EVENTS.QYVARIA_QUERY, { query: start.slice(0,200) }); }catch{}
        return out;
    }
}
