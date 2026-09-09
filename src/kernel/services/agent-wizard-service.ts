/**
 * Agent Wizard Service
 * Generates agent configurations from natural language descriptions
 */

import { rootLogger } from './logger-service';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IEventBus } from '../types/interfaces';
import { EVENTS } from '../events/event-names';
import { safeJsonParse } from '../../kernel/utils/safe-json';
import { sanitizePromptVar } from '../utils/sanitize';

const LOGGER = rootLogger.child('AgentWizard');

export interface AgentConfig {
    name: string;
    role: string;
    systemPrompt: string;
    temperature: number;
    model?: string;
    tools: string[];
    permissions: string[];
    metadata?: Record<string, unknown>;
}

export interface WizardSuggestion {
    name: string;
    description: string;
    confidence: number;
    reasoning: string;
}

export interface WizardConfig {
    provider?: string;
    model?: string;
    temperature?: number;
}

const DEFAULT_CONFIG: WizardConfig = {
    temperature: 0.7,
};

export interface RolePreset {
    id: string;
    name: string;
    systemPrompt: string;
    temperature: number;
    tools: string[];
}

export class AgentWizardService {
    private config: WizardConfig;
    private llmClient: ILLMClientService;
    private eventBus: IEventBus;

    constructor(
        llmClient: ILLMClientService,
        eventBus: IEventBus,
        config: Partial<WizardConfig> = {},
    ) {
        this.llmClient = llmClient;
        this.eventBus = eventBus;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Generate agent configuration from description
     */
    async generateConfig(
        description: string,
        options?: {
            existingRoles?: string[];
            preferredTools?: string[];
        },
    ): Promise<AgentConfig> {
        LOGGER.info('AgentWizard', 'Generating config', {
            description: description.substring(0, 50),
        });

        const prompt = this.buildGenerationPrompt(description, options);

        try {
            const response = await this.llmClient.sendMessage([{ role: 'user', content: prompt }], {
                temperature: this.config.temperature,
                maxTokens: 800,
            });

            const config = this.parseConfigResponse(response.content || '');

            LOGGER.info('AgentWizard', 'Config generated', { name: config.name });
            this.eventBus.emit(EVENTS.AGENT_WIZARD_CONFIG_GENERATED, config);

            return config;
        } catch (error) {
            LOGGER.error('AgentWizard', 'Failed to generate config', { error });
            throw error;
        }
    }

    /**
     * Suggest improvements to an existing agent
     */
    async suggestImprovements(
        currentConfig: AgentConfig,
        feedback: string,
    ): Promise<{ suggestions: string[]; newConfig: AgentConfig }> {
        const prompt = `Based on the following feedback, suggest improvements to the agent configuration.

Current agent:
- Name: ${currentConfig.name}
- Role: ${currentConfig.role}
- System Prompt: ${currentConfig.systemPrompt}
- Temperature: ${currentConfig.temperature}
- Tools: ${currentConfig.tools.join(', ')}

Feedback: "${sanitizePromptVar(feedback)}"

Respond with a JSON object:
{
  "suggestions": ["suggestion 1", "suggestion 2"],
  "newConfig": {
    "name": "...",
    "role": "...",
    "systemPrompt": "...",
    "temperature": 0-2,
    "tools": [...],
    "permissions": [...]
  }
}

Respond ONLY with the JSON object.`;

        try {
            const response = await this.llmClient.sendMessage([{ role: 'user', content: prompt }], {
                temperature: 0.5,
            });

            const parsed = safeJsonParse(response.content || '{}') as {
                suggestions: string[];
                newConfig: AgentConfig;
            };

            return {
                suggestions: parsed.suggestions || [],
                newConfig: parsed.newConfig || currentConfig,
            };
        } catch (error) {
            LOGGER.error('AgentWizard', 'Failed to suggest improvements', { error });
            return {
                suggestions: ['Failed to generate suggestions'],
                newConfig: currentConfig,
            };
        }
    }

    /**
     * Match description to existing roles
     */
    async matchRole(
        description: string,
        existingRoles: RolePreset[],
    ): Promise<{ matchedRole: RolePreset | null; confidence: number; reasoning: string }> {
        if (existingRoles.length === 0) {
            return { matchedRole: null, confidence: 0, reasoning: 'No existing roles provided' };
        }

        const prompt = `Match the following agent description to one of these existing roles:

Description: "${sanitizePromptVar(description)}"

Available roles:
${existingRoles.map((r) => `- ${r.name}: ${r.systemPrompt.substring(0, 100)}...`).join('\n')}

Respond with JSON:
{
  "matchedRoleId": "role-id" or null,
  "confidence": 0-1,
  "reasoning": "why this role matches"
}`;

        try {
            const response = await this.llmClient.sendMessage([{ role: 'user', content: prompt }], {
                temperature: 0.3,
            });

            const parsed = safeJsonParse(response.content || '{}') as {
                matchedRoleId: string | null;
                confidence: number;
                reasoning: string;
            };

            const matched = existingRoles.find((r) => r.id === parsed.matchedRoleId) || null;

            return {
                matchedRole: matched,
                confidence: parsed.confidence ?? 0,
                reasoning: parsed.reasoning || '',
            };
        } catch (error) {
            LOGGER.error('AgentWizard', 'Failed to match role', { error });
            return { matchedRole: null, confidence: 0, reasoning: 'Failed to match' };
        }
    }

    /**
     * Generate a name suggestion
     */
    async suggestName(description: string): Promise<string> {
        const prompt = `Generate a short, memorable name for an AI agent with this purpose: "${sanitizePromptVar(description)}"

Respond with just the name, no explanation. Keep it under 30 characters. Use 1-3 words.`;

        try {
            const response = await this.llmClient.sendMessage([{ role: 'user', content: prompt }], {
                temperature: 0.8,
            });

            return (response.content || 'Agent').trim().substring(0, 30);
        } catch (error) {
            LOGGER.error('AgentWizard', 'Failed to suggest name', { error });
            return 'New Agent';
        }
    }

    private buildGenerationPrompt(
        description: string,
        options?: {
            existingRoles?: string[];
            preferredTools?: string[];
        },
    ): string {
        let prompt = `Generate a complete AI agent configuration from this description:

"${sanitizePromptVar(description)}"

`;

        if (options?.existingRoles?.length) {
            prompt += `Reference these existing roles for consistency: ${options.existingRoles.join(', ')}\n\n`;
        }

        if (options?.preferredTools?.length) {
            prompt += `Available tools: ${options.preferredTools.join(', ')}\n\n`;
        }

        prompt += `Generate a JSON object with this structure:
{
  "name": "Short agent name (1-3 words)",
  "role": "One-word role category (e.g., researcher, coder, reviewer)",
  "systemPrompt": "Detailed system prompt in 2-3 paragraphs explaining the agent's purpose, behavior, and constraints",
  "temperature": 0.1-1.5 (0.3 for analytical, 0.7 for creative, etc.),
  "tools": ["tool1", "tool2"] (pick from: web-search, code-execution, file-system, memory, api-call, calculator),
  "permissions": ["permission1", "permission2"] (e.g., chat:send, memory:read, tools:execute)
}

Respond ONLY with the JSON object, no markdown or explanation.`;

        return prompt;
    }

    private parseConfigResponse(content: string): AgentConfig {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = safeJsonParse(jsonMatch[0]) as Partial<AgentConfig>;

            return {
                name: parsed.name || 'New Agent',
                role: parsed.role || 'general',
                systemPrompt: parsed.systemPrompt || 'You are a helpful AI agent.',
                temperature: parsed.temperature ?? 0.7,
                model: parsed.model,
                tools: parsed.tools || [],
                permissions: parsed.permissions || [],
                metadata: parsed.metadata,
            };
        } catch (error) {
            LOGGER.warn('AgentWizard', 'Failed to parse config, using defaults', { error });
            return {
                name: 'New Agent',
                role: 'general',
                systemPrompt: 'You are a helpful AI agent.',
                temperature: 0.7,
                tools: [],
                permissions: [],
            };
        }
    }
}
