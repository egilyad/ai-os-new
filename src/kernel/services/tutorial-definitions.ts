import type { Tutorial } from '../contracts/tutorial';

export const BUILTIN_TUTORIALS: Tutorial[] = [
    {
        id: 'welcome',
        title: 'Welcome to SuperAgents OS',
        description: 'Get familiar with the interface, navigation, and core concepts',
        icon: '\uD83D\uDE80',
        estimatedMinutes: 5,
        category: 'getting_started',
        required: true,
        steps: [
            {
                id: 'welcome-1',
                title: 'Dashboard Overview',
                description:
                    "The Dashboard shows your system's pulse — active providers, recent debates, and quick actions.",
                targetSelector: '[data-tour="dashboard"]',
                position: 'center',
                route: '/',
            },
            {
                id: 'welcome-2',
                title: 'Sidebar Navigation',
                description:
                    'Use the sidebar to navigate between sections. Sections collapse for a cleaner view.',
                targetSelector: '[data-tour="sidebar"]',
                position: 'right',
                route: '/',
            },
            {
                id: 'welcome-3',
                title: 'Command Palette',
                description: 'Press Cmd+K to quickly search and navigate anywhere in the system.',
                route: '/',
            },
            {
                id: 'welcome-4',
                title: 'Your First Provider',
                description:
                    'Add an API key to connect with LLM providers like Groq, Gemini, or OpenRouter.',
                route: '/providers',
                action: 'Click "Add Key" in the Providers panel',
            },
        ],
    },
    {
        id: 'providers',
        title: 'Provider Mastery',
        description: 'Connect and manage your LLM providers',
        icon: '\u26A1',
        estimatedMinutes: 10,
        category: 'providers',
        required: true,
        steps: [
            {
                id: 'prov-1',
                title: 'Add Your First Key',
                description:
                    'Navigate to Providers → Keys and click "Add Key". Paste your API key and select the provider.',
                route: '/providers',
            },
            {
                id: 'prov-2',
                title: 'Run a Probe',
                description:
                    'Test your key by running a probe. This checks if the key works and measures latency.',
                route: '/providers',
                action: 'Click "Probe All" in the Health panel',
            },
            {
                id: 'prov-3',
                title: 'Configure Pools',
                description:
                    'Group your keys into pools for intelligent routing based on cost, speed, or reliability.',
                route: '/pools',
            },
            {
                id: 'prov-4',
                title: 'Set Up Routing',
                description:
                    'Configure routing rules — weighted, latency-based, or cost-optimized distribution.',
                route: '/routing',
            },
        ],
    },
    {
        id: 'first-debate',
        title: 'Your First Debate',
        description: 'Create, run, and analyze your first multi-agent debate',
        icon: '\uD83C\uDF96\uFE0F',
        estimatedMinutes: 15,
        category: 'debates',
        required: false,
        steps: [
            {
                id: 'deb-1',
                title: 'Open the Debate Arena',
                description:
                    'Navigate to the Debate section to access the arena where agents debate topics.',
                route: '/debate',
            },
            {
                id: 'deb-2',
                title: 'Choose a Topic',
                description:
                    "Enter a debate topic or select from suggested topics. Pick something you're curious about.",
                route: '/debate',
                action: 'Enter a topic in the field',
            },
            {
                id: 'deb-3',
                title: 'Select a Strategy',
                description:
                    'Choose from 32 debate strategies — from classic round-robin to Socratic method or trial format.',
                route: '/debate',
            },
            {
                id: 'deb-4',
                title: 'Run the Debate',
                description:
                    'Start the debate and watch as AI agents argue from different perspectives in real-time.',
                route: '/debate',
                action: 'Click "Start Debate"',
            },
            {
                id: 'deb-5',
                title: 'Review Results',
                description:
                    'After the debate, review metrics, consensus, and individual agent performance.',
                route: '/debate',
            },
        ],
    },
    {
        id: 'memory',
        title: 'Understanding Memory',
        description: 'Learn how the 7-store memory architecture works',
        icon: '\uD83E\uDDE0',
        estimatedMinutes: 8,
        category: 'memory',
        required: false,
        steps: [
            {
                id: 'mem-1',
                title: 'Memory Palace',
                description:
                    'The Memory Palace visualizes 7 stores — Working, Episodic, Semantic, Procedural, Emotional, Social, Spatial.',
                route: '/memory-palace',
            },
            {
                id: 'mem-2',
                title: 'Working Memory',
                description:
                    'Stores current session context. Volatile and cleared when the session ends.',
                route: '/memory-palace',
            },
            {
                id: 'mem-3',
                title: 'Episodic & Semantic',
                description:
                    'Episodic stores past interactions; Semantic stores facts and concepts. Both persist across sessions.',
                route: '/memory-palace',
            },
            {
                id: 'mem-4',
                title: 'Forgetting Curve',
                description:
                    'Memories decay over time. The forgetting curve shows retention rates and consolidation events.',
                route: '/memory-palace',
            },
        ],
    },
    {
        id: 'advanced',
        title: 'Power Features',
        description: 'Batch processing, workflows, security, and more',
        icon: '\uD83D\uDD25',
        estimatedMinutes: 20,
        category: 'advanced',
        required: false,
        steps: [
            {
                id: 'adv-1',
                title: 'Batch Processing',
                description:
                    'Run multiple prompts simultaneously across providers. Useful for testing and bulk operations.',
                route: '/batch',
            },
            {
                id: 'adv-2',
                title: 'Multi-step Workflows',
                description:
                    'Chain LLM calls with variable interpolation. Build automated pipelines.',
                route: '/workflows',
            },
            {
                id: 'adv-3',
                title: 'Prompt Security',
                description:
                    'Scan prompts for injection, PII leaks, and jailbreak attempts before sending.',
                route: '/security',
            },
            {
                id: 'adv-4',
                title: 'A/B Testing',
                description:
                    'Compare two providers/models side-by-side with the same prompt to evaluate quality and cost.',
                route: '/ab-testing',
            },
            {
                id: 'adv-5',
                title: 'Custom Metrics',
                description: 'Create custom dashboards to track the metrics that matter to you.',
                route: '/custom-metrics',
            },
        ],
    },
];
