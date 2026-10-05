import { PromptLibraryService } from './prompt-library-service';
import type { PromptTemplate } from '../contracts/prompt-library';

/**
 * Demo seed for the Prompt Library: two Russian templates (polite refusal +
 * morning digest) in the demo category.
 *
 * Idempotent: templates with DEMO_PROMPT_TAG in tags are reused.
 */
export const DEMO_PROMPT_TAG = 'демо';

export async function seedPromptsDemo(
    service: PromptLibraryService,
): Promise<PromptTemplate[]> {
    const existing = (await service.getAll()).filter((p) => p.tags.includes(DEMO_PROMPT_TAG));
    if (existing.length > 0) return existing;

    const refusal = await service.create({
        title: 'Демо: вежливый отказ',
        content: [
            'Откажись от задачи {{TASK}} вежливо, но твёрдо.',
            '',
            'Структура ответа:',
            '1. Благодарность за доверие.',
            '2. Причина отказа: {{REASON}}.',
            '3. Что предлагаешь взамен: {{ALTERNATIVE}}.',
            '',
            'Тон: {{TONE}} (по умолчанию — дружелюбный).',
        ].join('\n'),
        category: 'demo',
        tags: [DEMO_PROMPT_TAG, 'коммуникация'],
        variables: ['TASK', 'REASON', 'ALTERNATIVE', 'TONE'],
    });

    const digest = await service.create({
        title: 'Демо: утренний дайджест',
        content: [
            'Собери утренний дайджест для команды {{TEAM}}.',
            '',
            'Источники: {{SOURCES}}.',
            'Формат: 3–5 пунктов, каждый — одно предложение + ответственный.',
            'Исключить: {{EXCLUDE}}.',
        ].join('\n'),
        category: 'demo',
        tags: [DEMO_PROMPT_TAG, 'дайджест'],
        variables: ['TEAM', 'SOURCES', 'EXCLUDE'],
    });

    return [refusal, digest];
}
