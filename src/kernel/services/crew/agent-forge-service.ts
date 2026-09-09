/**
 * Agent Forge — Wave 1.3.
 *
 * Proposes a Crew draft (roles + tasks + process) from a free-form goal.
 * Deterministic keyword heuristics now (local-first, no network); an LLM
 * proposer can be injected later via `ForgeLlmPort` without touching callers.
 */
import type {
    CreateRoleInput,
    CreateTaskInput,
    ForgeProposal,
    IAgentForgeService,
    ICrewService,
} from '../../contracts/crew';
import type { CrewProcess } from '../../types/crew-types';
import { EVENTS } from '../../events/event-names';
import type { IEventBus } from '../../types/interfaces';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('AgentForge');

export interface ForgeLlmPort {
    proposeGoal(input: { goal: string; constraints?: string }): Promise<ForgeProposal | null>;
}

interface KeywordRule {
    keywords: string[];
    role: CreateRoleInput;
    task: Omit<CreateTaskInput, 'assigneeId'>;
}

const RULES: KeywordRule[] = [
    {
        keywords: ['исслед', 'research', 'анализ', 'analy', 'обзор', 'review', 'факт', 'fact'],
        role: {
            name: 'Researcher',
            role: 'Information gatherer',
            goal: 'Collect accurate facts and sources',
            backstory: 'Senior researcher, sources-only discipline.',
        },
        task: {
            description: 'Gather key facts and sources on the goal',
            expectedOutput: 'Bullet list of facts with sources',
        },
    },
    {
        keywords: ['код', 'code', 'баг', 'bug', 'программ', 'software', 'фич', 'feature', 'api'],
        role: {
            name: 'Engineer',
            role: 'Implementer',
            goal: 'Design and implement the technical change',
            backstory: 'Staff engineer, clean diffs and tests.',
        },
        task: {
            description: 'Draft the implementation plan with file list',
            expectedOutput: 'Step-by-step plan with risks',
        },
    },
    {
        keywords: ['текст', 'стать', 'content', 'пост', 'write', 'копирайт', 'документ', 'doc'],
        role: {
            name: 'Writer',
            role: 'Copywriter',
            goal: 'Turn ideas into a clear draft',
            backstory: 'Fast, vivid copywriter.',
        },
        task: {
            description: 'Write the draft',
            expectedOutput: 'Full draft ready for editing',
        },
    },
    {
        keywords: ['дизайн', 'design', 'ui', 'ux', 'интерфейс', 'макет'],
        role: {
            name: 'Designer',
            role: 'Product designer',
            goal: 'Propose a usable, clean design direction',
            backstory: 'Product designer, mobile-first.',
        },
        task: {
            description: 'Propose the design direction and key screens',
            expectedOutput: 'Design outline with screen list',
        },
    },
    {
        keywords: ['тест', 'test', 'провер', 'verif', 'qa', 'безопас', 'secur'],
        role: {
            name: 'Critic',
            role: 'Reviewer',
            goal: 'Find flaws, risks and gaps',
            backstory: 'Paranoid reviewer, evidence-driven.',
        },
        task: {
            description: 'Critique the draft and list risks',
            expectedOutput: 'Risk list with mitigations',
        },
    },
    {
        keywords: ['план', 'plan', 'стратег', 'strategy', 'бизнес', 'business', 'маркетинг', 'market'],
        role: {
            name: 'Strategist',
            role: 'Planner',
            goal: 'Turn the goal into an actionable plan',
            backstory: 'Operator who ships plans that survive contact with reality.',
        },
        task: {
            description: 'Build the action plan with milestones',
            expectedOutput: 'Milestones + owners + deadlines',
        },
    },
];

