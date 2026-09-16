import type { DataAccessLayer } from '../../dal/types';
import type { IEventBus } from '../../types/interfaces';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('BizPacks');

export class SeoPackService {
    constructor(private dal: DataAccessLayer, _events: IEventBus) {}
    async init(){ LOGGER.info('BizPacks', 'init',{}); } async destroy(){}
    async keywordCluster(seed: string[]){
        const clusters: Record<string,string[]>={};
        for (const kw of seed){ const root=kw.split(' ')[0]?.toLowerCase()??'other'; (clusters[root]??=[]).push(kw); clusters[root]=clusters[root] as string[]; }
        await this.dal.kv.set(`seo-cluster/${Date.now()}`, clusters);
        return clusters;
    }
    async contentBrief(keyword: string){
        return `# Brief: ${keyword}\n- Intent: commercial\n- Outline: intro, benefits, comparison, FAQ\n- Schema: Article + FAQPage\n- Internal links: 3\n- Sources: 2`;
    }
    async interlinkMap(urls: string[]){
        const map: Record<string,string[]>={};
        for (let i=0;i<urls.length;i++){ const u=urls[i] as string; map[u]=urls.filter((_,j)=>j!==i).slice(0,3); }
        return map;
    }
    async driftCheck(url: string){
        const base=await this.dal.kv.get<Record<string,string>>(`siteaudit/${url}`) ?? { noindex:'false', schema:'true', canonical: url };
        return { noindex: base.noindex==='true', schema: base.schema==='true', canonical: base.canonical };
    }
}

export class OutreachPackService {
    constructor(private dal: DataAccessLayer) {}
    async init(){} async destroy(){}
    async discoverLeads(query: string){
        const leads=[`${query} — Acme Corp`, `${query} — Globex`, `${query} — Soylent`];
        for (const l of leads) await this.dal.kv.set(`lead/${genId('lead')}`, { lead: l, query });
        return leads;
    }
    async enrich(lead: string){ return { lead, website: `https://${lead.split(' — ')[1]?.toLowerCase().replace(/\s+/g,'')}.com`, employees: '50-100', tech: 'Next.js' }; }
    async score(lead: string){ const s=lead.length % 10; return Math.min(10, 5 + s % 5); }
    async draftEmail(lead: string, style?: string){
        return `Hi ${lead.split(' — ')[0]}, loved your ${style ?? 'site'} — quick idea to boost SEO by 30%...`;
    }
}

export class FinancePackService {
    constructor(private dal: DataAccessLayer, private events: IEventBus) {}
    async init(){} async destroy(){}
    async recordSpend(agentId: string, amount: number, _note?: string){
        const key=`finance-spend/${agentId}`; const cur=(await this.dal.kv.get<number>(key))??0; await this.dal.kv.set(key, cur+amount);
        const totalKey='finance-total'; const total=(await this.dal.kv.get<number>(totalKey))??1000; await this.dal.kv.set(totalKey, total-amount);
        this.events.emit(EVENTS.OPS_BUDGET, { nodeId: agentId, spent: cur+amount } as never);
    }
    async runway(){
        const total=(await this.dal.kv.get<number>('finance-total'))??1000;
        // burn = avg last spends
        const rows=await this.dal.kv.list('finance-spend/');
        let burn=0; for (const r of rows) burn+= (r.value as number) * 0.1;
        burn = Math.max(1, burn || 10);
        return { balance: total, burn, days: Math.floor(total / burn) };
    }
    async invoice(client: string, amount: number){
        const id=genId('inv'); await this.dal.kv.set(`invoice/${id}`, { id, client, amount, at: Date.now() }); return id;
    }
}

export class SiteAuditService {
    constructor(private dal: DataAccessLayer) {}
    async init(){} async destroy(){}
    async baseline(url: string, checks: string[]){ await this.dal.kv.set(`siteaudit/${url}`, { noindex: 'false', schema: 'true', canonical: url, checks: checks.join(','), at: Date.now() }); }
    async diff(url: string, current: Record<string,string>){
        const base=await this.dal.kv.get<Record<string,string>>(`siteaudit/${url}`); if(!base) return [];
        const out: Array<{check:string;severity:string}>=[];
        for (const k of Object.keys(current)){
            if (base[k]!==current[k]){
                const sev = k==='noindex' ? 'Critical' : k==='schema' ? 'Warning' : 'Info';
                out.push({ check: k, severity: sev });
            }
        }
        return out;
    }
}

export class CalendarService {
    constructor(private dal: DataAccessLayer) {}
    async init(){} async destroy(){}
    async addEvent(title: string, date: string){ const id=genId('cal'); await this.dal.kv.set(`cal/${id}`, { id, title: title.slice(0,80), date }); return id; }
    async upcoming(){ const rows=await this.dal.kv.list('cal/'); return rows.map(r=>{ const v=r.value as Record<string,string>; return { title: v.title as string, date: v.date as string }; }).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,10); }
}
