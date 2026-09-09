import type { DataAccessLayer } from '../../dal/types';
import type { IPiService } from '../../contracts/rivals19';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Pi');
export class PiService implements IPiService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async registerTool(name: string, latencyMs=20){ await this.dal.kv.set(`pi-tool/${name.slice(0,80)}`, { latencyMs, at: Date.now() }); }
    async dispatch(tool: string, args: Record<string,unknown> = {}){
        const meta=await this.dal.kv.get<Record<string,number>>(`pi-tool/${tool}`);
        const latency=meta?.latencyMs ?? 20;
        return `pi:${tool} (${latency}ms) → ${JSON.stringify(args).slice(0,200)}`;
    }
}
