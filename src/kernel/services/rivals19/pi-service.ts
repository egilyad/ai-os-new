import type { DataAccessLayer } from '../../dal/types';
import type { IPiService } from '../../contracts/rivals19';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Pi');
export class PiService implements IPiService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async registerTool(name: string, latencyMs=20){ await this.dal.kv.set(`pi-tool/${name.slice(0,80)}`, { latencyMs, at: Date.now() }); }
    async dispatch(tool: string, args: Record<string,unknown> = {}){
        const meta=await this.dal.kv.get<Record<string,number>>(`pi-tool/${tool}`);
        const latency=meta?.latencyMs ?? 20;
        const res = `pi:${tool} (${latency}ms) → ${JSON.stringify(args).slice(0,200)}`;
        try{ this.events?.emit(EVENTS.PI_DISPATCH, { tool: tool.slice(0,80) }); }catch{}
        return res;
    }
}
