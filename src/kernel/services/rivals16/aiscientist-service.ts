import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IAiScientistService } from '../../contracts/rivals16';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('AiScientist');
export class AiScientistService implements IAiScientistService {
    constructor(private dal: DataAccessLayer, private llm?: ILLMClientService, private tools?: IToolRunnerService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async queueIdea(idea: string){ const id=genId('idea'); await this.dal.kv.set(`ai-sci/${id}`, { id, idea: idea.slice(0,500), status: 'queued' }); return id; }
    async runNext(){
        const rows=await this.dal.kv.list('ai-sci/');
        const queued=rows.map(r=>r.value as Record<string,string>).find(r=>r.status==='queued');
        if(!queued) throw new Error('no queued ideas');
        let code='print("experiment")';
        if (this.llm) { try { const r=await this.llm.chat([{role:'system',content:'Write Python experiment for the idea, code block only.'},{role:'user',content:queued.idea}],{temperature:0.4,maxTokens:800}); if(!r.error) code=r.content; } catch {} }
        let paper=`# Paper: ${queued.idea.slice(0,80)}\n\nExperiment:\n\`\`\`python\n${code.slice(0,2000)}\n\`\`\`\n\nResult: simulated\n`;
        if (this.tools) { try { const res=await this.tools.runWithTools(`Write LaTeX abstract for: ${queued.idea}`,{agentId:'ai-scientist',maxRounds:1}); paper+=`\nAbstract: ${res.output.slice(0,500)}`; } catch {} }
        const score=Math.round((Math.random()*0.3+0.6)*100)/100;
        queued.status='done';
        await this.dal.kv.set(`ai-sci/${queued.id}`, queued);
        await this.dal.kv.set(`ai-sci-paper/${queued.id}`, { paper: paper.slice(0,5000), score });
        return { paper: paper.slice(0,5000), score };
    }
}
