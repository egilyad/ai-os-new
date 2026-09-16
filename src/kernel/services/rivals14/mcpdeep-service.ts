import type { IEventBus } from '../../types/interfaces';
import type { MCPService } from '../mcp-service';
import type { IMcpDeepService } from '../../contracts/rivals14';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('McpDeep');
export class McpDeepService implements IMcpDeepService {
    constructor(_events: IEventBus, private mcp?: MCPService) {}
    async init(){ LOGGER.info('McpDeep', 'init',{}); } async destroy(){}
    async discover(serverId: string){
        if (!this.mcp) return { tools: [], resources: [] };
        try { const tools=await this.mcp.listTools(serverId); const resources=await this.mcp.listResources(serverId); return { tools: tools.map(t=>t.name), resources: resources.map(r=>r.uri) }; } catch { return { tools: [], resources: [] }; }
    }
    async connectAll(){
        if (!this.mcp) return 0;
        let n=0; for (const s of this.mcp.getServers()) { try { await this.mcp.connect(s.id); n++; } catch {} }
        return n;
    }
}
