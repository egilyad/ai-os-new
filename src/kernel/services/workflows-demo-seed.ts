import type { WorkflowService } from './workflow-service';
import type { Workflow } from '../contracts/workflow-types';

/**
 * Demo seed for Workflows: one three-step digest pipeline definition
 * (creation is static; runs stay user-driven).
 *
 * Idempotent: workflows titled DEMO_WORKFLOW_TITLE are reused.
 */
export const DEMO_WORKFLOW_TITLE = 'Демо: утренний дайджест';

export async function seedWorkflowsDemo(service: WorkflowService): Promise<Workflow> {
    const existing = (await service.getAll()).find((w) => w.title === DEMO_WORKFLOW_TITLE);
    if (existing) return existing;
    return service.create({
        title: DEMO_WORKFLOW_TITLE,
        description: 'Демо-пайплайн: собрать задачи, проверить риски, оформить дайджест.',
        steps: [
            {
                label: 'Сбор задач',
                promptTemplate: 'Собери задачи дня из контекста: {{input}}',
                provider: 'openrouter',
                model: 'openai/gpt-4o-mini',
            },
            {
                label: 'Проверка рисков',
                promptTemplate: 'Найди риски срыва в списке: {{steps.0.output}}',
                provider: 'openrouter',
                model: 'openai/gpt-4o-mini',
            },
            {
                label: 'Оформление',
                promptTemplate: 'Оформи вежливый дайджест из 3–5 пунктов: {{steps.1.output}}',
                provider: 'openrouter',
                model: 'openai/gpt-4o-mini',
            },
        ],
        tags: ['демо', 'дайджест'],
    });
}
