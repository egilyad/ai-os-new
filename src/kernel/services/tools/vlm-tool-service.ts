/**
 * VLM-as-a-tool (OWL-inspired, K2).
 *
 * Wraps a vision-capable chat model as an agent-callable tool. If no model is
 * configured it reports unconfigured instead of fabricating a description.
 */
import type { IVlmToolService, VisionResult } from '../../contracts/vlm-tool';

export class VlmToolService implements IVlmToolService {
    constructor(
        private llm?: {
            chat(messages: Array<{ role: string; content: string }>): Promise<{ content: string }>;
        },
        private model = 'vision',
    ) {}

    isConfigured(): boolean {
        return Boolean(this.llm);
    }

    async analyze(image: string, prompt = 'Describe this image in detail.'): Promise<VisionResult> {
        if (!this.llm) throw new Error('VLM tool is not configured');
        if (!image || typeof image !== 'string')
            throw new Error('image must be a non-empty string');
        const res = await this.llm.chat([
            {
                role: 'system',
                content:
                    'You are a vision analysis tool. Reply with JSON: ' +
                    '{"description":"...","labels":["..."]}. Describe only what is visible.',
            },
            {
                role: 'user',
                content: `${prompt}\nImage reference: ${image.slice(0, 200)}`,
            },
        ]);
        const start = res.content.indexOf('{');
        const end = res.content.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return { description: res.content.slice(0, 2000), labels: [], model: this.model };
        }
        try {
            const parsed = JSON.parse(res.content.slice(start, end + 1)) as Partial<VisionResult>;
            return {
                description: typeof parsed.description === 'string' ? parsed.description : '',
                labels: Array.isArray(parsed.labels)
                    ? parsed.labels.filter((l): l is string => typeof l === 'string')
                    : [],
                model: this.model,
            };
        } catch {
            return { description: res.content.slice(0, 2000), labels: [], model: this.model };
        }
    }
}
