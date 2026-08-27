import type { ICapabilityManager } from '../contracts/capability-manager';
import type { ToolDefinition } from '../contracts/tool-types';
import type { CognitiveSkill } from '../types/domain-types';
import type { ToolService } from '../services/tool-executor';
import type { SkillService } from '../services/skill-service';

export class CapabilityManager implements ICapabilityManager {
    constructor(private deps: { toolService: ToolService; skillService: SkillService }) {}

    listTools(): ToolDefinition[] {
        return this.deps.toolService.getTools();
    }

    listSkills(): CognitiveSkill[] {
        return this.deps.skillService.getSkills();
    }

    async executeTool(toolId: string, input: unknown, signal?: AbortSignal): Promise<any> {
        return this.deps.toolService.execute(toolId, input, signal);
    }
}
