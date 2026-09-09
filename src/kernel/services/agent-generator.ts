import { safeJsonParse } from '../../kernel/utils/safe-json';
import { sanitizePromptVar } from '../../kernel/utils/sanitize';
import { PROVIDER_DEFAULT_MODELS } from '../../kernel/utils/provider-default-models';
const GENERATION_PROMPT = `You are an AI agent configuration generator. Given a natural language description, generate a complete agent configuration.

Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "name": "Agent Name",
  "roleName": "short role name (2-3 words)",
  "description": "One sentence description",
  "prompt": "Detailed system prompt for the agent (2-3 sentences)",
  "tools": ["list", "of", "relevant", "tool", "names"],
  "temperature": 0.7,
  "category": "technical|creative|analytical|management|custom"
}

Available tools: code_execution, file_read, file_write, web_search, web_fetch, image_generation, data_analysis, terminal, git, database_query, api_call, email_send, calendar, notification, memory_read, memory_write, agent_spawn

Rules:
- Temperature: 0.1-0.3 for precise/analytical, 0.4-0.7 for balanced, 0.8-1.0 for creative
- Tools should match what the agent needs (don't add unnecessary tools)
- System prompt should clearly define the agent's behavior and expertise
- Role name should be concise (e.g., "Code Reviewer", not "An Agent That Reviews Code")`;

interface GeneratedConfig {
    name: string;
    roleName: string;
    description: string;
    prompt: string;
    tools: string[];
    temperature: number;
    category: string;
}

interface AgentGeneratorDeps {
    sendMessage: (
        messages: Array<{ role: string; content: string }>,
        model: string,
        apiKey: string,
    ) => Promise<{ content: string }>;
    getApiKey: (provider: string) => string | undefined;
}

export class AgentGenerator {
    private deps: AgentGeneratorDeps;

    constructor(deps: AgentGeneratorDeps) {
        this.deps = deps;
    }

    async generate(description: string): Promise<GeneratedConfig> {
        const apiKey =
            this.deps.getApiKey('groq') ||
            this.deps.getApiKey('gemini') ||
            this.deps.getApiKey('openrouter') ||
            '';
        if (!apiKey) throw new Error('No API key available for generation');

        const provider = this.deps.getApiKey('groq')
            ? 'groq'
            : this.deps.getApiKey('gemini')
              ? 'gemini'
              : 'openrouter';
        const model =
            provider === 'groq'
                ? PROVIDER_DEFAULT_MODELS.groq
                : provider === 'gemini'
                  ? PROVIDER_DEFAULT_MODELS.gemini_flash
                  : 'meta-llama/llama-3.3-70b-instruct';

        const response = await this.deps.sendMessage(
            [
                {
                    role: 'user',
                    content: `${GENERATION_PROMPT}\n\nDescription: ${sanitizePromptVar(description)}`,
                },
            ],
            model!,
            apiKey,
        );

        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Could not parse generated config');

        let parsed: Record<string, unknown>;
        try {
            parsed = safeJsonParse(jsonMatch[0]) ?? {};
        } catch (e) {
            throw new Error(`Failed to parse generated config: ${(e as Error).message}`, {
                cause: e,
            });
        }
        const config = parsed as unknown as GeneratedConfig;

        return {
            name: config.name || 'Generated Agent',
            roleName: config.roleName || 'Assistant',
            description: config.description || description,
            prompt: config.prompt || `You are a helpful assistant specialized in: ${description}`,
            tools: Array.isArray(config.tools) ? config.tools : [],
            temperature:
                typeof config.temperature === 'number'
                    ? Math.max(0, Math.min(2, config.temperature))
                    : 0.7,
            category: ['technical', 'creative', 'analytical', 'management', 'custom'].includes(
                config.category,
            )
                ? config.category
                : 'custom',
        };
    }

    async refine(currentConfig: GeneratedConfig, instruction: string): Promise<GeneratedConfig> {
        const apiKey =
            this.deps.getApiKey('groq') ||
            this.deps.getApiKey('gemini') ||
            this.deps.getApiKey('openrouter') ||
            '';
        if (!apiKey) throw new Error('No API key available for refinement');

        const provider = this.deps.getApiKey('groq')
            ? 'groq'
            : this.deps.getApiKey('gemini')
              ? 'gemini'
              : 'openrouter';
        const model =
            provider === 'groq'
                ? PROVIDER_DEFAULT_MODELS.groq
                : provider === 'gemini'
                  ? PROVIDER_DEFAULT_MODELS.gemini_flash
                  : 'meta-llama/llama-3.3-70b-instruct';

        const prompt = `You are an AI agent configuration editor. Here is the current configuration:

${JSON.stringify(currentConfig, null, 2)}

The user wants to make this change: "${instruction}"

Respond with ONLY the updated JSON object (same format as before, no markdown, no explanation).`;

        const response = await this.deps.sendMessage(
            [{ role: 'user', content: prompt }],
            model!,
            apiKey,
        );

        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Could not parse refined config');

        let parsed: Record<string, unknown>;
        try {
            parsed = safeJsonParse(jsonMatch[0]) ?? {};
        } catch (e) {
            throw new Error(`Failed to parse refined config: ${(e as Error).message}`, {
                cause: e,
            });
        }
        const config = parsed as unknown as GeneratedConfig;

        return {
            name: config.name || currentConfig.name,
            roleName: config.roleName || currentConfig.roleName,
            description: config.description || currentConfig.description,
            prompt: config.prompt || currentConfig.prompt,
            tools: Array.isArray(config.tools) ? config.tools : currentConfig.tools,
            temperature:
                typeof config.temperature === 'number'
                    ? Math.max(0, Math.min(2, config.temperature))
                    : currentConfig.temperature,
            category: ['technical', 'creative', 'analytical', 'management', 'custom'].includes(
                config.category,
            )
                ? config.category
                : currentConfig.category,
        };
    }

    configToSpawnArgs(config: GeneratedConfig) {
        return {
            name: config.name,
            config: {
                roleName: config.roleName,
                prompt: config.prompt,
                tools: config.tools,
                temperature: config.temperature,
            },
        };
    }
}
