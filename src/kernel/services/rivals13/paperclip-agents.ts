import type { DataAccessLayer } from '../../dal/types';
import type { IEventBus } from '../../types/interfaces';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('PaperclipAgents');

/** Paperclip org-chart + Biz tickets + Lindy playbooks + SmythOS compose + AGEMS meetings/HITL — one file for S.1 (kv only) */
export class OrgChartService {
    constructor(private dal: DataAccessLayer, private events: IEventBus) {}
    async init(){ LOGGER.info('PaperclipAgents', 'init',{}); } async destroy(){}
    async createNode(title: string, parentId?: string, roleId?: string, budget?: number){
        const id = genId('org'); await this.dal.kv.set(`org/${id}`, { id, title: title.slice(0,80), parentId, roleId, budget, approved: false }); this.events.emit(EVENTS.OPS_HIERARCHY, { nodeId: id, action: 'created' } as never); return id;
    }
    async setBudget(nodeId: string, budget: number){ const n=await this.dal.kv.get<Record<string,unknown>>(`org/${nodeId}`); if(!n) throw new Error('node not found'); (n as Record<string,unknown>).budget=budget; await this.dal.kv.set(`org/${nodeId}`, n); }
    async approveHire(nodeId: string){ const n=await this.dal.kv.get<Record<string,unknown>>(`org/${nodeId}`); if(!n) throw new Error('node not found'); (n as Record<string,unknown>).approved=true; await this.dal.kv.set(`org/${nodeId}`, n); this.events.emit(EVENTS.OPS_HIERARCHY, { nodeId, action: 'approved' } as never); }
    async tree(){ const rows=await this.dal.kv.list('org/'); return rows.map(r=>r.value as {id:string;title:string;parentId?:string;budget?:number}); }
}

export class BizTicketService {
    constructor(private dal: DataAccessLayer, private events: IEventBus) {}
    async init(){} async destroy(){}
    async createFromGoal(goal: string){
        const parts=goal.split(/[.!?]\s+/).filter(Boolean).slice(0,5);
        const tickets: Array<{id:string;title:string;status:string}>=[];
        for (const p of parts.length?parts:[goal]){ const id=genId('ticket'); const t={id, title:p.slice(0,80), status:'open'}; await this.dal.kv.set(`bizticket/${id}`, t); tickets.push(t); }
        this.events.emit(EVENTS.SUPPORT_OPEN, { ticketId: tickets[0]?.id ?? '' } as never);
        return tickets;
    }
    async listTickets(){ const rows=await this.dal.kv.list('bizticket/'); return rows.map(r=>r.value as {id:string;title:string;status:string}); }
    async completeTicket(id: string){ const t=await this.dal.kv.get<Record<string,unknown>>(`bizticket/${id}`); if(!t) throw new Error('ticket not found'); (t as Record<string,unknown>).status='done'; await this.dal.kv.set(`bizticket/${id}`, t); }
}

export class MeetingService {
    constructor(private dal: DataAccessLayer, _events: IEventBus) { void _events; }
    async init(){} async destroy(){}
    async startMeeting(topic: string, agenda: string[]){
        const id=genId('meet'); await this.dal.kv.set(`meeting/${id}`, { id, topic: topic.slice(0,120), agenda: agenda.slice(0,10), votes: {} as Record<string,string>, createdAt: Date.now() }); return id;
    }
    async vote(meetingId: string, voterId: string, choice: string){ const m=await this.dal.kv.get<Record<string,unknown>>(`meeting/${meetingId}`); if(!m) throw new Error('meeting not found'); const votes=(m as Record<string,unknown>).votes as Record<string,string>; votes[voterId]=choice; await this.dal.kv.set(`meeting/${meetingId}`, m); }
    async minutes(meetingId: string){ const m=await this.dal.kv.get<Record<string,unknown>>(`meeting/${meetingId}`); if(!m) throw new Error('meeting not found'); const votes=(m as Record<string,unknown>).votes as Record<string,string>; const counts:Record<string,number>={}; for(const v of Object.values(votes)) counts[v]=(counts[v]??0)+1; const winner=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]??'no votes'; return `Meeting ${(m as Record<string,unknown>).topic} — decision: ${winner} (${JSON.stringify(counts)})`; }
}

export class HITLLevelsService {
    constructor(private dal: DataAccessLayer) {}
    async init(){} async destroy(){}
    async setLevel(tool: string, level: 'autopilot'|'supervised'|'manual'){ await this.dal.kv.set(`hitl/${tool}`, level); }
    async getLevel(tool: string){ return (await this.dal.kv.get<string>(`hitl/${tool}`)) ?? 'autopilot'; }
    async shouldBlock(tool: string){ const l=await this.getLevel(tool); return l==='manual'; }
}

export class PlaybookService {
    constructor(private dal: DataAccessLayer, private events: IEventBus) {}
    async init(){} async destroy(){}
    async publish(name: string, trigger: string, steps: string[]){ const id=genId('playbook'); await this.dal.kv.set(`playbook/${id}`, { id, name: name.slice(0,80), trigger: trigger.slice(0,120), steps: steps.slice(0,20) }); this.events.emit(EVENTS.INTEGRATION_TRIGGER, { app: 'playbook', trigger, triggerId: id } as never); return id; }
    async list(){ const rows=await this.dal.kv.list('playbook/'); return rows.map(r=>{ const v=r.value as Record<string,unknown>; return { id: v.id as string, name: v.name as string, trigger: v.trigger as string }; }); }
}

export class ComposeService {
    constructor(private dal: DataAccessLayer) {}
    async init(){} async destroy(){}
    async composeAgent(name: string, skillIds: string[]){
        const id=genId('composed'); await this.dal.kv.set(`composed/${id}`, { id, name: name.slice(0,80), skillIds: skillIds.slice(0,20), version: '1.0.0' }); return id;
    }
}
