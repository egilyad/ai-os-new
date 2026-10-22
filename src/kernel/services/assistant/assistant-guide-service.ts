/**
 * AssistantGuideService — "how do I do this in this project?".
 *
 * The operator asks a goal, not a question. The guide turns the goal into a
 * short ordered plan: which screens to open, which articles to read and how
 * to check the result. Every step names a real route, so the assistant can
 * walk the operator through the project instead of describing it.
 */
import type { ProjectKnowledgeService } from './project-knowledge-service';

export interface GuideStep {
    order: number;
    /** What kind of step this is. */
    kind: 'open' | 'read' | 'check';
    /** The action the assistant should run, if any. */
    action?: string;
    /** Arguments for that action. */
    args?: Record<string, unknown>;
    /** Where the operator goes. */
    route?: string;
    title: string;
    detail: string;
}

export interface GuidePlan {
    goal: string;
    steps: GuideStep[];
    /** What to do when no plan could be built. */
    note: string;
}

/** Which check fits the topic. */
const CHECKS: Array<{ match: RegExp; action: string; title: string }> = [
    { match: /key|ключ|провайдер/i, action: 'keys.health', title: 'Проверить, живы ли ключи' },
    { match: /agent|агент/i, action: 'agents.list', title: 'Проверить, кто в топологии' },
    { match: /memory|памят/i, action: 'memory.search', title: 'Проверить, что известно по теме' },
    { match: /tool|инструмент/i, action: 'tools.list', title: 'Проверить доступность инструментов' },
    { match: /mcp/i, action: 'mcp.list', title: 'Проверить подключённые MCP-серверы' },
];

export class AssistantGuideService {
    constructor(private readonly deps: { knowledge: ProjectKnowledgeService }) {}

    /** Build the plan for a goal. */
    plan(goal: string): GuidePlan {
        const text = goal.trim();
        if (!text) {
            return {
                goal,
                steps: [],
                note: 'Цель пустая — уточните, что именно нужно сделать.',
            };
        }

        const hits = this.deps.knowledge.panelsMatching(text);
        const steps: GuideStep[] = [];
        let order = 1;

        for (const panel of hits.slice(0, 3)) {
            steps.push({
                order: order,
                kind: 'open',
                action: 'ui.openPanel',
                args: { panelId: panel.id, reason: `Шаг ${order}: ${panel.id}` },
                route: panel.route,
                title: `Открыть панель «${panel.id}»`,
                detail: panel.component
                    ? `${panel.route} → ${panel.component}`
                    : `${panel.route} — реализация не найдена в карте панелей`,
            });
            order += 1;
        }

        if (steps.length === 0) {
            return {
                goal: text,
                steps: [],
                note: 'По этой цели панели не найдены. Уточните формулировку или попросите найти через system.find.',
            };
        }

        const check = CHECKS.find((c) => c.match.test(text));
        if (check) {
            steps.push({
                order: order,
                kind: 'check',
                action: check.action,
                title: check.title,
                detail: 'Проверка, что результат достигнут.',
            });
        }

        return {
            goal: text,
            steps,
            note: 'Откройте панели по порядку — ассистент может открыть их сам, если вы разрешите.',
        };
    }
}
