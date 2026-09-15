import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DataAccessLayer } from '../dal/types';
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
function llmOf(c: IContainer): ILLMClientService | undefined { return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined; }
export const registerPhase50: Phase = ({ register }) => {
    register('metaKbService', (c: IContainer) => new MetaKbService(dalOf(c)));
    register('researchOsService', (c: IContainer) => new ResearchOsService(dalOf(c)));
    register('deepResearch2Service', (c: IContainer) => new DeepResearch2Service(dalOf(c), llmOf(c)));
    register('darwinService', (c: IContainer) => new DarwinService(dalOf(c)));
    register('qyvariaService', (c: IContainer) => new QyvariaService(dalOf(c)));
    register('parliamentaryService', (c: IContainer) => new ParliamentaryService(dalOf(c)));
    register('policyDebateService', (_c: IContainer) => new PolicyDebateService());
    register('socraticService2', (c: IContainer) => new SocraticService(dalOf(c)));
    register('fishbowlService', (c: IContainer) => new FishbowlService(dalOf(c)));
    register('delphiService', () => new DelphiService());
};
