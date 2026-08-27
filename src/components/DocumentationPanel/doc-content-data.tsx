import { Shield, Cpu, Brain, Puzzle, Activity, Terminal, FileJson, Database } from 'lucide-react';

export const GETTING_STARTED_STEPS = [
    {
        title: '1. Add Providers',
        text: 'Navigate to Providers and add API keys for OpenRouter, Gemini, Groq, NVIDIA, or custom endpoints. Keys are encrypted at rest in IndexedDB and never leave your browser.',
        icon: <Shield size={20} color="#10b981" />,
    },
    {
        title: '2. Configure Routing',
        text: 'In Settings, set your Default Chat Strategy. "Smart Auto-Routing" (UCB1) balances latency, cost, and reliability. Alternatives: broadcast (all providers), race (fastest wins), cost (cheapest first), and performance (lowest latency).',
        icon: <Cpu size={20} color="#3b82f6" />,
    },
    {
        title: '3. Memory & Semantic Search',
        text: 'Every cognitive step is automatically stored in the Vector Memory Mesh. The panel provides full-text search via Orama (offline BM25) and semantic search via Transformers.js with all-MiniLM-L6-v2 embeddings (384-dim). Toggle "Semantic" mode for intent-based retrieval.',
        icon: <Brain size={20} color="#a855f7" />,
    },
    {
        title: '4. SuperAgents',
        text: 'Use the Roles panel to define agent personas with system prompts, the Skills panel to register executable capabilities (code, API, DB), and the Tasks panel to trace multi-step cognitive workflows. Connectors integrate external data via MCP servers.',
        icon: <Puzzle size={20} color="#f59e0b" />,
    },
    {
        title: '5. Execute & Monitor',
        text: 'Chat or use the Terminal to kick off tasks. Watch traces in the Telemetry dashboard, agent statistics in the Agents panel, and deliberation heatmaps in the Hive topology view.',
        icon: <Activity size={20} color="#84cc16" />,
    },
];

interface ArchCardData {
    title: string;
    icon: React.ReactNode;
    border: string;
    text: string;
}
export const ARCH_CARDS: ArchCardData[] = [
    {
        title: 'Kernel Layer',
        icon: <Cpu size={24} color="#3b82f6" />,
        border: 'var(--accent)',
        text: 'SystemKernel (reducer-pattern state machine), EventBus (typed), DI Container, Bootstrap. Deep immutable state, ring buffer event log, composite event keys.',
    },
    {
        title: 'Services',
        icon: <Terminal size={24} color="#a855f7" />,
        border: '#a855f7',
        text: 'KeyService, RouterService (UCB1 bandit), MemoryService, ToolService, AdvisorService, RotationService. All services use ILifecycle (init\u2192start\u2192destroy) and ITransaction for atomic mutations.',
    },
    {
        title: 'Contracts & Types',
        icon: <FileJson size={24} color="#10b981" />,
        border: 'var(--success)',
        text: '32 contract interfaces (IKeyVault, IProviderAdapter, ILogger, ITransaction, IRotationService). 16 Zod schemas. All business logic lives in kernel \u2014 legacy src/services/ are thin Proxy wrappers.',
    },
    {
        title: 'Persistence',
        icon: <Database size={24} color="#f59e0b" />,
        border: 'var(--warning)',
        text: 'Dexie (IndexedDB) stores memories, keys, sessions, traces, roles, skills, connectors. localStorage for vault encryption keys. Schema versioning supports incremental migrations.',
    },
];

const borderRgb = (b: string) =>
    b === '#3b82f6'
        ? '59,130,246'
        : b === '#a855f7'
          ? '168,85,247'
          : b === '#10b981'
            ? '16,185,129'
            : '245,158,11';

export const ARCH_CARDS_RENDER = ARCH_CARDS.map((c) => ({
    ...c,
    bgRgb: borderRgb(c.border),
}));

export const KERNEL_SERVICES_LEFT = [
    { name: 'KeyService', text: 'Key CRUD, encryption, health, quotas, pools' },
    { name: 'RouterService', text: 'UCB1 bandit, SLA modes, fallback chains' },
    { name: 'RotationService', text: 'Auto key rotation, TTL, scheduling' },
    { name: 'MemoryService', text: 'BM25 + semantic search, Orama worker' },
    { name: 'ToolService', text: 'Script/API/DB tools, sandboxed execution' },
];

export const KERNEL_SERVICES_RIGHT = [
    { name: 'OrchestrationService', text: 'Topology-driven multi-node DAG execution' },
    { name: 'AdvisorService', text: 'Meta-agent for system optimization' },
    { name: 'PolicyService', text: 'Guardrails (latency, PII, cost)' },
    { name: 'HealthCheckService', text: 'Provider key liveness verification' },
    { name: 'MCPService', text: 'Model Context Protocol connections' },
];

