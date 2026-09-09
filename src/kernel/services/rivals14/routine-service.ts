import type { DataAccessLayer } from '../../dal/types';
import type { IRoutineService } from '../../contracts/rivals14';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Routine');
export class RoutineService implements IRoutineService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async define(name: string, trigger: { kind: 'schedule'|'api'|'event'; spec: string }, workflow: string[]){
        const id=genId('routine'); await this.dal.kv.set(`routines/${id}`, { id, name: name.slice(0,80), trigger, workflow: workflow.slice(0,20) });
        return id;
    }
    async trigger(routineId: string, payload=''){
        const r=await this.dal.kv.get<Record<string,unknown>>(`routines/${routineId}`); if(!r) throw new Error('routine not found');
        return `triggered ${(r as Record<string,string>).name}: ${payload.slice(0,100)} → ${(r as Record<string,unknown>).workflow as string[]}${''}`;
    }
}
