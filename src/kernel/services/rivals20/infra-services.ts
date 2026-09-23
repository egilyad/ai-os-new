import type { DataAccessLayer } from '../../dal/types';
import type { IHeliconeService, IPortkeyService, ILiteLlmService, ILangfuseService } from '../../contracts/rivals20';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const L=rootLogger.child('Infra');
export class HeliconeService implements IHeliconeService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ L.info('Infra', 'init',{}); } async destroy(){}
    async log(request: string){ await this.dal.kv.set(`helicone/${Date.now()}`, request.slice(0,500)); try{ this.events?.emit(EVENTS.HELICONE_LOG, { request: request.slice(0,200) }); }catch{} }
    async hits(){ const rows=await this.dal.kv.list('helicone/'); return rows.length; }
}
export class PortkeyService implements IPortkeyService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){} async destroy(){}
    async route(model: string){ const cfg=await this.dal.kv.get<string>(`portkey/${model}`) ?? 'openai'; try{ this.events?.emit(EVENTS.PORTKEY_ROUTE, { model }); }catch{} return cfg; }
}
export class LiteLlmService implements ILiteLlmService {
    constructor(private events?: IEventBus) {}
    async init(){} async destroy(){}
    async proxy(model: string, prompt: string){ const res = `[LiteLLM ${model}] ${prompt.slice(0,100)}`; try{ this.events?.emit(EVENTS.LITELLM_PROXY, { model }); }catch{} return res; }
}
export class LangfuseService implements ILangfuseService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){} async destroy(){}
    async trace(name: string, data: string){ await this.dal.kv.set(`langfuse/${name}/${Date.now()}`, data.slice(0,1000)); try{ this.events?.emit(EVENTS.LANGFUSE_TRACE, { name }); }catch{} }
    async eval(dataset: string){ return 0.85; }
}
