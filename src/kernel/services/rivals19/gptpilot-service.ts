import type { DataAccessLayer } from '../../dal/types';
import type { IGptPilotService } from '../../contracts/rivals19';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('GptPilot');
export class GptPilotService implements IGptPilotService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async start(spec: string){
        const id=genId('pilot'); const phases=['spec','arch','tasks','code','review'];
        await this.dal.kv.set(`pilot/${id}`, { id, spec: spec.slice(0,500), phase: 0, phases });
        try{ this.events?.emit(EVENTS.GOTPILOT_START, { spec: spec.slice(0,200) }); }catch{}
        return id;
    }
    async status(projectId: string){
        const p=await this.dal.kv.get<Record<string,unknown>>(`pilot/${projectId}`); if(!p) throw new Error('project not found');
        const phase=(p as Record<string,unknown>).phase as number;
        const phases=(p as Record<string,unknown>).phases as string[];
        return `GptPilot ${projectId}: ${phases[phase]} (${phase+1}/${phases.length})`;
    }
}
