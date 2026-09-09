import type { DataAccessLayer } from '../../dal/types';
import type { IHeliconeService, IPortkeyService, ILiteLlmService, ILangfuseService } from '../../contracts/rivals20';
import { rootLogger } from '../logger-service';
const L=rootLogger.child('Infra');
export class HeliconeService implements IHeliconeService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ L.info('init',{}); } async destroy(){}
    async log(request: string){ await this.dal.kv.set(`helicone/${Date.now()}`, request.slice(0,500)); }
    async hits(){ const rows=await this.dal.kv.list('helicone/'); return rows.length; }
}
export class PortkeyService implements IPortkeyService {
    constructor(private dal: DataAccessLayer) {}
    async init(){} async destroy(){}
    async route(model: string){ const cfg=await this.dal.kv.get<string>(`portkey/${model}`) ?? 'openai'; return cfg; }
}
export class LiteLlmService implements ILiteLlmService {
    async init(){} async destroy(){}
    async proxy(model: string, prompt: string){ return `[LiteLLM ${model}] ${prompt.slice(0,100)}`; }
}
export class LangfuseService implements ILangfuseService {
    constructor(private dal: DataAccessLayer) {}
    async init(){} async destroy(){}
    async trace(name: string, data: string){ await this.dal.kv.set(`langfuse/${name}/${Date.now()}`, data.slice(0,1000)); }
    async eval(dataset: string){ return 0.85; }
}
