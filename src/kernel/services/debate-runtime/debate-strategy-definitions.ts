import type { StrategyDefinition } from '../../contracts/debate-strategy-dsl';

export const BUILTIN_STRATEGIES: StrategyDefinition[] = [
    {
        id: 'builtin.round_robin',
        name: 'Round Robin',
        description: 'Classic sequential round-robin where each agent speaks once per round',
        version: '1.0.0',
        tags: ['classic', 'simple'],
        root: {
            type: 'debate_graph',
            id: 'rr-main',
            agents: [
                { nodeId: 'proponent', role: 'pro', label: 'Proponent' },
                { nodeId: 'opponent', role: 'con', label: 'Opponent' },
            ],
            edges: [
                { from: 'proponent', to: 'opponent', type: 'sequential' },
                { from: 'opponent', to: 'proponent', type: 'sequential' },
            ],
            maxRounds: 5,
            convergenceThreshold: 0.85,
        },
    },
    {
        id: 'builtin.socratic',
        name: 'Socratic Method',
        description:
            'Question-driven inquiry that probes assumptions through iterative questioning',
        version: '1.0.0',
        tags: ['inquiry', 'philosophical'],
        root: {
            type: 'critic_loop',
            id: 'socratic-main',
            proponent: { nodeId: 'claimer', role: 'pro', label: 'Claimant' },
            critic: { nodeId: 'questioner', role: 'con', label: 'Questioner' },
            maxIterations: 6,
            stopWhen: 'agreement',
        },
    },
    {
        id: 'builtin.argument_tree',
        name: 'Argument Tree',
        description: 'Tree-structured argumentation with challenges and refinements',
        version: '1.0.0',
        tags: ['structured', 'deep'],
        root: {
            type: 'debate_graph',
            id: 'at-main',
            agents: [
                { nodeId: 'thesis', role: 'pro', label: 'Thesis' },
                { nodeId: 'antithesis', role: 'con', label: 'Antithesis' },
                { nodeId: 'synthesis', role: 'neutral', label: 'Synthesis' },
            ],
            edges: [
                { from: 'thesis', to: 'antithesis', type: 'challenge' },
                { from: 'antithesis', to: 'thesis', type: 'challenge' },
                { from: 'thesis', to: 'synthesis', type: 'refine' },
                { from: 'antithesis', to: 'synthesis', type: 'refine' },
            ],
            maxRounds: 4,
        },
    },
    {
        id: 'builtin.constrained',
        name: 'Constrained Debate',
        description:
            'Debate with specific constraints on argument structure and evidence requirements',
        version: '1.0.0',
        tags: ['structured', 'evidence-based'],
        root: {
            type: 'peer_review',
            id: 'constrained-main',
            author: { nodeId: 'primary', role: 'pro', label: 'Primary' },
            reviewers: [
                { nodeId: 'reviewer1', role: 'neutral', label: 'Reviewer 1' },
                { nodeId: 'reviewer2', role: 'neutral', label: 'Reviewer 2' },
            ],
            criteria: ['correctness', 'completeness'],
            maxRevisions: 3,
        },
    },
    {
        id: 'builtin.moderated',
        name: 'Moderated Debate',
        description: 'Debate with a neutral moderator controlling flow and enforcing rules',
        version: '1.0.0',
        tags: ['structured', 'controlled'],
        parameters: [
            {
                name: 'moderatorStyle',
                label: 'Moderator Style',
                type: 'enum',
                default: 'neutral',
                options: ['neutral', 'active', 'minimal'],
            },
        ],
        root: {
            type: 'debate_graph',
            id: 'mod-main',
            agents: [
                { nodeId: 'moderator', role: 'neutral', label: 'Moderator' },
                { nodeId: 'proponent', role: 'pro', label: 'Proponent' },
                { nodeId: 'opponent', role: 'con', label: 'Opponent' },
            ],
            edges: [
                { from: 'moderator', to: 'proponent', type: 'sequential' },
                { from: 'moderator', to: 'opponent', type: 'sequential' },
                { from: 'proponent', to: 'moderator', type: 'sequential' },
                { from: 'opponent', to: 'moderator', type: 'sequential' },
            ],
            maxRounds: 6,
        },
    },
    {
        id: 'builtin.free_for_all',
        name: 'Free-for-All',
        description: 'Multiple agents debate simultaneously without turn ordering',
        version: '1.0.0',
        tags: ['dynamic', 'chaotic'],
        root: {
            type: 'debate_graph',
            id: 'ffa-main',
            agents: [
                { nodeId: 'agent_a', role: 'pro', label: 'Agent A' },
                { nodeId: 'agent_b', role: 'con', label: 'Agent B' },
                { nodeId: 'agent_c', role: 'neutral', label: 'Agent C' },
            ],
            edges: [
                { from: 'agent_a', to: 'agent_b', type: 'broadcast' },
                { from: 'agent_a', to: 'agent_c', type: 'broadcast' },
                { from: 'agent_b', to: 'agent_a', type: 'broadcast' },
                { from: 'agent_b', to: 'agent_c', type: 'broadcast' },
                { from: 'agent_c', to: 'agent_a', type: 'broadcast' },
                { from: 'agent_c', to: 'agent_b', type: 'broadcast' },
            ],
            maxRounds: 8,
        },
    },
    {
        id: 'builtin.jury_trial',
        name: 'Jury Trial',
        description: 'Adversarial format with prosecution, defense, witnesses, and jury',
        version: '1.0.0',
        tags: ['adversarial', 'structured'],
        parameters: [
            {
                name: 'jurySize',
                label: 'Jury Size',
                type: 'number',
                default: 3,
                min: 1,
                max: 12,
            },
        ],
        root: {
            type: 'debate_graph',
            id: 'jt-main',
            agents: [
                { nodeId: 'prosecution', role: 'pro', label: 'Prosecution' },
                { nodeId: 'defense', role: 'con', label: 'Defense' },
                { nodeId: 'judge', role: 'neutral', label: 'Judge' },
            ],
            edges: [
                { from: 'prosecution', to: 'judge', type: 'sequential' },
                { from: 'defense', to: 'judge', type: 'sequential' },
                { from: 'judge', to: 'prosecution', type: 'sequential' },
                { from: 'judge', to: 'defense', type: 'sequential' },
            ],
            maxRounds: 5,
        },
    },
    {
        id: 'builtin.brainstorming',
        name: 'Brainstorming',
        description: 'Free-form idea generation without critique, followed by clustering',
        version: '1.0.0',
        tags: ['creative', 'divergent'],
        root: {
            type: 'sequence',
            id: 'bs-main',
            steps: [
                {
                    label: 'Generate Ideas',
                    description: 'Agents propose ideas freely without critique',
                    primitive: {
                        type: 'debate_graph',
                        id: 'bs-generate',
                        agents: [
                            { nodeId: 'facilitator', role: 'neutral', label: 'Facilitator' },
                            { nodeId: 'contributor1', role: 'pro', label: 'Contributor 1' },
                            { nodeId: 'contributor2', role: 'pro', label: 'Contributor 2' },
                        ],
                        edges: [
                            { from: 'contributor1', to: 'facilitator', type: 'broadcast' },
                            { from: 'contributor2', to: 'facilitator', type: 'broadcast' },
                        ],
                        maxRounds: 2,
                    },
                },
                {
                    label: 'Cluster & Prioritize',
                    description: 'Group similar ideas and vote on top candidates',
                    primitive: {
                        type: 'voting',
                        id: 'bs-vote',
                        participants: ['facilitator', 'contributor1', 'contributor2'],
                        tally: 'ranked_choice',
                        maxRounds: 1,
                    },
                },
            ],
        },
    },
    {
        id: 'builtin.delphi',
        name: 'Delphi Method',
        description: 'Iterative anonymous consensus-building with controlled feedback',
        version: '1.0.0',
        tags: ['consensus', 'structured'],
        root: {
            type: 'debate_graph',
            id: 'delphi-main',
            agents: [
                { nodeId: 'coordinator', role: 'neutral', label: 'Coordinator' },
                { nodeId: 'panelist1', role: 'pro', label: 'Panelist 1' },
                { nodeId: 'panelist2', role: 'con', label: 'Panelist 2' },
            ],
            edges: [
                { from: 'coordinator', to: 'panelist1', type: 'sequential' },
                { from: 'coordinator', to: 'panelist2', type: 'sequential' },
                { from: 'panelist1', to: 'coordinator', type: 'sequential' },
                { from: 'panelist2', to: 'coordinator', type: 'sequential' },
            ],
            maxRounds: 4,
            convergenceThreshold: 0.8,
        },
    },
    {
        id: 'builtin.debate_athon',
        name: 'Debate-athon',
        description: 'Extended marathon format with multiple rounds, breaks, and endurance scoring',
        version: '1.0.0',
        tags: ['endurance', 'extended'],
        parameters: [
            {
                name: 'totalRounds',
                label: 'Total Rounds',
                type: 'number',
                default: 12,
                min: 6,
                max: 30,
            },
        ],
        root: {
            type: 'sequence',
            id: 'da-main',
            steps: [
                {
                    label: 'Opening Statements',
                    primitive: {
                        type: 'debate_graph',
                        id: 'da-opening',
                        agents: [
                            { nodeId: 'speaker1', role: 'pro', label: 'Speaker 1' },
                            { nodeId: 'speaker2', role: 'con', label: 'Speaker 2' },
                        ],
                        edges: [
                            { from: 'speaker1', to: 'speaker2', type: 'sequential' },
                            { from: 'speaker2', to: 'speaker1', type: 'sequential' },
                        ],
                        maxRounds: 1,
                    },
                },
                {
                    label: 'Main Argumentation',
                    primitive: {
                        type: 'debate_graph',
                        id: 'da-main-args',
                        agents: [
                            { nodeId: 'speaker1', role: 'pro', label: 'Speaker 1' },
                            { nodeId: 'speaker2', role: 'con', label: 'Speaker 2' },
                            { nodeId: 'moderator', role: 'neutral', label: 'Moderator' },
                        ],
                        edges: [
                            { from: 'speaker1', to: 'speaker2', type: 'challenge' },
                            { from: 'speaker2', to: 'speaker1', type: 'challenge' },
                            { from: 'moderator', to: 'speaker1', type: 'sequential' },
                            { from: 'moderator', to: 'speaker2', type: 'sequential' },
                        ],
                        maxRounds: 10,
                    },
                },
                {
                    label: 'Final Arguments & Scoring',
                    primitive: {
                        type: 'voting',
                        id: 'da-vote',
                        participants: ['speaker1', 'speaker2', 'moderator'],
                        tally: 'majority',
                        maxRounds: 1,
                    },
                },
            ],
        },
    },
    {
        id: 'builtin.meta_debate',
        name: 'Meta-Debate',
        description: 'Debate about the debate itself — rules, framing, methodology',
        version: '1.0.0',
        tags: ['meta', 'reflective'],
        root: {
            type: 'debate_graph',
            id: 'md-main',
            agents: [
                { nodeId: 'meta_analyst', role: 'neutral', label: 'Meta Analyst' },
                { nodeId: 'participant1', role: 'pro', label: 'Participant 1' },
                { nodeId: 'participant2', role: 'con', label: 'Participant 2' },
            ],
            edges: [
                { from: 'meta_analyst', to: 'participant1', type: 'sequential' },
                { from: 'meta_analyst', to: 'participant2', type: 'sequential' },
                { from: 'participant1', to: 'meta_analyst', type: 'sequential' },
                { from: 'participant2', to: 'meta_analyst', type: 'sequential' },
            ],
            maxRounds: 3,
        },
    },
    {
        id: 'builtin.autopsy',
        name: 'Post-Mortem / Autopsy',
        description: 'Retrospective analysis of a past event, decision, or failure',
        version: '1.0.0',
        tags: ['analysis', 'retrospective'],
        parameters: [
            {
                name: 'focusArea',
                label: 'Focus Area',
                type: 'enum',
                default: 'causes',
                options: ['causes', 'prevention', 'lessons', 'comprehensive'],
            },
        ],
        root: {
            type: 'debate_graph',
            id: 'autopsy-main',
            agents: [
                { nodeId: 'facilitator', role: 'neutral', label: 'Facilitator' },
                { nodeId: 'analyst1', role: 'pro', label: 'Analyst 1' },
                { nodeId: 'analyst2', role: 'con', label: 'Analyst 2' },
            ],
            edges: [
                { from: 'facilitator', to: 'analyst1', type: 'sequential' },
                { from: 'facilitator', to: 'analyst2', type: 'sequential' },
                { from: 'analyst1', to: 'facilitator', type: 'sequential' },
                { from: 'analyst2', to: 'facilitator', type: 'sequential' },
            ],
            maxRounds: 4,
        },
    },
    {
        id: 'builtin.simulated_negotiation',
        name: 'Simulated Negotiation',
        description: 'Role-play negotiation between parties with competing interests',
        version: '1.0.0',
        tags: ['negotiation', 'role-play'],
        parameters: [
            {
                name: 'negotiatorCount',
                label: 'Number of Negotiators',
                type: 'number',
                default: 2,
                min: 2,
                max: 6,
            },
        ],
        root: {
            type: 'debate_graph',
            id: 'neg-main',
            agents: [
                { nodeId: 'mediator', role: 'neutral', label: 'Mediator' },
                { nodeId: 'party_a', role: 'pro', label: 'Party A' },
                { nodeId: 'party_b', role: 'con', label: 'Party B' },
            ],
            edges: [
                { from: 'mediator', to: 'party_a', type: 'sequential' },
                { from: 'mediator', to: 'party_b', type: 'sequential' },
                { from: 'party_a', to: 'party_b', type: 'sequential' },
                { from: 'party_b', to: 'party_a', type: 'sequential' },
            ],
            maxRounds: 6,
        },
    },
    {
        id: 'builtin.premortem',
        name: 'Premortem',
        description: 'Assume a project has failed and work backwards to identify what went wrong',
        version: '1.0.0',
        tags: ['risk', 'proactive'],
        root: {
            type: 'sequence',
            id: 'pm-main',
            steps: [
                {
                    label: 'Imagine Failure',
                    description: 'Agents describe a detailed failure scenario',
                    primitive: {
                        type: 'debate_graph',
                        id: 'pm-failure',
                        agents: [
                            { nodeId: 'strategist', role: 'pro', label: 'Strategist' },
                            { nodeId: 'skeptic', role: 'con', label: 'Skeptic' },
                        ],
                        edges: [
                            { from: 'strategist', to: 'skeptic', type: 'sequential' },
                            { from: 'skeptic', to: 'strategist', type: 'sequential' },
                        ],
                        maxRounds: 2,
                    },
                },
                {
                    label: 'Identify Causes',
                    description: 'Root cause analysis of the imagined failure',
                    primitive: {
                        type: 'peer_review',
                        id: 'pm-causes',
                        author: { nodeId: 'strategist', role: 'pro', label: 'Strategist' },
                        reviewers: [{ nodeId: 'skeptic', role: 'con', label: 'Skeptic' }],
                        criteria: ['correctness', 'completeness'],
                        maxRevisions: 2,
                    },
                },
                {
                    label: 'Prevention Plan',
                    description: 'Propose preventive measures',
                    primitive: {
                        type: 'debate_graph',
                        id: 'pm-prevent',
                        agents: [
                            { nodeId: 'strategist', role: 'pro', label: 'Strategist' },
                            { nodeId: 'skeptic', role: 'con', label: 'Skeptic' },
                        ],
                        edges: [
                            { from: 'strategist', to: 'skeptic', type: 'sequential' },
                            { from: 'skeptic', to: 'strategist', type: 'sequential' },
                        ],
                        maxRounds: 2,
                    },
                },
            ],
        },
    },
    {
        id: 'builtin.red_teaming',
        name: 'Red Teaming',
        description: 'Adversarial testing where one team attacks and another defends',
        version: '1.0.0',
        tags: ['adversarial', 'security'],
        root: {
            type: 'debate_graph',
            id: 'rt-main',
            agents: [
                { nodeId: 'red_team', role: 'con', label: 'Red Team' },
                { nodeId: 'blue_team', role: 'pro', label: 'Blue Team' },
            ],
            edges: [
                { from: 'red_team', to: 'blue_team', type: 'challenge' },
                { from: 'blue_team', to: 'red_team', type: 'refine' },
            ],
            maxRounds: 5,
        },
    },
    {
        id: 'builtin.rhetorical_triangle',
        name: 'Rhetorical Triangle',
        description: 'Analyze arguments through ethos, pathos, and logos lenses',
        version: '1.0.0',
        tags: ['analytical', 'rhetoric'],
        root: {
            type: 'debate_graph',
            id: 'rht-main',
            agents: [
                { nodeId: 'ethos', role: 'pro', label: 'Ethos (Credibility)' },
                { nodeId: 'pathos', role: 'con', label: 'Pathos (Emotion)' },
                { nodeId: 'logos', role: 'neutral', label: 'Logos (Logic)' },
            ],
            edges: [
                { from: 'ethos', to: 'pathos', type: 'challenge' },
                { from: 'pathos', to: 'logos', type: 'challenge' },
                { from: 'logos', to: 'ethos', type: 'challenge' },
            ],
            maxRounds: 4,
        },
    },
    {
        id: 'builtin.evidence_based_policy',
        name: 'Evidence-Based Policy Debate',
        description: 'Policy debate requiring cited evidence for each claim',
        version: '1.0.0',
        tags: ['policy', 'evidence-based'],
        parameters: [
            {
                name: 'evidenceLevel',
                label: 'Evidence Standard',
                type: 'enum',
                default: 'high',
                options: ['low', 'medium', 'high', 'systematic_review'],
            },
        ],
        root: {
            type: 'debate_graph',
            id: 'ebp-main',
            agents: [
                { nodeId: 'proponent', role: 'pro', label: 'Proponent' },
                { nodeId: 'opponent', role: 'con', label: 'Opponent' },
                { nodeId: 'evidencer', role: 'neutral', label: 'Evidence Analyst' },
            ],
            edges: [
                { from: 'proponent', to: 'evidencer', type: 'sequential' },
                { from: 'opponent', to: 'evidencer', type: 'sequential' },
                { from: 'evidencer', to: 'proponent', type: 'sequential' },
                { from: 'evidencer', to: 'opponent', type: 'sequential' },
            ],
            maxRounds: 5,
        },
    },
    {
        id: 'builtin.principle_based_negotiation',
        name: 'Principle-Based Negotiation',
        description: 'Harvard-style principled negotiation focusing on interests not positions',
        version: '1.0.0',
        tags: ['negotiation', 'principled'],
        root: {
            type: 'debate_graph',
            id: 'pbn-main',
            agents: [
                { nodeId: 'negotiator_a', role: 'pro', label: 'Negotiator A' },
                { nodeId: 'negotiator_b', role: 'con', label: 'Negotiator B' },
                { nodeId: 'facilitator', role: 'neutral', label: 'Facilitator' },
            ],
            edges: [
                { from: 'facilitator', to: 'negotiator_a', type: 'sequential' },
                { from: 'facilitator', to: 'negotiator_b', type: 'sequential' },
                { from: 'negotiator_a', to: 'negotiator_b', type: 'sequential' },
                { from: 'negotiator_b', to: 'negotiator_a', type: 'sequential' },
            ],
            maxRounds: 5,
        },
    },
    {
        id: 'builtin.uncertainty_quantification',
        name: 'Uncertainty Quantification',
        description: 'Systematically identify and quantify uncertainties in arguments',
        version: '1.0.0',
        tags: ['analytical', 'uncertainty'],
        root: {
            type: 'debate_graph',
            id: 'uq-main',
            agents: [
                { nodeId: 'optimist', role: 'pro', label: 'Optimist' },
                { nodeId: 'pessimist', role: 'con', label: 'Pessimist' },
                { nodeId: 'analyst', role: 'neutral', label: 'Uncertainty Analyst' },
            ],
            edges: [
                { from: 'optimist', to: 'analyst', type: 'sequential' },
                { from: 'pessimist', to: 'analyst', type: 'sequential' },
                { from: 'analyst', to: 'optimist', type: 'refine' },
                { from: 'analyst', to: 'pessimist', type: 'refine' },
            ],
            maxRounds: 4,
        },
    },
    {
        id: 'builtin.multi_criteria',
        name: 'Multi-Criteria Decision Analysis',
        description: 'Evaluate options against multiple weighted criteria',
        version: '1.0.0',
        tags: ['decision', 'analytical'],
        parameters: [
            {
                name: 'criteriaCount',
                label: 'Number of Criteria',
                type: 'number',
                default: 4,
                min: 2,
                max: 8,
            },
        ],
        root: {
            type: 'debate_graph',
            id: 'mcda-main',
            agents: [
                { nodeId: 'evaluator_a', role: 'pro', label: 'Evaluator A' },
                { nodeId: 'evaluator_b', role: 'con', label: 'Evaluator B' },
                { nodeId: 'weight_assigner', role: 'neutral', label: 'Weight Assigner' },
            ],
            edges: [
                { from: 'evaluator_a', to: 'weight_assigner', type: 'sequential' },
                { from: 'evaluator_b', to: 'weight_assigner', type: 'sequential' },
                { from: 'weight_assigner', to: 'evaluator_a', type: 'sequential' },
                { from: 'weight_assigner', to: 'evaluator_b', type: 'sequential' },
            ],
            maxRounds: 4,
        },
    },
    {
        id: 'builtin.stakeholder_mapping',
        name: 'Stakeholder Mapping',
        description: 'Identify and analyze stakeholders, their interests, and influence',
        version: '1.0.0',
        tags: ['analysis', 'strategic'],
        root: {
            type: 'sequence',
            id: 'sm-main',
            steps: [
                {
                    label: 'Identify Stakeholders',
                    primitive: {
                        type: 'debate_graph',
                        id: 'sm-identify',
                        agents: [
                            { nodeId: 'analyst', role: 'neutral', label: 'Analyst' },
                            { nodeId: 'domain_expert', role: 'pro', label: 'Domain Expert' },
                        ],
                        edges: [
                            { from: 'analyst', to: 'domain_expert', type: 'sequential' },
                            { from: 'domain_expert', to: 'analyst', type: 'sequential' },
                        ],
                        maxRounds: 2,
                    },
                },
                {
                    label: 'Map Interests',
                    primitive: {
                        type: 'debate_graph',
                        id: 'sm-interests',
                        agents: [
                            { nodeId: 'analyst', role: 'neutral', label: 'Analyst' },
                            { nodeId: 'domain_expert', role: 'pro', label: 'Domain Expert' },
                            { nodeId: 'critic', role: 'con', label: 'Critic' },
                        ],
                        edges: [
                            { from: 'analyst', to: 'domain_expert', type: 'sequential' },
                            { from: 'analyst', to: 'critic', type: 'sequential' },
                            { from: 'domain_expert', to: 'analyst', type: 'sequential' },
                            { from: 'critic', to: 'analyst', type: 'sequential' },
                        ],
                        maxRounds: 2,
                    },
                },
                {
                    label: 'Assess Influence',
                    primitive: {
                        type: 'voting',
                        id: 'sm-influence',
                        participants: ['analyst', 'domain_expert', 'critic'],
                        tally: 'ranked_choice',
                        maxRounds: 1,
                    },
                },
            ],
        },
    },
    {
        id: 'builtin.cross_examination',
        name: 'Cross-Examination',
        description: 'Intense back-and-forth questioning between two parties',
        version: '1.0.0',
        tags: ['adversarial', 'intense'],
        root: {
            type: 'debate_graph',
            id: 'ce-main',
            agents: [
                { nodeId: 'examiner', role: 'con', label: 'Examiner' },
                { nodeId: 'witness', role: 'pro', label: 'Witness' },
            ],
            edges: [
                { from: 'examiner', to: 'witness', type: 'challenge' },
                { from: 'witness', to: 'examiner', type: 'refine' },
            ],
            maxRounds: 8,
            convergenceThreshold: 0.9,
        },
    },
    {
        id: 'builtin.trial',
        name: 'Trial by Argument',
        description: 'Full trial format with opening, evidence, witnesses, closing, and verdict',
        version: '1.0.0',
        tags: ['adversarial', 'comprehensive'],
        root: {
            type: 'sequence',
            id: 'trial-main',
            steps: [
                {
                    label: 'Opening Statements',
                    primitive: {
                        type: 'debate_graph',
                        id: 'trial-opening',
                        agents: [
                            { nodeId: 'prosecution', role: 'pro', label: 'Prosecution' },
                            { nodeId: 'defense', role: 'con', label: 'Defense' },
                        ],
                        edges: [
                            { from: 'prosecution', to: 'defense', type: 'sequential' },
                            { from: 'defense', to: 'prosecution', type: 'sequential' },
                        ],
                        maxRounds: 1,
                    },
                },
                {
                    label: 'Evidence Presentation',
                    primitive: {
                        type: 'debate_graph',
                        id: 'trial-evidence',
                        agents: [
                            { nodeId: 'prosecution', role: 'pro', label: 'Prosecution' },
                            { nodeId: 'defense', role: 'con', label: 'Defense' },
                            { nodeId: 'judge', role: 'neutral', label: 'Judge' },
                        ],
                        edges: [
                            { from: 'prosecution', to: 'judge', type: 'sequential' },
                            { from: 'defense', to: 'judge', type: 'sequential' },
                            { from: 'judge', to: 'prosecution', type: 'sequential' },
                            { from: 'judge', to: 'defense', type: 'sequential' },
                        ],
                        maxRounds: 3,
                    },
                },
                {
                    label: 'Closing Arguments',
                    primitive: {
                        type: 'debate_graph',
                        id: 'trial-closing',
                        agents: [
                            { nodeId: 'prosecution', role: 'pro', label: 'Prosecution' },
                            { nodeId: 'defense', role: 'con', label: 'Defense' },
                        ],
                        edges: [
                            { from: 'prosecution', to: 'defense', type: 'sequential' },
                            { from: 'defense', to: 'prosecution', type: 'sequential' },
                        ],
                        maxRounds: 1,
                    },
                },
                {
                    label: 'Verdict',
                    primitive: {
                        type: 'voting',
                        id: 'trial-verdict',
                        participants: ['judge'],
                        tally: 'majority',
                        maxRounds: 1,
                    },
                },
            ],
        },
    },
    {
        id: 'builtin.parliamentary',
        name: 'Parliamentary Debate',
        description:
            'Formal debate with government and opposition teams following parliamentary procedure',
        version: '1.0.0',
        tags: ['formal', 'team-based'],
        root: {
            type: 'debate_graph',
            id: 'parl-main',
            agents: [
                { nodeId: 'speaker', role: 'neutral', label: 'Speaker of the House' },
                { nodeId: 'government', role: 'pro', label: 'Government' },
                { nodeId: 'opposition', role: 'con', label: 'Opposition' },
            ],
            edges: [
                { from: 'speaker', to: 'government', type: 'sequential' },
                { from: 'speaker', to: 'opposition', type: 'sequential' },
                { from: 'government', to: 'opposition', type: 'challenge' },
                { from: 'opposition', to: 'government', type: 'challenge' },
            ],
            maxRounds: 6,
        },
    },
    {
        id: 'builtin.oxford_union',
        name: 'Oxford Union Debate',
        description:
            'Traditional Oxford Union format with proposition, opposition, and floor votes',
        version: '1.0.0',
        tags: ['formal', 'traditional'],
        root: {
            type: 'sequence',
            id: 'oxford-main',
            steps: [
                {
                    label: 'Proposition Speech',
                    primitive: {
                        type: 'debate_graph',
                        id: 'oxford-prop',
                        agents: [
                            { nodeId: 'proposer', role: 'pro', label: 'Proposer' },
                            { nodeId: 'seconder', role: 'pro', label: 'Seconder' },
                        ],
                        edges: [{ from: 'proposer', to: 'seconder', type: 'sequential' }],
                        maxRounds: 1,
                    },
                },
                {
                    label: 'Opposition Speech',
                    primitive: {
                        type: 'debate_graph',
                        id: 'oxford-opp',
                        agents: [
                            { nodeId: 'opposer', role: 'con', label: 'Opposer' },
                            { nodeId: 'second_opposer', role: 'con', label: 'Second Opposer' },
                        ],
                        edges: [{ from: 'opposer', to: 'second_opposer', type: 'sequential' }],
                        maxRounds: 1,
                    },
                },
                {
                    label: 'Floor Debate',
                    primitive: {
                        type: 'debate_graph',
                        id: 'oxford-floor',
                        agents: [
                            { nodeId: 'proposer', role: 'pro', label: 'Proposer' },
                            { nodeId: 'opposer', role: 'con', label: 'Opposer' },
                            { nodeId: 'floor_member', role: 'neutral', label: 'Floor Member' },
                        ],
                        edges: [
                            { from: 'floor_member', to: 'proposer', type: 'sequential' },
                            { from: 'floor_member', to: 'opposer', type: 'sequential' },
                        ],
                        maxRounds: 3,
                    },
                },
                {
                    label: 'Vote',
                    primitive: {
                        type: 'voting',
                        id: 'oxford-vote',
                        participants: ['proposer', 'opposer', 'floor_member'],
                        tally: 'majority',
                        maxRounds: 1,
                    },
                },
            ],
        },
    },
    {
        id: 'builtin.lincoln_douglas',
        name: 'Lincoln-Douglas Debate',
        description: 'Values-based one-on-one debate with structured case construction',
        version: '1.0.0',
        tags: ['values', 'one-on-one'],
        root: {
            type: 'debate_graph',
            id: 'ld-main',
            agents: [
                { nodeId: 'affirmative', role: 'pro', label: 'Affirmative' },
                { nodeId: 'negative', role: 'con', label: 'Negative' },
            ],
            edges: [
                { from: 'affirmative', to: 'negative', type: 'sequential' },
                { from: 'negative', to: 'affirmative', type: 'challenge' },
            ],
            maxRounds: 5,
        },
    },
    {
        id: 'builtin.spontaneous_argumentation',
        name: 'Spontaneous Argumentation',
        description: 'Impromptu arguments with minimal preparation, testing quick thinking',
        version: '1.0.0',
        tags: ['improvisation', 'quick'],
        root: {
            type: 'debate_graph',
            id: 'sa-main',
            agents: [
                { nodeId: 'speaker_a', role: 'pro', label: 'Speaker A' },
                { nodeId: 'speaker_b', role: 'con', label: 'Speaker B' },
            ],
            edges: [
                { from: 'speaker_a', to: 'speaker_b', type: 'challenge' },
                { from: 'speaker_b', to: 'speaker_a', type: 'challenge' },
            ],
            maxRounds: 4,
        },
    },
    {
        id: 'builtin.asynchronous_marathon',
        name: 'Asynchronous Marathon',
        description: 'Extended multi-day debate where agents respond at their own pace',
        version: '1.0.0',
        tags: ['asynchronous', 'extended'],
        root: {
            type: 'sequence',
            id: 'am-main',
            steps: [
                {
                    label: 'Round 1: Opening',
                    primitive: {
                        type: 'debate_graph',
                        id: 'am-r1',
                        agents: [
                            { nodeId: 'participant_a', role: 'pro', label: 'Participant A' },
                            { nodeId: 'participant_b', role: 'con', label: 'Participant B' },
                        ],
                        edges: [{ from: 'participant_a', to: 'participant_b', type: 'sequential' }],
                        maxRounds: 1,
                    },
                },
                {
                    label: 'Round 2: Rebuttal',
                    primitive: {
                        type: 'debate_graph',
                        id: 'am-r2',
                        agents: [
                            { nodeId: 'participant_a', role: 'pro', label: 'Participant A' },
                            { nodeId: 'participant_b', role: 'con', label: 'Participant B' },
                        ],
                        edges: [{ from: 'participant_b', to: 'participant_a', type: 'challenge' }],
                        maxRounds: 1,
                    },
                },
                {
                    label: 'Round 3: Response',
                    primitive: {
                        type: 'debate_graph',
                        id: 'am-r3',
                        agents: [
                            { nodeId: 'participant_a', role: 'pro', label: 'Participant A' },
                            { nodeId: 'participant_b', role: 'con', label: 'Participant B' },
                        ],
                        edges: [{ from: 'participant_a', to: 'participant_b', type: 'refine' }],
                        maxRounds: 1,
                    },
                },
            ],
        },
    },
    {
        id: 'builtin.flash_debate',
        name: 'Flash Debate',
        description: 'Ultra-fast debate with very short response times and limited characters',
        version: '1.0.0',
        tags: ['fast', 'intense'],
        root: {
            type: 'debate_graph',
            id: 'fd-main',
            agents: [
                { nodeId: 'flash_a', role: 'pro', label: 'Flash A' },
                { nodeId: 'flash_b', role: 'con', label: 'Flash B' },
            ],
            edges: [
                { from: 'flash_a', to: 'flash_b', type: 'challenge' },
                { from: 'flash_b', to: 'flash_a', type: 'challenge' },
            ],
            maxRounds: 3,
        },
    },
    {
        id: 'builtin.collaborative_consensus',
        name: 'Collaborative Consensus',
        description:
            'Non-adversarial format focused on finding common ground and shared understanding',
        version: '1.0.0',
        tags: ['collaborative', 'consensus'],
        root: {
            type: 'debate_graph',
            id: 'cc-main',
            agents: [
                { nodeId: 'facilitator', role: 'neutral', label: 'Facilitator' },
                { nodeId: 'contributor_a', role: 'pro', label: 'Contributor A' },
                { nodeId: 'contributor_b', role: 'con', label: 'Contributor B' },
            ],
            edges: [
                { from: 'facilitator', to: 'contributor_a', type: 'sequential' },
                { from: 'facilitator', to: 'contributor_b', type: 'sequential' },
                { from: 'contributor_a', to: 'contributor_b', type: 'refine' },
                { from: 'contributor_b', to: 'contributor_a', type: 'refine' },
            ],
            maxRounds: 4,
            convergenceThreshold: 0.9,
        },
    },
    {
        id: 'builtin.scenario_testing',
        name: 'Scenario Testing',
        description: 'Test assumptions by exploring multiple hypothetical scenarios',
        version: '1.0.0',
        tags: ['strategic', 'exploratory'],
        root: {
            type: 'sequence',
            id: 'st-main',
            steps: [
                {
                    label: 'Define Scenarios',
                    primitive: {
                        type: 'debate_graph',
                        id: 'st-define',
                        agents: [
                            { nodeId: 'strategist', role: 'neutral', label: 'Strategist' },
                            { nodeId: 'optimist', role: 'pro', label: 'Optimist' },
                            { nodeId: 'pessimist', role: 'con', label: 'Pessimist' },
                        ],
                        edges: [
                            { from: 'strategist', to: 'optimist', type: 'sequential' },
                            { from: 'strategist', to: 'pessimist', type: 'sequential' },
                        ],
                        maxRounds: 1,
                    },
                },
                {
                    label: 'Test Scenarios',
                    primitive: {
                        type: 'debate_graph',
                        id: 'st-test',
                        agents: [
                            { nodeId: 'strategist', role: 'neutral', label: 'Strategist' },
                            { nodeId: 'optimist', role: 'pro', label: 'Optimist' },
                            { nodeId: 'pessimist', role: 'con', label: 'Pessimist' },
                        ],
                        edges: [
                            { from: 'optimist', to: 'strategist', type: 'sequential' },
                            { from: 'pessimist', to: 'strategist', type: 'sequential' },
                        ],
                        maxRounds: 3,
                    },
                },
                {
                    label: 'Synthesize Findings',
                    primitive: {
                        type: 'peer_review',
                        id: 'st-synth',
                        author: { nodeId: 'strategist', role: 'neutral', label: 'Strategist' },
                        reviewers: [
                            { nodeId: 'optimist', role: 'pro', label: 'Optimist' },
                            { nodeId: 'pessimist', role: 'con', label: 'Pessimist' },
                        ],
                        criteria: ['correctness', 'completeness'],
                        maxRevisions: 2,
                    },
                },
            ],
        },
    },
    {
        id: 'builtin.hypothesis_testing',
        name: 'Hypothesis Testing',
        description:
            'Scientific method approach: hypothesis, test, evidence evaluation, conclusion',
        version: '1.0.0',
        tags: ['scientific', 'rigorous'],
        root: {
            type: 'sequence',
            id: 'ht-main',
            steps: [
                {
                    label: 'Formulate Hypothesis',
                    primitive: {
                        type: 'debate_graph',
                        id: 'ht-formulate',
                        agents: [
                            { nodeId: 'scientist', role: 'neutral', label: 'Scientist' },
                            { nodeId: 'skeptic', role: 'con', label: 'Skeptic' },
                        ],
                        edges: [
                            { from: 'scientist', to: 'skeptic', type: 'sequential' },
                            { from: 'skeptic', to: 'scientist', type: 'challenge' },
                        ],
                        maxRounds: 2,
                    },
                },
                {
                    label: 'Evaluate Evidence',
                    primitive: {
                        type: 'debate_graph',
                        id: 'ht-evidence',
                        agents: [
                            { nodeId: 'scientist', role: 'pro', label: 'Scientist' },
                            { nodeId: 'skeptic', role: 'con', label: 'Skeptic' },
                            { nodeId: 'reviewer', role: 'neutral', label: 'Reviewer' },
                        ],
                        edges: [
                            { from: 'scientist', to: 'reviewer', type: 'sequential' },
                            { from: 'skeptic', to: 'reviewer', type: 'sequential' },
                            { from: 'reviewer', to: 'scientist', type: 'refine' },
                            { from: 'reviewer', to: 'skeptic', type: 'refine' },
                        ],
                        maxRounds: 3,
                    },
                },
                {
                    label: 'Draw Conclusion',
                    primitive: {
                        type: 'voting',
                        id: 'ht-conclusion',
                        participants: ['scientist', 'skeptic', 'reviewer'],
                        tally: 'consensus',
                        maxRounds: 1,
                    },
                },
            ],
        },
    },
    {
        id: 'builtin.contest_mode',
        name: 'Contest Mode',
        description: 'Competitive format with judges scoring each round, winner declared at end',
        version: '1.0.0',
        tags: ['competitive', 'scored'],
        parameters: [
            {
                name: 'pointsToWin',
                label: 'Points to Win',
                type: 'number',
                default: 3,
                min: 1,
                max: 10,
            },
        ],
        root: {
            type: 'sequence',
            id: 'contest-main',
            steps: [
                {
                    label: 'Round Robin Rounds',
                    primitive: {
                        type: 'debate_graph',
                        id: 'contest-rounds',
                        agents: [
                            { nodeId: 'competitor_a', role: 'pro', label: 'Competitor A' },
                            { nodeId: 'competitor_b', role: 'con', label: 'Competitor B' },
                        ],
                        edges: [
                            { from: 'competitor_a', to: 'competitor_b', type: 'challenge' },
                            { from: 'competitor_b', to: 'competitor_a', type: 'challenge' },
                        ],
                        maxRounds: 5,
                    },
                },
                {
                    label: 'Final Verdict',
                    primitive: {
                        type: 'voting',
                        id: 'contest-vote',
                        participants: ['judge'],
                        tally: 'majority',
                        maxRounds: 1,
                    },
                },
            ],
        },
    },
];
