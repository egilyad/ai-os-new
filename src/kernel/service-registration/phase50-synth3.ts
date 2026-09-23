import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DataAccessLayer } from '../dal/types';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import { MetaKbService } from '../services/rivals18/metakb-service';
import { ResearchOsService } from '../services/rivals18/researchos-service';
import { DeepResearch2Service } from '../services/rivals18/deepresearch2-service';
import { DarwinService } from '../services/rivals18/darwin-service';
import { QyvariaService } from '../services/rivals18/qyvaria-service';
import { ParliamentaryService } from '../services/rivals18/parliamentary-service';
import { PolicyDebateService } from '../services/rivals18/policy-service';
import { SocraticService } from '../services/rivals18/socratic-service';
import { FishbowlService } from '../services/rivals18/fishbowl-service';
import { DelphiService } from '../services/rivals18/delphi-service';
function dalOf(c: IContainer): DataAccessLayer { return c.get<DataAccessLayer>('dal'); }
function eventsOf(c: IContainer): IEventBus { return c.get<IEventBus>('eventBus'); }
function llmOf(c: IContainer): ILLMClientService | undefined { return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined; }
export const registerPhase50: Phase = ({ register }) => {
    register('metaKbService', (c: IContainer) => new MetaKbService(dalOf(c), eventsOf(c)));
    register('researchOsService', (c: IContainer) => new ResearchOsService(dalOf(c), eventsOf(c)));
    register('deepResearch2Service', (c: IContainer) => new DeepResearch2Service(dalOf(c), llmOf(c), eventsOf(c)));
    register('darwinService', (c: IContainer) => new DarwinService(dalOf(c), eventsOf(c)));
    register('qyvariaService', (c: IContainer) => new QyvariaService(dalOf(c), eventsOf(c)));
    register('parliamentaryService', (c: IContainer) => new ParliamentaryService(dalOf(c), eventsOf(c)));
    register('policyDebateService', (c: IContainer) => new PolicyDebateService(eventsOf(c)));
    register('socraticService2', (c: IContainer) => new SocraticService(dalOf(c), eventsOf(c)));
    register('fishbowlService', (c: IContainer) => new FishbowlService(dalOf(c), eventsOf(c)));
    register('delphiService', () => new DelphiService());
};
