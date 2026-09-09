import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IAlphaCodeService } from '../../contracts/rivals12';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('AlphaCode');
export class AlphaCodeService implements IAlphaCodeService {
    constructor(private llm?: ILLMClientService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async generate(task: string, samples = 5){
        const n = Math.max(1, Math.min(10, samples));
        let candidates: string[] = [];
        if (this.llm) {
            const results = await Promise.all(Array.from({length:n}, async () => {
                try {
                    const res = await this.llm!.chat([
                        { role: 'system', content: 'Write code solution. Reply with code block only.' },
                        { role: 'user', content: task.slice(0,3000) }
                    ], { temperature: 0.8, maxTokens: 1000 });
                    return res.error ? '' : res.content;
                } catch { return ''; }
            }));
            candidates = results.filter(Boolean);
        }
        if (candidates.length===0) candidates = Array.from({length:n}, (_,i)=>`// sample ${i+1} for ${task.slice(0,40)}`);
        // cluster by hash of normalized output
        const buckets = new Map<string,string[]>();
        for (const c of candidates) {
            const h = c.replace(/\s+/g,' ').slice(0,80);
            const b = buckets.get(h) ?? []; b.push(c); buckets.set(h,b);
        }
        let best = candidates[0] as string;
        let bestSize = 0;
        for (const b of buckets.values()) if (b.length>bestSize){ bestSize=b.length; best=b[0] as string; }
        return { candidates, best };
    }
}
