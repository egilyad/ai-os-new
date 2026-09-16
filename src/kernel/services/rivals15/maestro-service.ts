import type { DataAccessLayer } from '../../dal/types';
import type { IEventBus } from '../../types/interfaces';
import type { IMaestroService } from '../../contracts/rivals15';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('Maestro');
export class MaestroService implements IMaestroService {
    constructor(private dal: DataAccessLayer, private events: IEventBus) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async createEcosystem(name: string, roles: string[]){
        const id=genId('maestro'); await this.dal.kv.set(`maestro/${id}`, { id, name: name.slice(0,120), roles: roles.slice(0,12), tasks: [] as string[], createdAt: Date.now() });
        return id;
    }
    async orchestrate(ecoId: string, task: string){
        const eco=await this.dal.kv.get<Record<string,unknown>>(`maestro/${ecoId}`); if(!eco) throw new Error('ecosystem not found');
        const roles=(eco as Record<string,unknown>).roles as string[];
        // мультимодальный роутинг: текст → кто ближе по токенам
        const tokens=new Set(task.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter(Boolean));
        let best=roles[0] as string; let bestScore=-1;
        for (const r of roles){ const rt=new Set(r.toLowerCase().split(/[^a-zа-яё0-9]+/u)); let hit=0; for (const t of rt) if(tokens.has(t)) hit++; if(hit>bestScore){ bestScore=hit; best=r; } }
        const out=`MAESTRO ${ecoId} — task "${task.slice(0,80)}" → ${best} (score ${bestScore})`;
        const tasks=(eco as Record<string,unknown>).tasks as string[]; tasks.push(task.slice(0,200)); await this.dal.kv.set(`maestro/${ecoId}`, eco);
        this.events.emit(EVENTS.MAESTRO_ORCHESTRATE, { ecoId, role: best } as never);
        return out;
    }
}
