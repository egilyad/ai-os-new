import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IToolRunnerService } from '../contracts/parity';
import { ConstitutionalService } from '../services/rivals12/constitutional-service';
import { VoyagerService } from '../services/rivals12/voyager-service';
import { SmallvilleService } from '../services/rivals12/smallville-service';
import { AlphaCodeService } from '../services/rivals12/alphacode-service';
import { WorldModelService } from '../services/rivals12/worldmodel-service';
import { NeuroSymbolicService } from '../services/rivals12/neurosymbolic-service';
import { SwarmService } from '../services/rivals12/swarm-service';
import { ALifeService } from '../services/rivals12/alife-service';
import { CuriosityService } from '../services/rivals12/curiosity-service';
import { QuantumDeepService } from '../services/rivals12/quantum-service';
function llmOf(c: IContainer): ILLMClientService | undefined { return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined; }
function dalOf(c: IContainer): DataAccessLayer { return c.get<DataAccessLayer>('dal'); }
function eventsOf(c: IContainer): IEventBus { return c.get<IEventBus>('eventBus'); }
export const registerPhase44: Phase = ({ register }) => {
    register('constitutionalService', (c: IContainer) => new ConstitutionalService(dalOf(c), eventsOf(c), llmOf(c)));
    register('voyagerService', (c: IContainer) => new VoyagerService(dalOf(c), eventsOf(c), llmOf(c), c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined));
    register('smallvilleService', (c: IContainer) => new SmallvilleService(dalOf(c), llmOf(c)));
    register('alphaCodeService', (c: IContainer) => new AlphaCodeService(llmOf(c)));
    register('worldModelService', (c: IContainer) => new WorldModelService(dalOf(c)));
    register('neuroSymbolicService', (c: IContainer) => new NeuroSymbolicService(dalOf(c)));
    register('swarmService', () => new SwarmService());
    register('alifeService', (c: IContainer) => new ALifeService(dalOf(c)));
    register('curiosityService', (c: IContainer) => new CuriosityService(dalOf(c), c.has('worldModelService') ? c.get<import('../contracts/rivals12').IWorldModelService>('worldModelService') : undefined));
    register('quantumDeepService', (c: IContainer) => new QuantumDeepService(dalOf(c)));
};
