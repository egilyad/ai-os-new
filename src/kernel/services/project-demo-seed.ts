import type { IProjectManagerService } from '../../contracts/project';
import type { ProjectId } from '../../types/project-types';

/**
 * Demo seed for Projects: one automation project built by three different
 * agents — assignments, tasks in three states (completed / running /
 * queued), a README file and a memory note.
 *
 * Idempotent: projects carrying DEMO_PROJECT_MARKER in metadata are reused —
 * repeated calls return the existing project id.
 */
export const DEMO_PROJECT_MARKER = 'project-demo';

export async function seedProjectDemo(service: IProjectManagerService): Promise<ProjectId> {
    const existing = (await service.list()).find(
        (p) => (p.metadata as Record<string, unknown> | undefined)?.[DEMO_PROJECT_MARKER] === true,
    );
    if (existing) return existing.id;

    const project = await service.create({
        name: 'Демо: бот-напоминалка ☕',
        description:
            'Демо-проект трёх агентов: бот, который по утрам собирает задачи дня и вежливо напоминает о дедлайнах.',
        type: 'automation',
        agentIds: ['agent-architect', 'agent-risk', 'agent-ethics'],
    });
    await service.update(project.id, {
        status: 'building',
        metadata: { [DEMO_PROJECT_MARKER]: true },
    });

    await service.assignAgent(project.id, 'agent-architect', 'developer', [
        'проектирование',
        'прототипы',
    ]);
    await service.assignAgent(project.id, 'agent-risk', 'researcher', [
        'анализ рисков',
        'планирование',
    ]);
    await service.assignAgent(project.id, 'agent-ethics', 'qa', [
        'этика',
        'проверка качества',
    ]);

    const scaffold = await service.createTask(
        project.id,
        'agent-architect',
        'Каркас проекта',
        'Разложить структуру бота: планировщик, отправитель, хранилище состояния.',
        'high',
    );
    await service.updateTaskStatus(
        scaffold.id,
        'completed',
        'Каркас готов: три модуля, конфиг в config.json, запуск одной командой.',
    );

    const risks = await service.createTask(
        project.id,
        'agent-risk',
        'Оценка рисков',
        'Что может пойти не так: спам напоминаниями, часовые пояса, пропущенные дедлайны.',
        'medium',
    );
    await service.updateTaskStatus(risks.id, 'running');

    await service.createTask(
        project.id,
        'agent-ethics',
        'Этический чек-лист',
        'Проверить: уважение к тишине ночью, прозрачность, право на «не напоминать».',
        'medium',
    );

    await service.writeFile(
        project.id,
        'README.md',
        [
            '# Бот-напоминалка ☕',
            '',
            'Демо-проект трёх агентов.',
            '',
            '- Маркус строит каркас;',
            '- Рафаэль считает риски;',
            '- Элена следит, чтобы бот оставался вежливым.',
            '',
            'Статус: в работе, второй спринт.',
            '',
        ].join('\n'),
        'agent-architect',
        scaffold.id,
    );

    // A valid landing page so the QA inspector (headings, viewport, charset,
    // title, meta description, alt texts, anchors) scores the demo 100%.
    await service.writeFile(
        project.id,
        'index.html',
        [
            '<!DOCTYPE html>',
            '<html lang="ru">',
            '<head>',
            '<meta charset="UTF-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '<title>Бот-напоминалка — демо-проект агентов</title>',
            '<meta name="description" content="Демо-проект трёх агентов: бот, который собирает задачи дня и вежливо напоминает о дедлайнах.">',
            '</head>',
            '<body>',
            '<h1>Бот-напоминалка ☕</h1>',
            '<p>Собирает задачи дня и напоминает о дедлайнах. Не беспокоит с 23:00 до 7:00.</p>',
            '<h2 id="features">Возможности</h2>',
            '<ul>',
            '<li>Утренний дайджест задач</li>',
            '<li>Напоминания о дедлайнах</li>',
            '<li>Режим «не беспокоить» ночью</li>',
            '</ul>',
            '<h2>Команда</h2>',
            '<p>Маркус строит, Рафаэль считает риски, Элена следит за вежливостью.</p>',
            '<p><a href="#features">Смотреть возможности</a></p>',
            '<button type="button" onclick="alert(\'Скоро!\')">Попробовать демо</button>',
            '</body>',
            '</html>',
            '',
        ].join('\n'),
        'agent-architect',
        scaffold.id,
    );

    await service.updateMemory(project.id, {
        goals: ['Напоминать о задачах дня без спама'],
        decisions: ['Вето на ночные уведомления с 23:00 до 7:00'],
    });

    return project.id;
}
