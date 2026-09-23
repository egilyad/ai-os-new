import type { DataAccessLayer } from '../../dal/types';
import type { IEventBus } from '../../types/interfaces';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('DustBulk');

export class DataSourceService {
    constructor(private dal: DataAccessLayer, private events: IEventBus) {}
    async init(){         LOGGER.info('DustBulk', 'init',{}); } async destroy(){}
    async addSource(name: string, kind: string){ const id=genId('ds'); await this.dal.kv.set(`datasource/${id}`, { id, name: name.slice(0,80), kind, status: 'idle' }); return id; }
    async sync(sourceId: string){ const s=await this.dal.kv.get<Record<string,unknown>>(`datasource/${sourceId}`); if(!s) throw new Error('source not found'); (s as Record<string,unknown>).status='synced'; (s as Record<string,unknown>).syncedAt=Date.now(); await this.dal.kv.set(`datasource/${sourceId}`, s); this.events.emit(EVENTS.DATASET_HIT, { datasetId: sourceId, fromAnnotation: false } as never); }
    async status(sourceId: string){ const s=await this.dal.kv.get<Record<string,unknown>>(`datasource/${sourceId}`); return (s as Record<string,unknown>)?.status as string ?? 'unknown'; }
    async bindToAssistant(assistantId: string, sourceId: string){ await this.dal.kv.set(`assistant-ds/${assistantId}/${sourceId}`, { boundAt: Date.now() }); }
}

export class BulkService {
    constructor(private dal: DataAccessLayer, private events: IEventBus) {}
    async init(){} async destroy(){}
    async runBulk(csv: string, prompt: string){
        const id=genId('bulk'); const lines=csv.split('\n').filter(Boolean).slice(0,100); await this.dal.kv.set(`bulk/${id}`, { id, lines: lines.length, prompt: prompt.slice(0,200), status: 'queued' });
        // simulate immediate processing: store results as csv with prompt applied note
        const results=lines.map((l,i)=>`${l},result_${i}_${prompt.slice(0,20)}`).join('\n');
        await this.dal.kv.set(`bulk-result/${id}`, results);
        await this.dal.kv.set(`bulk/${id}`, { id, lines: lines.length, prompt: prompt.slice(0,200), status: 'done' });
        this.events.emit(EVENTS.QUEUE_ENQUEUED, { runId: id, kind: 'bulk' } as never);
        return id;
    }
    async result(jobId: string){ const r=await this.dal.kv.get<string>(`bulk-result/${jobId}`); return r ?? ''; }
}

export class ScraperService {
    constructor(private dal: DataAccessLayer) {}
    async init(){} async destroy(){}
    async scrape(url: string, selector: string){
        // business site SEO: in real would fetch + parse; here track as scraper job
        const id=genId('scrape'); await this.dal.kv.set(`scrape/${id}`, { url: url.slice(0,200), selector: selector.slice(0,200), at: Date.now() });
        // return mocked extracted texts (selector names as hints)
        return [`${selector} → text from ${url}`, `${selector} → second hit`];
    }
    async scheduleAutobook(url: string, selector: string, cron: string){
        const id=genId('autobook'); await this.dal.kv.set(`autobook/${id}`, { url, selector, cron, createdAt: Date.now() }); return id;
    }
}

export class RelayService {
    constructor(private dal: DataAccessLayer) {}
    async init(){} async destroy(){}
    async createGate(automationId: string, step: string){
        const id=genId('gate'); await this.dal.kv.set(`relay-gate/${id}`, { id, automationId, step: step.slice(0,120), status: 'pending' }); return id;
    }
    async approve(gateId: string){ const g=await this.dal.kv.get<Record<string,unknown>>(`relay-gate/${gateId}`); if(!g) throw new Error('gate not found'); (g as Record<string,unknown>).status='approved'; await this.dal.kv.set(`relay-gate/${gateId}`, g); }
    async pendingGates(){ const rows=await this.dal.kv.list('relay-gate/'); return rows.filter(r=>(r.value as Record<string,unknown>).status==='pending').map(r=>r.id); }
}
