/**
 * Built-in Crew templates (Wave 1.4).
 *
 * High-level starting points: user picks a template -> `createCrewFromTemplate`
 * -> edit -> `startCrew`. All templates are local-first, no network.
 */
import type { CreateCrewInput } from '../../contracts/crew';

export interface CrewTemplate {
    id: string;
    name: string;
    description: string;
    build: () => CreateCrewInput;
}

function now(): number {
    return Date.now();
}

void now;

export const CREW_TEMPLATES: CrewTemplate[] = [
    {
        id: 'research-team',
        name: 'Research Team',
        description: 'Researcher -> Analyst -> Writer pipeline for deep topics.',
        build: () => ({
            name: 'Research Team',
            description: 'Deep research pipeline: gather, analyze, write up.',
            process: 'sequential',
            roles: [
                {
                    name: 'Researcher',
                    role: 'Information gatherer',
                    goal: 'Collect accurate facts and sources on the topic',
                    backstory: 'Senior OSINT researcher with 10y experience.',
                    allowDelegation: false,
                },
                {
                    name: 'Analyst',
                    role: 'Critical analyst',
                    goal: 'Distill findings into insights and trade-offs',
                    backstory: 'Ex-consultant, Feynman-style explainer.',
                    allowDelegation: false,
                },
                {
                    name: 'Writer',
                    role: 'Technical writer',
                    goal: 'Produce a clear final report',
                    backstory: 'Editor who turns drafts into publishable reports.',
                    allowDelegation: false,
                },
            ],
            tasks: [
                {
                    description: 'Gather key facts and sources',
                    expectedOutput: 'Bullet list of 5-10 facts with sources',
                    assigneeId: '__role:0__',
                },
                {
                    description: 'Analyze findings, pros/cons, risks',
                    expectedOutput: 'Structured analysis with trade-offs',
                    assigneeId: '__role:1__',
                },
                {
                    description: 'Write the final report',
                    expectedOutput: 'Markdown report under 1000 words',
                    assigneeId: '__role:2__',
                },
            ],
        }),
    },
    {
        id: 'code-review-council',
        name: 'Code Review Council',
        description: 'Author + reviewers critique loop for code changes.',
        build: () => ({
            name: 'Code Review Council',
            description: 'Author drafts, reviewers critique, author revises.',
            process: 'hierarchical',
            roles: [
                {
                    name: 'Author',
                    role: 'Implementer',
                    goal: 'Implement the change cleanly',
                    backstory: 'Staff engineer, owns the diff.',
                    allowDelegation: true,
                },
                {
                    name: 'Reviewer Sec',
                    role: 'Security reviewer',
                    goal: 'Find security and correctness issues',
                    backstory: 'Paranoid AppSec reviewer.',
                    allowDelegation: false,
                },
                {
                    name: 'Reviewer Perf',
                    role: 'Performance reviewer',
                    goal: 'Find perf and complexity issues',
                    backstory: 'Performance-obsessed systems engineer.',
                    allowDelegation: false,
                },
            ],
            tasks: [
                {
                    description: 'Draft the implementation plan',
                    expectedOutput: 'Step-by-step plan with file list',
                    assigneeId: '__role:0__',
                },
                {
                    description: 'Security review of the plan',
                    expectedOutput: 'List of risks + mitigations',
                    assigneeId: '__role:1__',
                },
                {
                    description: 'Performance review of the plan',
                    expectedOutput: 'List of perf notes',
                    assigneeId: '__role:2__',
                },
            ],
        }),
    },
    {
        id: 'content-forge',
        name: 'Content Forge',
        description: 'Idea -> draft -> polish for articles and posts.',
        build: () => ({
            name: 'Content Forge',
            description: 'From raw idea to polished article.',
            process: 'sequential',
            roles: [
                {
                    name: 'Ideator',
                    role: 'Brainstormer',
                    goal: 'Generate strong angles',
                    backstory: 'Creative strategist.',
                    allowDelegation: false,
                },
                {
                    name: 'Drafter',
                    role: 'Copywriter',
                    goal: 'Turn angle into a draft',
                    backstory: 'Fast, vivid copywriter.',
                    allowDelegation: false,
                },
                {
                    name: 'Editor',
                    role: 'Editor',
                    goal: 'Polish to publishable quality',
                    backstory: 'Ruthless editor, short sentences.',
                    allowDelegation: false,
                },
            ],
            tasks: [
                {
                    description: 'Propose 3 angles',
                    expectedOutput: '3 angles with one-liners',
                    assigneeId: '__role:0__',
                },
                {
                    description: 'Draft the piece',
                    expectedOutput: 'Full draft ~600 words',
                    assigneeId: '__role:1__',
                },
                {
                    description: 'Edit and polish',
                    expectedOutput: 'Final text ready to publish',
                    assigneeId: '__role:2__',
                },
            ],
        }),
    },
    {
        id: 'debate-prep',
        name: 'Debate Prep',
        description: 'Proponent + opponent + fact-checker before a Debate Arena run.',
        build: () => ({
            name: 'Debate Prep',
            description: 'Prepare both sides plus verified facts.',
            process: 'sequential',
            roles: [
                {
                    name: 'Proponent',
                    role: 'Pro side',
                    goal: 'Build the strongest pro case',
                    backstory: 'Debate champion, pro side.',
                    allowDelegation: false,
                },
                {
                    name: 'Opponent',
                    role: 'Con side',
                    goal: 'Build the strongest con case',
                    backstory: 'Debate champion, con side.',
                    allowDelegation: false,
                },
                {
                    name: 'Fact Checker',
                    role: 'Verifier',
                    goal: 'Verify claims from both sides',
                    backstory: 'Meticulous fact-checker, sources only.',
                    allowDelegation: false,
                },
            ],
            tasks: [
                {
                    description: 'Build the pro case',
                    expectedOutput: 'Pro arguments with evidence',
                    assigneeId: '__role:0__',
                },
                {
                    description: 'Build the con case',
                    expectedOutput: 'Con arguments with evidence',
                    assigneeId: '__role:1__',
                },
                {
                    description: 'Fact-check both cases',
                    expectedOutput: 'Verified / disputed claim list',
                    assigneeId: '__role:2__',
                },
            ],
        }),
    },
    {
        id: 'sop-software',
        name: 'SOP Software Crew',
        description: 'MetaGPT-style pipeline: PM → Architect → Engineer → QA.',
        build: () => ({
            name: 'SOP Software Crew',
            description: 'Requirements to reviewed code, phased.',
            process: 'sequential',
            roles: [
                {
                    name: 'ProductManager',
                    role: 'Requirements owner',
                    goal: 'Write crisp PRD with acceptance criteria',
                    backstory: 'PM who says no to scope creep.',
                    allowDelegation: false,
                },
                {
                    name: 'Architect',
                    role: 'System designer',
                    goal: 'Design modules and interfaces from the PRD',
                    backstory: 'Boring-technology architect.',
                    allowDelegation: false,
                },
                {
                    name: 'Engineer',
                    role: 'Implementer',
                    goal: 'Implement the design file by file',
                    backstory: 'Staff engineer, tests included.',
                    allowDelegation: false,
                },
                {
                    name: 'QaEngineer',
                    role: 'Reviewer',
                    goal: 'Find defects and demand fixes',
                    backstory: 'Relentless QA, evidence only.',
                    allowDelegation: false,
                },
            ],
            tasks: [
                {
                    description: 'Write the PRD with acceptance criteria',
                    expectedOutput: 'PRD with user stories + acceptance',
                    assigneeId: '__role:0__',
                },
                {
                    description: 'Design modules and interfaces',
                    expectedOutput: 'Design doc with file list',
                    assigneeId: '__role:1__',
                },
                {
                    description: 'Implement the design',
                    expectedOutput: 'Code + tests summary',
                    assigneeId: '__role:2__',
                },
                {
                    description: 'Review and list defects',
                    expectedOutput: 'Defect list with fixes',
                    assigneeId: '__role:3__',
                },
            ],
        }),
    },
    {
        id: 'deep-research',
        name: 'Deep Research',
        description: 'Gemini-DR style: plan → gather → verify → brief.',
        build: () => ({
            name: 'Deep Research',
            description: 'Research plan executed and briefed.',
            process: 'sequential',
            roles: [
                {
                    name: 'Planner',
                    role: 'Research planner',
                    goal: 'Draft the research plan with sources to hit',
                    backstory: 'Methodical investigator.',
                    allowDelegation: false,
                },
                {
                    name: 'Gatherer',
                    role: 'Evidence collector',
                    goal: 'Collect facts with citations',
                    backstory: 'Sources-only researcher.',
                    allowDelegation: false,
                },
                {
                    name: 'Verifier',
                    role: 'Claim checker',
                    goal: 'Verify claims and flag gaps',
                    backstory: 'Skeptic with a checklist.',
                    allowDelegation: false,
                },
                {
                    name: 'BriefWriter',
                    role: 'Synthesizer',
                    goal: 'Write the final brief with source table',
                    backstory: 'Editor of record.',
                    allowDelegation: false,
                },
            ],
            tasks: [
                {
                    description: 'Draft the research plan',
                    expectedOutput: 'Step list with sources',
                    assigneeId: '__role:0__',
                },
                {
                    description: 'Gather evidence with citations',
                    expectedOutput: 'Cited fact list',
                    assigneeId: '__role:1__',
                },
                {
                    description: 'Verify claims, flag gaps',
                    expectedOutput: 'Verified/disputed/gap list',
                    assigneeId: '__role:2__',
                },
                {
                    description: 'Write the brief',
                    expectedOutput: 'Brief + source table',
                    assigneeId: '__role:3__',
                },
            ],
        }),
    },
    {
        id: 'support-inbox',
        name: 'Support Inbox',
        description: 'Intercom-style: triage → draft → resolve.',
        build: () => ({
            name: 'Support Inbox',
            description: 'Triage, draft, resolve support work.',
            process: 'sequential',
            roles: [
                {
                    name: 'Triage',
                    role: 'Classifier',
                    goal: 'Classify urgency and topic',
                    backstory: 'Calm dispatcher.',
                    allowDelegation: false,
                },
                {
                    name: 'Responder',
                    role: 'Support writer',
                    goal: 'Draft grounded replies with citations',
                    backstory: 'Empathetic, precise.',
                    allowDelegation: false,
                },
                {
                    name: 'Resolver',
                    role: 'Closer',
                    goal: 'Confirm resolution and log outcome',
                    backstory: 'Owns the result.',
                    allowDelegation: false,
                },
            ],
            tasks: [
                {
                    description: 'Classify the request',
                    expectedOutput: 'Topic + urgency',
                    assigneeId: '__role:0__',
                },
                {
                    description: 'Draft the reply',
                    expectedOutput: 'Reply draft with citations',
                    assigneeId: '__role:1__',
                },
                {
                    description: 'Confirm and log resolution',
                    expectedOutput: 'Resolution record',
                    assigneeId: '__role:2__',
                },
            ],
        }),
    },
    {
        id: 'app-scaffold',
        name: 'App Scaffold',
        description: 'v0-style: clarify → scaffold → review.',
        build: () => ({
            name: 'App Scaffold',
            description: 'From spec to file scaffold.',
            process: 'sequential',
            roles: [
                {
                    name: 'Clarifier',
                    role: 'Question asker',
                    goal: 'Extract the 5 sharpest questions',
                    backstory: 'Hates ambiguity.',
                    allowDelegation: false,
                },
                {
                    name: 'Scaffolder',
                    role: 'Generator',
                    goal: 'Generate the file scaffold',
                    backstory: 'Minimal viable scaffolder.',
                    allowDelegation: false,
                },
                {
                    name: 'Reviewer',
                    role: 'Critic',
                    goal: 'Review paths and sizes',
                    backstory: 'Paranoid about scope.',
                    allowDelegation: false,
                },
            ],
            tasks: [
                {
                    description: 'Ask clarifying questions',
                    expectedOutput: '5 questions max',
                    assigneeId: '__role:0__',
                },
                {
                    description: 'Generate the scaffold',
                    expectedOutput: 'File list with contents',
                    assigneeId: '__role:1__',
                },
                {
                    description: 'Review the scaffold',
                    expectedOutput: 'Issues + fixes',
                    assigneeId: '__role:2__',
                },
            ],
        }),
    },
];

export function getCrewTemplate(id: string): CrewTemplate | undefined {
    return CREW_TEMPLATES.find((t) => t.id === id);
}
