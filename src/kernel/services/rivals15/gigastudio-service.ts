import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IGigaStudioService } from '../../contracts/rivals15';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('GigaStudio');
export class GigaStudioService implements IGigaStudioService {
    constructor(private events: IEventBus, private llm?: ILLMClientService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async generate(spec: string){
        let files: string[]=['app/page.tsx','app/layout.tsx','components/Header.tsx'];
        let preview=`GigaStudio Next.js for: ${spec.slice(0,80)}`;
        if (this.llm) {
            try {
                const r=await this.llm.chat([
                    {role:'system',content:'Ты GigaStudio (СберТех). Сгенерируй список файлов Next.js (JSON {"files":["..."]}) для spec.'},
                    {role:'user',content:spec.slice(0,2000)}
                ],{temperature:0.4,maxTokens:400});
                if(!r.error){
                    const m=r.content.match(/\[[\s\S]*\]/);
                    if(m){ const parsed=JSON.parse(m[0]) as string[]; if(parsed.length) files=parsed.slice(0,12); }
                    preview=r.content.slice(0,1500);
                }
            } catch (e){ LOGGER.warn('gigastudio failed',{error:e instanceof Error?e.message:String(e)}); }
        }
        this.events.emit(EVENTS.GIGASTUDIO_GEN, { files: files.length } as never);
        return { files, preview };
    }
}
