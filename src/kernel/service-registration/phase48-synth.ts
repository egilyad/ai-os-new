import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DataAccessLayer } from '../dal/types';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IToolRunnerService } from '../contracts/parity';
import { SciAgentsService } from '../services/rivals16/sciagents-service';
import { SparksService } from '../services/rivals16/sparks-service';
import { AiScientistService } from '../services/rivals16/aiscientist-service';
import { LatentService } from '../services/rivals16/latent-service';
import { EightStageService } from '../services/rivals16/eightstage-service';
import { CognitaeService } from '../services/rivals16/cognitae-service';
import { CogTeamService } from '../services/rivals16/cogteam-service';
import { SynService } from '../services/rivals16/syn-service';
import { HelixService } from '../services/rivals16/helix-service';
import { IdeatorService } from '../services/rivals16/ideator-service';
function llmOf(c: IContainer): ILLMClientService | undefined { return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined; }
function dalOf(c: IContainer): DataAccessLayer { return c.get<DataAccessLayer>('dal'); }
function eventsOf(c: IContainer): IEventBus { return c.get<IEventBus>('eventBus'); }
export const registerPhase48: Phase = ({ register }) => {
    register('sciAgentsService', (c: IContainer) => new SciAgentsService(dalOf(c), eventsOf(c)));
    register('sparksService', (c: IContainer) => new SparksService(dalOf(c), llmOf(c), eventsOf(c)));
    register('aiScientistService', (c: IContainer) => new AiScientistService(dalOf(c), llmOf(c), c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined, eventsOf(c)));
    register('latentService', (c: IContainer) => new LatentService(dalOf(c), eventsOf(c), llmOf(c)));
    register('eightStageService', (c: IContainer) => new EightStageService(dalOf(c), eventsOf(c)));
    register('cognitaeService', (c: IContainer) => new CognitaeService(dalOf(c), llmOf(c), eventsOf(c)));
    register('cogTeamService', (c: IContainer) => new CogTeamService(dalOf(c), llmOf(c), eventsOf(c)));
    register('synService', (c: IContainer) => new SynService(dalOf(c), eventsOf(c)));
    register('helixService', (c: IContainer) => new HelixService(dalOf(c), eventsOf(c)));
    register('ideatorService2', (c: IContainer) => new IdeatorService(dalOf(c), llmOf(c), eventsOf(c)));
};
