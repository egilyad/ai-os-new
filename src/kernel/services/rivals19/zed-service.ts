import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IZedService } from '../../contracts/rivals19';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Zed');
export class ZedService implements IZedService {
    constructor(private dal: DataAccessLayer, private llm?: ILLMClientService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async openBuffer(path: string, content=''){ const id=genId('zedbuf'); await this.dal.kv.set(`zed/${id}`, { path: path.slice(0,200), content: content.slice(0,5000) }); return id; }
    async editInline(bufferId: string, instruction: string){
        const buf=await this.dal.kv.get<Record<string,string>>(`zed/${bufferId}`); if(!buf) throw new Error('buffer not found');
        if (this.llm) {
            try { const r=await this.llm.chat([{role:'system',content:'Apply inline edit. Return file content only.'},{role:'user',content:`File:\n${(buf as Record<string,string>).content.slice(0,3000)}\nInstruction: ${instruction.slice(0,500)}`}],{temperature:0.2,maxTokens:800}); if(!r.error){ await this.dal.kv.set(`zed/${bufferId}`, { ...buf, content: r.content.slice(0,5000) }); return r.content.slice(0,2000); } } catch {}
        }
        return `inline edit: ${instruction.slice(0,100)} → ${(buf as Record<string,string>).path}`;
    }
}
