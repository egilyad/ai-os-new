import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';
import { CodexService, GeminiCliService, KiloService } from '../services/rivals20/codex-services';
import { InterpreterService, MiniSweService } from '../services/rivals20/interpreter-services';
import { HeliconeService, PortkeyService, LiteLlmService, LangfuseService } from '../services/rivals20/infra-services';
function dalOf(c:IContainer): DataAccessLayer { return c.get<DataAccessLayer>('dal'); }
function llmOf(c:IContainer): ILLMClientService|undefined { return c.has('llmClientService')?c.get<ILLMClientService>('llmClientService'):undefined; }
export const registerPhase52: Phase = ({ register }) => {
    register('codexService', (c:IContainer)=> new CodexService(dalOf(c), llmOf(c)));
    register('geminiCliService', (c:IContainer)=> new GeminiCliService(dalOf(c), llmOf(c)));
    register('kiloService', (c:IContainer)=> new KiloService(dalOf(c), llmOf(c)));
    register('interpreterService', ()=> new InterpreterService());
    register('miniSweService', ()=> new MiniSweService());
    register('heliconeService', (c:IContainer)=> new HeliconeService(dalOf(c)));
    register('portkeyService', (c:IContainer)=> new PortkeyService(dalOf(c)));
    register('liteLlmService', ()=> new LiteLlmService());
    register('langfuseService', (c:IContainer)=> new LangfuseService(dalOf(c)));
};
