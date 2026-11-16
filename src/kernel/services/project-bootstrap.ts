import type { ProjectRepository } from '../dal/project-repository';
import type { IEventBus } from '../types/interfaces';
import type { Project } from '../types/project-types';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('ProjectBootstrap');

/**
 * Фиксированный идентификатор «зонтичного» проекта-графа: сюда
 * автоматически подключаются сущности без явного projectId (вики-страницы
 * и прочее) — чтобы граф проекта был виден сразу.
 */
export const OPENCODE_INFO_PROJECT_ID = 'proj-opencode-info';

export function makeOpenCodeInfoProject(now = Date.now()): Project {
    return {
        id: OPENCODE_INFO_PROJECT_ID,
        name: 'OpenCodeInfo',
        description:
            'Граф-концентратор: автоматически принимает сущности без проекта ' +
            '(вики-страницы и др.) для связывания всей системы.',
        type: 'automation',
        status: 'draft',
        agentIds: [],
        memory: { goals: [], constraints: [], decisions: [], knownIssues: [], requirements: [] },
        createdAt: now,
        updatedAt: now,
        metadata: { bootstrap: true },
    };
}

export async function ensureOpenCodeInfoProject(
    repo: ProjectRepository,
    eventBus?: IEventBus,
): Promise<Project> {
    const existing = await repo.get(OPENCODE_INFO_PROJECT_ID);
    if (existing) return existing;
    const project = makeOpenCodeInfoProject();
    await repo.put(project);
    if (eventBus) {
        eventBus.emit('project:created', {
            projectId: project.id,
            name: project.name,
            type: project.type,
        });
    }
    LOGGER.info('ProjectBootstrap', 'OpenCodeInfo project created', { id: project.id });
    return project;
}
