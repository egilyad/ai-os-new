import type { DataAccessLayer } from '../../dal/types';
import type { IConceptsService } from '../../contracts/rivals17';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Concepts');
function hv(s:string,dim=64){ const v=new Array(dim).fill(0); let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;} for(let i=0;i<dim;i++) v[i]= ((h>>>(i%8))&1)?1:-1; return v; }
export class ConceptsService implements IConceptsService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('Concepts', 'init',{}); } async destroy(){}
    async define(name: string, vector?: number[]){ const v=vector ?? hv(name); await this.dal.kv.set(`concepts/${name.slice(0,80)}`, v.slice(0,64)); }
    async compose(a: string, b: string){
          const va=await this.dal.kv.get<number[]>(`concepts/${a}`) ?? hv(a);
          const vb=await this.dal.kv.get<number[]>(`concepts/${b}`) ?? hv(b);
          const vc=va.map((x,i)=> (x+(vb[i]??0))/2);
          const name=`${a}A-${b}`;
          await this.dal.kv.set(`concepts/${name}`, vc);
          try{ this.events?.emit(EVENTS.CONCEPTS_COMPOSE, { count: 2 }); }catch{}
          return name;
    }
}
