import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { DataAccessLayer } from '../dal/types';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IToolRunnerService } from '../contracts/parity';
import type { ICoordinationService } from '../contracts/interop';
import type { MCPService } from '../services/mcp-service';
import { ClaudeCodeService } from '../services/rivals14/claudecode-service';
import { McpDeepService } from '../services/rivals14/mcpdeep-service';
import { FilesApiService } from '../services/rivals14/files-service';
import { CacheControlService } from '../services/rivals14/cache-service';
import { ProjectService } from '../services/rivals14/project-service';
import { DynamicWorkflowService } from '../services/rivals14/dynamic-service';
import { RoutineService } from '../services/rivals14/routine-service';
import { AgentViewService } from '../services/rivals14/agentview-service';
function llmOf(c:IContainer): ILLMClientService|undefined { return c.has('llmClientService')?c.get<ILLMClientService>('llmClientService'):undefined; }
export const registerPhase46: Phase = ({ register }) => {
    register('claudeCodeService', (c:IContainer)=> new ClaudeCodeService(c.get<DataAccessLayer>('dal'), c.get<IEventBus>('eventBus'), llmOf(c), c.has('coordinationService')?c.get<ICoordinationService>('coordinationService'):undefined));
    register('mcpDeepService', (c:IContainer)=> new McpDeepService(c.get<IEventBus>('eventBus'), c.has('mcpService')?c.get<MCPService>('mcpService'):undefined));
    register('filesApiService', (c:IContainer)=> new FilesApiService(c.get<DataAccessLayer>('dal'), c.get<IEventBus>('eventBus')));
    register('cacheControlService', (c:IContainer)=> new CacheControlService(c.get<DataAccessLayer>('dal'), c.get<IEventBus>('eventBus')));
    register('projectService', (c:IContainer)=> new ProjectService(c.get<DataAccessLayer>('dal'), llmOf(c), c.get<IEventBus>('eventBus')));
    register('dynamicWorkflowService', (c:IContainer)=> new DynamicWorkflowService(c.get<IEventBus>('eventBus'), c.has('runQueueService')?c.get<import('../contracts/rivals').IRunQueueService>('runQueueService'):undefined, llmOf(c)));
    register('routineService', (c:IContainer)=> new RoutineService(c.get<DataAccessLayer>('dal'), c.get<IEventBus>('eventBus')));
    register('agentViewService', (c:IContainer)=> new AgentViewService(c.get<DataAccessLayer>('dal'), c.has('toolRunnerService')?c.get<IToolRunnerService>('toolRunnerService'):undefined, c.get<IEventBus>('eventBus')));
};
