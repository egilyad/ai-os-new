import type { ToolDefinition } from '../contracts/tool-types';
import type { CognitiveSkill } from '../types/domain-types';

export interface ICapabilityManager {
    listTools(): ToolDefinition[];
    listSkills(): CognitiveSkill[];
    executeTool(toolId: string, input: unknown, signal?: AbortSignal): Promise<unknown>;
}
