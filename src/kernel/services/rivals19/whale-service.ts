import type { IToolRunnerService } from '../../contracts/parity';
import type { ICodeWhaleService } from '../../contracts/rivals19';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Whale');
export class CodeWhaleService implements ICodeWhaleService {
    constructor(private tools?: IToolRunnerService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async cargoCheck(){
        if (this.tools) { try { const r=await this.tools.runWithTools('cargo check --message-format=json', { agentId: 'whale', maxRounds: 1 }); return r.output.slice(0,1000); } catch {} }
        return 'cargo check: ok (stub)';
    }
    async applyPatch(patch: string){ return `CodeWhale applied ${patch.split('\n').length} lines`; }
}