const FALLBACK_ROLES: CreateRoleInput[] = [
    {
        name: 'Coordinator',
        role: 'Coordinator',
        goal: 'Decompose the goal and coordinate the team',
        backstory: 'Calm orchestrator, keeps the team on track.',
    },
    {
        name: 'Specialist',
        role: 'Domain specialist',
        goal: 'Produce the core result',
        backstory: 'Deep domain expert.',
    },
    {
        name: 'Critic',
        role: 'Reviewer',
        goal: 'Verify and harden the result',
        backstory: 'Evidence-driven skeptic.',
    },
];

export class AgentForgeService implements IAgentForgeService {
    constructor(
        private crewService: ICrewService,
        private eventBus: IEventBus,
        private llm?: ForgeLlmPort,
    ) {}

    async propose(input: { goal: string; constraints?: string }): Promise<ForgeProposal> {
        // 1. Optional LLM proposer wins when it returns a valid draft.
        if (this.llm) {
            try {
                const fromLlm = await this.llm.proposeGoal(input);
                if (fromLlm && fromLlm.roles.length > 0 && fromLlm.tasks.length > 0) {
                    this.emit(input.goal, fromLlm.roles.length, 'llm');
                    return fromLlm;
                }
            } catch (e) {
                LOGGER.warn('llm proposer failed, falling back to heuristics', {
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        // 2. Deterministic heuristics — always available offline.
        const lower = input.goal.toLowerCase();
        const matched = RULES.filter((r) => r.keywords.some((k) => lower.includes(k)));

        const roles: CreateRoleInput[] =
            matched.length > 0 ? matched.map((m) => ({ ...m.role })) : FALLBACK_ROLES.map((r) => ({ ...r }));
        // Cap team size to keep runs manageable.
        const trimmedRoles = roles.slice(0, 4);

        const tasks: CreateTaskInput[] =
            matched.length > 0
                ? matched.slice(0, 4).map((m, i) => ({
                      description: m.task.description,
                      expectedOutput: m.task.expectedOutput,
                      assigneeId: `__role:${i}__`,
                      dependsOn: i > 0 ? [`__task:${i - 1}__`] : undefined,
                  }))
                : [
                      {
                          description: `Decompose the goal: ${input.goal.slice(0, 120)}`,
                          expectedOutput: 'Ordered sub-task list',
                          assigneeId: '__role:0__',
                      },
                      {
                          description: 'Produce the core result',
                          expectedOutput: 'Draft result with reasoning',
                          assigneeId: '__role:1__',
                      },
                      {
                          description: 'Verify and harden the result',
                          expectedOutput: 'Verified result + open questions',
                          assigneeId: '__role:2__',
                      },
                  ];

        const needsHierarchy =
            /сложн|complex|hierarch|иерарх|делегир|delegation|больш|large/.test(lower);
        const process: CrewProcess = trimmedRoles.length >= 3 && needsHierarchy ? 'hierarchical' : 'sequential';

        const proposal: ForgeProposal = {
            name: `Forge: ${input.goal.slice(0, 60)}`,
            description: input.constraints
                ? `Goal: ${input.goal}\nConstraints: ${input.constraints}`
                : `Goal: ${input.goal}`,
            process,
            roles: trimmedRoles,
            tasks,
            reasoning: `Heuristic match: ${matched.length} rule(s) fired (${matched.map((m) => m.role.name).join(', ') || 'fallback team'}). Edit roles/tasks before launch.`,
        };
        this.emit(input.goal, proposal.roles.length, 'heuristic');
        return proposal;
    }

    async materialize(proposal: ForgeProposal) {
        return this.crewService.createCrew({
            name: proposal.name,
            description: proposal.description,
            process: proposal.process,
            roles: proposal.roles,
            tasks: proposal.tasks,
        });
    }

    private emit(goal: string, roleCount: number, mode: string): void {
        try {
            this.eventBus.emit(EVENTS.FORGE_PROPOSED, {
                proposalId: genId('forge'),
                goal: goal.slice(0, 280),
                roleCount,
                mode,
            });
        } catch {
            // best-effort observability — never break the proposal
        }
    }
}