interface ApiCardData {
    title: string;
    desc: string;
    code: string;
}
export const API_CARDS: ApiCardData[] = [
    {
        title: 'EventBus',
        desc: 'Global typed event system for inter-service communication.',
        code: "eventBus.on(event, callback) => unsubscribe\n      eventBus.emit(event, data)\n      eventBus.on('*', callback) // wildcard",
    },
    {
        title: 'Kernel',
        desc: 'System state machine with deep immutable state.',
        code: 'kernel.getState() => SystemState\n      kernel.transaction(fn) => Promise<void>\n      kernel.setSLAMode(mode, tx?) => void\n      kernel.setBaseWeights(w, tx?) => void',
    },
    {
        title: 'RouterService',
        desc: 'Provider routing with UCB1 multi-armed bandit.',
        code: 'routerService.route(messages, requestId) => Promise<ChatResult>\n      routerService.setStrategy(strategy) => void\n      routerService.getRankedProviders(type) => ProviderScore[]',
    },
    {
        title: 'OrchestrationService',
        desc: 'Topology-driven multi-node execution graph.',
        code: 'orchestrator.mount(topology) => void\n      orchestrator.getActiveTopology() => Topology | null\n      orchestrator.spawnAgent(config) => Agent',
    },
    {
        title: 'MemoryService',
        desc: 'Hybrid memory with semantic and keyword search.',
        code: 'memoryService.search(query) => MemorySearchResult[]\n      memoryService.addEntry(entry) => void\n      memoryService.getStats() => MemoryStats',
    },
    {
        title: 'KeyService',
        desc: 'API key management with encryption and health tracking.',
        code: 'keyService.getKeys() => ApiKey[]\n      keyService.addKey(data) => Promise<ApiKey>\n      keyService.removeKey(id) => void\n      keyService.getAlerts() => Alert[]',
    },
];

export const EVENTS_REF = [
    "'chat:send'",
    "'chat:stream:chunk'",
    "'chat:stream:end'",
    "'router:signal'",
    "'kernel:updated'",
    "'system:notification'",
    "'cognitive:step:completed'",
    "'policy:violation'",
];

interface InvariantData {
    inv: string;
    desc: string;
    detail: string;
}
export const INVARIANTS: InvariantData[] = [
    {
        inv: 'INV-1',
        desc: 'Weights Normalization',
        detail: 'The sum of all routing priority weights across active providers must strictly equal 1.0 (100%). Checked before every routing decision.',
    },
    {
        inv: 'INV-2',
        desc: 'Zero-Trust Architecture',
        detail: 'API keys and vault passwords never leave the client browser. They are AES-encrypted in localStorage and never transmitted to telemetry.',
    },
    {
        inv: 'INV-3',
        desc: 'Deterministic Telemetry',
        detail: 'All performance metrics (latency, success rate) use capped moving averages to prevent outlier poisoning.',
    },
    {
        inv: 'INV-4',
        desc: 'Safety Drift Cap',
        detail: 'Autonomous weight adjustments by the Bandit algorithm are limited to a maximum delta of +/- 15% per tick.',
    },
    {
        inv: 'INV-5',
        desc: 'MCP Server Isolation',
        detail: 'MCP server connections are sandboxed per origin. A compromised server cannot access keys, memory, or other servers.',
    },
    {
        inv: 'INV-6',
        desc: 'Cognitive Trace Completeness',
        detail: 'Every cognitive step logged in Dexie includes traceId, nodeId, and timestamp. Orphaned steps are detected and flagged by the CognitiveService on startup.',
    },
    {
        inv: 'INV-7',
        desc: 'Schema Versioning',
        detail: 'All Dexie schema migrations are incremental and backward-compatible. The database version number is monotonic and never regresses.',
    },
    {
        inv: 'INV-8',
        desc: 'Role Validation',
        detail: 'Every agent role defined in the Roles panel must pass schema validation (name, systemPrompt, temperature). Invalid roles are rejected before persistence.',
    },
    {
        inv: 'INV-9',
        desc: 'Concurrency Throttling',
        detail: 'Maximum concurrent requests per provider key is dynamically capped based on recent error rates and latency trends.',
    },
    {
        inv: 'INV-10',
        desc: 'Audit Trail',
        detail: 'All administrative actions (config changes, key operations, system reloads) are logged with actor, timestamp, and details for forensic analysis.',
    },
];

