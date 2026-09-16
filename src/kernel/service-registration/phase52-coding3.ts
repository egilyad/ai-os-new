import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IEventBus } from '../types/interfaces';
import type { ICodeExecService } from '../contracts/rivals5';
import { CodexService, GeminiCliService, KiloService } from '../services/rivals20/codex-services';
import { InterpreterService, MiniSweService } from '../services/rivals20/interpreter-services';
import { HeliconeService, PortkeyService, LiteLlmService, LangfuseService } from '../services/rivals20/infra-services';
function dalOf(c:IContainer): DataAccessLayer { return c.get<DataAccessLayer>('dal'); }
function llmOf(c:IContainer): ILLMClientService|undefined { return c.has('llmClientService')?c.get<ILLMClientService>('llmClientService'):undefined; }
function eventsOf(c:IContainer): IEventBus { return c.get<IEventBus>('eventBus'); }
export const registerPhase52: Phase = ({ register }) => {
    register('codexService', (c:IContainer)=> new CodexService(dalOf(c), llmOf(c), eventsOf(c)));
    register('geminiCliService', (c:IContainer)=> new GeminiCliService(dalOf(c), llmOf(c), eventsOf(c)));
    register('kiloService', (c:IContainer)=> new KiloService(dalOf(c), llmOf(c), eventsOf(c)));
    register('interpreterService', (c: IContainer) => new InterpreterService(
        c.has('eventBus') ? eventsOf(c) : undefined,
        c.has('dal') ? dalOf(c) : undefined,
        c.has('codeExecService') ? c.get<ICodeExecService>('codeExecService') : undefined,
    ));
    register('miniSweService', (c: IContainer) => new MiniSweService(
        c.has('eventBus') ? eventsOf(c) : undefined,
        c.has('dal') ? dalOf(c) : undefined,
    ));
    register('heliconeService', (c:IContainer)=> new HeliconeService(dalOf(c), eventsOf(c)));
    register('portkeyService', (c:IContainer)=> new PortkeyService(dalOf(c), eventsOf(c)));
    register('liteLlmService', (c:IContainer)=> new LiteLlmService(eventsOf(c)));
    register('langfuseService', (c:IContainer)=> new LangfuseService(dalOf(c), eventsOf(c)));
};
