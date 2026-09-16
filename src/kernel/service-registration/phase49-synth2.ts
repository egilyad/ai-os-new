import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DataAccessLayer } from '../dal/types';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IToolRunnerService } from '../contracts/parity';
import { RckService } from '../services/rivals17/rck-service';
import { CogneeService } from '../services/rivals17/cognee-service';
import { MetanService } from '../services/rivals17/metan-service';
import { ConceptsService } from '../services/rivals17/concepts-service';
import { SecondBrainService } from '../services/rivals17/secondbrain-service';
import { StormService } from '../services/rivals17/storm-service';
import { BlackboardService } from '../services/rivals17/blackboard-service';
import { MetaControllerService } from '../services/rivals17/metacontroller-service';
import { DoloresService } from '../services/rivals17/dolores-service';
import { EpistemeService } from '../services/rivals17/episteme-service';
function llmOf(c: IContainer): ILLMClientService | undefined { return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined; }
function dalOf(c: IContainer): DataAccessLayer { return c.get<DataAccessLayer>('dal'); }
function eventsOf(c: IContainer): IEventBus { return c.get<IEventBus>('eventBus'); }
export const registerPhase49: Phase = ({ register }) => {
    register('rckService', (c: IContainer) => new RckService(dalOf(c), eventsOf(c)));
    register('cogneeService', (c: IContainer) => new CogneeService(dalOf(c), llmOf(c), eventsOf(c)));
    register('metanService', (c: IContainer) => new MetanService(dalOf(c), eventsOf(c)));
    register('conceptsService', (c: IContainer) => new ConceptsService(dalOf(c), eventsOf(c)));
    register('secondBrainService', (c: IContainer) => new SecondBrainService(dalOf(c), eventsOf(c)));
    register('stormService2', (c: IContainer) => new StormService(dalOf(c), llmOf(c), c.has('knowledgeService') ? c.get<import('../contracts/parity').IKnowledgeService>('knowledgeService') : undefined, eventsOf(c)));
    register('blackboardService2', (c: IContainer) => new BlackboardService(dalOf(c), eventsOf(c)));
    register('metaControllerService2', (c: IContainer) => new MetaControllerService(eventsOf(c)));
    register('doloresService2', (c: IContainer) => new DoloresService(dalOf(c), eventsOf(c)));
    register('epistemeService2', (c: IContainer) => new EpistemeService(dalOf(c), eventsOf(c)));
};
