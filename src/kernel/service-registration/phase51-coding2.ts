import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IToolRunnerService } from '../contracts/parity';
import type { IEventBus } from '../types/interfaces';
import { PiService } from '../services/rivals19/pi-service';
import { ZedService } from '../services/rivals19/zed-service';
import { WarpService } from '../services/rivals19/warp-service';
import { GptEngineerService } from '../services/rivals19/gptengineer-service';
import { GooseService } from '../services/rivals19/goose-service';
import { ContinueService } from '../services/rivals19/continue-service';
import { TabbyService } from '../services/rivals19/tabby-service';
import { GptPilotService } from '../services/rivals19/gptpilot-service';
import { VoidService } from '../services/rivals19/void-service';
import { CrushService } from '../services/rivals19/crush-service';
import { CodeWhaleService } from '../services/rivals19/whale-service';
function dalOf(c: IContainer): DataAccessLayer { return c.get<DataAccessLayer>('dal'); }
function llmOf(c: IContainer): ILLMClientService | undefined { return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined; }
export const registerPhase51: Phase = ({ register }) => {
    register('piService', (c: IContainer) => new PiService(dalOf(c), c.get<IEventBus>('eventBus')));
    register('zedService', (c: IContainer) => new ZedService(dalOf(c), llmOf(c), c.get<IEventBus>('eventBus')));
    register('warpService', (c: IContainer) => new WarpService(dalOf(c), llmOf(c), c.get<IEventBus>('eventBus')));
    register('gptEngineerService', (c: IContainer) => new GptEngineerService(llmOf(c), c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined, c.get<IEventBus>('eventBus')));
    register('gooseService', (c: IContainer) => new GooseService(dalOf(c), c.get<IEventBus>('eventBus')));
    register('continueService', (c: IContainer) => new ContinueService(llmOf(c), c.get<IEventBus>('eventBus')));
    register('tabbyService', (c: IContainer) => new TabbyService(dalOf(c), c.get<IEventBus>('eventBus')));
    register('gptPilotService', (c: IContainer) => new GptPilotService(dalOf(c), c.get<IEventBus>('eventBus')));
    register('voidService', (c: IContainer) => new VoidService(dalOf(c), llmOf(c), c.get<IEventBus>('eventBus')));
    register('crushService', () => new CrushService());
    register('codeWhaleService', (c: IContainer) => new CodeWhaleService(
        c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined,
        c.has('eventBus') ? c.get<IEventBus>('eventBus') : undefined,
        c.has('dal') ? dalOf(c) : undefined,
    ));
};
