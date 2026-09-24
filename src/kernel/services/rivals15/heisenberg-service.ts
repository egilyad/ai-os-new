import type { DataAccessLayer } from '../../dal/types';
import type { IHeisenbergService } from '../../contracts/rivals15';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Heisenberg');
export class HeisenbergService implements IHeisenbergService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('Heisenberg', 'init',{}); } async destroy(){}
    async board(){
        const rows=await this.dal.kv.list('heisenberg/');
        const res = rows.map(r=>{ const v=r.value as Record<string,string>; return { id: r.id, title: v.title as string, status: v.status as string }; }).slice(0,50);
        try{ this.events?.emit(EVENTS.HEISENBERG_BOARD, { count: res.length }); }catch{ /* best-effort */ }
        return res;
    }
    async move(cardId: string, status: 'todo'|'doing'|'done'){
        const card=await this.dal.kv.get<Record<string,unknown>>(`heisenberg/${cardId}`) ?? await this.dal.kv.get<Record<string,unknown>>(cardId);
        const key=card?`heisenberg/${cardId}`:cardId;
        const found=await this.dal.kv.get<Record<string,unknown>>(key);
        if(!found) throw new Error('card not found');
        (found as Record<string,unknown>).status=status;
        await this.dal.kv.set(key, found);
        try{ this.events?.emit(EVENTS.HEISENBERG_MOVE, { cardId, status }); }catch{ /* best-effort */ }
        // auto-seed 8 roles on first board access
        if ((await this.dal.kv.list('heisenberg/')).length===0){
            for (const title of ['Backlog','Research','Design','Build','Review','QA','Deploy','Retro']){
                const id=genId('hb'); await this.dal.kv.set(`heisenberg/${id}`, { id, title, status: 'todo' });
            }
        }
    }
    // helper to seed Heisenberg 8
    async seedBoard(){
        for (const title of ['PM','Architect','Frontend','Backend','QA','DevOps','Design','Analyst']){
            const id=genId('hb'); await this.dal.kv.set(`heisenberg/${id}`, { id, title, status: 'todo' });
        }
        return this.board();
    }
}