interface FaqData {
    q: string;
    a: string;
}
export const FAQ_ITEMS: FaqData[] = [
    {
        q: 'Where are my API keys stored?',
        a: "Your keys are stored exclusively in your browser's localStorage via the Browser Vault API. They are never transmitted to our telemetry or external servers.",
    },
    {
        q: 'Does this cost anything?',
        a: 'Super-Agents OS is a free, local-first client. You only pay the LLM providers (Google, Anthropic, OpenAI, etc.) directly via your API keys, according to their pricing.',
    },
    {
        q: 'How does semantic search work?',
        a: 'When enabled, the Semantic toggle sends your query through a Transformers.js pipeline (all-MiniLM-L6-v2, 384-dim) running in a Web Worker. The generated embedding is compared against stored vectors using cosine similarity.',
    },
    {
        q: 'Is my data persisted across sessions?',
        a: 'Yes. All data (memories, keys, roles, skills, connectors, chat sessions, traces) is stored in IndexedDB via Dexie. It survives page reloads, browser restarts, and incognito sessions.',
    },
    {
        q: 'Can I add local models (e.g. Ollama)?',
        a: 'Yes! Select the "Custom" provider in the setup wizard to connect to local proxy servers (LM Studio, Ollama) by specifying localhost:11434 or similar endpoints.',
    },
    {
        q: 'How does Smart Routing actually work?',
        a: 'It uses an Upper Confidence Bound (UCB1) reinforcement learning approach. It tracks round-trip latency and success rate, balancing exploitation of the fastest model against exploration of newly added models.',
    },
    {
        q: 'What are MCP Connectors?',
        a: 'Model Context Protocol (MCP) servers provide a standardized interface to external data sources (file system, GitHub, databases). Configure them in the Connectors panel.',
    },
    {
        q: 'What is the difference between Orama and embedding search?',
        a: 'Orama provides fast offline BM25 keyword search. Semantic/embedding search understands intent \u2014 "how to configure routing" will match documents about UCB1 settings even if those exact words don\'t appear.',
    },
    {
        q: 'How do I export my data?',
        a: 'Use the Settings panel > Data Management section to export all your data as JSON. This includes memories, keys (encrypted), chat sessions, roles, and configuration.',
    },
    {
        q: 'What happens when a provider key fails?',
        a: 'The system automatically marks it as "error", attempts health checks periodically, and routes requests to healthy providers. You\'ll receive a notification with details.',
    },
];

interface ChangelogData {
    version: string;
    date: string;
    changes: string[];
}
export const RELEASES: ChangelogData[] = [
    {
        version: 'v4.1.0',
        date: '2026-05-18',
        changes: [
            'Kernel Consolidation — Dependency Rule enforced',
            'Transaction boundary (ITransaction) for atomic mutations',
            'ILifecycle standard for all kernel services',
            'ILogger / LoggerService for structured observability',
            'RotationService migrated to kernel',
            '16 Zod schemas migrated to kernel/types/',
            'ISTopology contracts moved to kernel/contracts/',
            'KeyRegistry no longer seeds demo placeholder keys',
            'Dead SecretStores and AdapterRegistry deleted',
        ],
    },
    {
        version: 'v4.0.3',
        date: '2026-05-16',
        changes: [
            'Ring buffer event log (O(1) insert/eviction)',
            'Deep immutable state (deepFreeze + structuredClone)',
            'Composite event keys prevent timestamp collision',
            'Init validation with per-field fallback',
            'Whitelist SLA and weight clamping',
        ],
    },
    {
        version: 'v4.0.1',
        date: '2026-05-14',
        changes: [
            'Dexie ConstraintError fixed (add\u2192put, bulkAdd\u2192bulkPut)',
            'Infinite re-render in KeyStore fixed (useMemo)',
            'Duplicate React keys in InstalledProvidersView fixed',
            'KeyService async init() extracted from constructor',
            'Bootstrap duplicate kernel.init() removed',
        ],
    },
    {
        version: 'v3.7.0',
        date: '2026-05-10',
        changes: [
            'Orama Worker for full-text BM25 search',
            'Transformers.js real semantic embeddings (384-dim)',
            'Hybrid search: auto \u2192 semantic \u2192 fulltext \u2192 substring',
            'Vector persistence in Dexie',
        ],
    },
    {
        version: 'v3.6.0',
        date: '2026-05-09',
        changes: [
            'Persistent IndexedDB storage via Dexie.js',
            'Secure WebWorker sandbox for agent scripts',
            'Multi-agent coordination via Blackboard pattern',
            'MCP protocol integration',
            'Observability 2.0 with real telemetry',
        ],
    },
];
