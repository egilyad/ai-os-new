import type { ILifecycle } from './lifecycle';

/** S.1 — Paperclip zero-human OS: org chart with budgets */
export interface IOrgChartService extends ILifecycle {
    createNode(title: string, parentId?: string, roleId?: string, budget?: number): Promise<string>;
    setBudget(nodeId: string, budget: number): Promise<void>;
    approveHire(nodeId: string): Promise<void>;
    tree(): Promise<Array<{ id: string; title: string; parentId?: string; budget?: number }>>;
}

/** S.1 — Paperclip tickets: goal → tracked tickets */
export interface IBizTicketService extends ILifecycle {
    createFromGoal(goal: string): Promise<Array<{ id: string; title: string; status: string }>>;
    listTickets(): Promise<Array<{ id: string; title: string; status: string }>>;
    completeTicket(id: string): Promise<void>;
}

/** S.1 — AGEMS meetings + HITL levels */
export interface IMeetingService extends ILifecycle {
    startMeeting(topic: string, agenda: string[]): Promise<string>;
    vote(meetingId: string, voterId: string, choice: string): Promise<void>;
    minutes(meetingId: string): Promise<string>;
}
export interface IHITLLevelsService extends ILifecycle {
    setLevel(tool: string, level: 'autopilot'|'supervised'|'manual'): Promise<void>;
    getLevel(tool: string): Promise<string>;
    shouldBlock(tool: string): Promise<boolean>;
}

/** S.1 — Lindy playbooks */
export interface IPlaybookService extends ILifecycle {
    publish(name: string, trigger: string, steps: string[]): Promise<string>;
    list(): Promise<Array<{ id: string; name: string; trigger: string }>>;
}

/** S.1 — SmythOS compose */
export interface IComposeService extends ILifecycle {
    composeAgent(name: string, skillIds: string[]): Promise<string>;
}

/** S.2 — Dust data sources */
export interface IDataSourceService extends ILifecycle {
    addSource(name: string, kind: string): Promise<string>;
    sync(sourceId: string): Promise<void>;
    status(sourceId: string): Promise<string>;
    bindToAssistant(assistantId: string, sourceId: string): Promise<void>;
}

/** S.2 — Relevance bulk */
export interface IBulkService extends ILifecycle {
    runBulk(csv: string, prompt: string): Promise<string>;
    result(jobId: string): Promise<string>;
}

/** S.2 — Bardeen scraper */
export interface IScraperService extends ILifecycle {
    scrape(url: string, selector: string): Promise<string[]>;
    scheduleAutobook(url: string, selector: string, cron: string): Promise<string>;
}

/** S.2 — Relay human gates */
export interface IRelayService extends ILifecycle {
    createGate(automationId: string, step: string): Promise<string>;
    approve(gateId: string): Promise<void>;
    pendingGates(): Promise<string[]>;
}

/** S.3 — Business packs: SEO / Outreach / Finance / SiteAudit / Calendar */
export interface ISeoPackService extends ILifecycle {
    keywordCluster(seed: string[]): Promise<Record<string,string[]>>;
    contentBrief(keyword: string): Promise<string>;
    interlinkMap(urls: string[]): Promise<Record<string,string[]>>;
    driftCheck(url: string): Promise<{ noindex: boolean; schema: boolean; canonical: string }>;
}
export interface IOutreachPackService extends ILifecycle {
    discoverLeads(query: string): Promise<string[]>;
    enrich(lead: string): Promise<Record<string,string>>;
    score(lead: string): Promise<number>;
    draftEmail(lead: string, style?: string): Promise<string>;
}
export interface IFinancePackService extends ILifecycle {
    recordSpend(agentId: string, amount: number, note?: string): Promise<void>;
    runway(): Promise<{ balance: number; burn: number; days: number }>;
    invoice(client: string, amount: number): Promise<string>;
}
export interface ISiteAuditService extends ILifecycle {
    baseline(url: string, checks: string[]): Promise<void>;
    diff(url: string, current: Record<string,string>): Promise<Array<{ check: string; severity: string }>>;
}
export interface ICalendarService extends ILifecycle {
    addEvent(title: string, date: string): Promise<string>;
    upcoming(): Promise<Array<{ title: string; date: string }>>;
}
