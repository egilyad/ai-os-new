import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { ISmallvilleService } from '../../contracts/rivals12';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Smallville');
interface Mem { text: string; importance: number; at: number; }
export class SmallvilleService implements ISmallvilleService {
    constructor(private dal: DataAccessLayer, private llm?: ILLMClientService) {}
    async init(){ LOGGER.info('Smallville', 'init',{}); } async destroy(){}
    async observe(agentId: string, text: string, importance = 0.5){
        const key = `smallville/${agentId.slice(0,80)}`;
        const list = (await this.dal.kv.get<Mem[]>(key)) ?? [];
        list.push({ text: text.slice(0,500), importance: Math.max(0,Math.min(1,importance)), at: Date.now() });
        if (list.length>200) list.splice(0, list.length-200);
        await this.dal.kv.set(key, list);
    }
    async stream(agentId: string){ return (await this.dal.kv.get<Mem[]>(`smallville/${agentId.slice(0,80)}`)) ?? []; }
    async reflect(agentId: string){
        const mems = await this.stream(agentId);
        if (mems.length===0) return [];
        const recent = mems.slice(-20).map(m=>m.text).join('\n');
        if (this.llm) {
            try {
                const res = await this.llm.chat([
                    { role: 'system', content: 'Distill 3 insights from these memories, one per line "- ".' },
                    { role: 'user', content: recent.slice(0,3000) }
                ], { temperature: 0.5, maxTokens: 400 });
                if (!res.error) {
                    const insights = res.content.split('\n').map(l=>l.replace(/^-\s*/,'').trim()).filter(Boolean).slice(0,3);
                    for (const ins of insights) await this.observe(agentId, `insight: ${ins}`, 0.9);
                    return insights;
                }
            } catch (e){ LOGGER.warn('Smallville', 'reflect failed',{error:e instanceof Error?e.message:String(e)}); }
        }
        const ins = `reflection on ${mems.length} memories at ${new Date().toISOString()}`;
        await this.observe(agentId, `insight: ${ins}`, 0.9);
        return [ins];
    }
    async planDay(agentId: string, date: string){
        const mems = await this.stream(agentId);
        const recent = mems.slice(-10).map(m=>m.text).join('; ').slice(0,800);
        if (this.llm) {
            try {
                const res = await this.llm.chat([
                    { role: 'system', content: `Plan ${agentId}'s day ${date}: 4 blocks, one per line "- HH:MM activity".` },
                    { role: 'user', content: recent || 'no prior memories' }
                ], { temperature: 0.5, maxTokens: 400 });
                if (!res.error) return res.content.split('\n').map(l=>l.replace(/^-\s*/,'').trim()).filter(Boolean).slice(0,6);
            } catch {}
        }
        return [`08:00 observe ${date}`, '12:00 reflect', '16:00 plan', '20:00 rest'];
    }
}
