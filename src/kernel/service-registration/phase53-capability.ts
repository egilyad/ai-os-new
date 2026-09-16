import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DataAccessLayer } from '../dal/types';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IToolRunnerService } from '../contracts/parity';
import type { IPersonaService } from '../contracts/persona';
import type { ISkillMarketService } from '../contracts/ops';
import type { ICogMemoryService } from '../contracts/meta';
import type { IGovernanceService } from '../contracts/trust';
import { CapabilityResolver } from '../services/capability/capability-resolver';
import { AgentFactory } from '../services/capability/agent-factory';
function dalOf(c:IContainer): DataAccessLayer { return c.get<DataAccessLayer>('dal'); }
function eventsOf(c:IContainer): IEventBus { return c.get<IEventBus>('eventBus'); }
function llmOf(c:IContainer): ILLMClientService|undefined { return c.has('llmClientService')?c.get<ILLMClientService>('llmClientService'):undefined; }
export const registerPhase53: Phase = ({ register }) => {
    register('capabilityResolver', (c:IContainer)=> new CapabilityResolver(dalOf(c), c.has('personaService')?c.get<IPersonaService>('personaService'):undefined, c.has('skillMarketService')?c.get<ISkillMarketService>('skillMarketService'):undefined, c.has('toolRunnerService')?c.get<IToolRunnerService>('toolRunnerService'):undefined, c.has('governanceService')?c.get<IGovernanceService>('governanceService'):undefined));
    register('agentFactory', (c:IContainer)=> new AgentFactory(dalOf(c), eventsOf(c), c.get<import('../contracts/capability').ICapabilityResolver>('capabilityResolver'), llmOf(c), c.has('toolRunnerService')?c.get<IToolRunnerService>('toolRunnerService'):undefined, c.has('cogMemoryService')?c.get<ICogMemoryService>('cogMemoryService'):undefined));
};
