import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IConstitutionalService } from '../../contracts/rivals12';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('Constitutional');
export class ConstitutionalService implements IConstitutionalService {
    constructor(private dal: DataAccessLayer, private events: IEventBus, private llm?: ILLMClientService) {}
    async init(){ LOGGER.info('Constitutional', 'init',{}); } async destroy(){}
    async setConstitution(rules: string[]){ await this.dal.kv.set('constitution/rules', rules.map(r=>r.slice(0,300)).slice(0,20)); }
    async critique(text: string){
        const rules = (await this.dal.kv.get<string[]>('constitution/rules')) ?? [];
        if (rules.length===0) return { violations: [], ok: true };
        if (this.llm) {
            try {
                const res = await this.llm.chat([
                    { role: 'system', content: `Constitution:\n${rules.map((r,i)=>`${i+1}. ${r}`).join('\n')}\nList violated rule numbers, one per line "N: reason" or "OK".` },
                    { role: 'user', content: text.slice(0,4000) }
                ], { temperature: 0.1, maxTokens: 400 });
                if (!res.error) {
                    if (/^\s*ok\b/i.test(res.content.trim())) return { violations: [], ok: true };
                    const vs = res.content.split('\n').map(l=>l.trim()).filter(Boolean).slice(0,5);
                    this.events.emit(EVENTS.CONSTIT_CRITIQUE, { violations: vs.length });
                    return { violations: vs, ok: vs.length===0 };
                }
            } catch (e){ LOGGER.warn('Constitutional', 'critique failed',{error:e instanceof Error?e.message:String(e)}); }
        }
        const vs: string[] = [];
        const low = text.toLowerCase();
        for (let i=0;i<rules.length;i++) { const r=rules[i] as string; const key=r.split(' ')[0]?.toLowerCase()??''; if (key && low.includes('violat') && low.includes(key.slice(0,4))) vs.push(`${i+1}: ${r.slice(0,80)}`); }
        return { violations: vs, ok: vs.length===0 };
    }
    async revise(text: string){
        const { violations } = await this.critique(text);
        if (violations.length===0) return text;
        if (this.llm) {
            try {
                const res = await this.llm.chat([
                    { role: 'system', content: `Rewrite to fix violations:\n${violations.join('\n')}\nKeep meaning, be concise.` },
                    { role: 'user', content: text.slice(0,4000) }
                ], { temperature: 0.3, maxTokens: 800 });
                if (!res.error) { this.events.emit(EVENTS.CONSTIT_REVISE, { ok: true }); return res.content; }
            } catch {}
        }
        return `${text}\n[revised to address: ${violations.join('; ').slice(0,200)}]`;
    }
}
