import type { CodeManifest, CodeManifestEntry } from '../contracts/consistency-checker';

const FILE_ENTRIES: CodeManifestEntry[] = [
    // ── Kernel services ──
    {
        name: 'src/kernel/services/debate-runtime/debate-service.ts',
        type: 'file_path',
        location: 'services/debate-runtime/debate-service.ts',
    },
    {
        name: 'src/kernel/services/debate-interpreter.ts',
        type: 'file_path',
        location: 'services/debate-interpreter.ts',
    },
    {
        name: 'src/kernel/services/debate-governor/index.ts',
        type: 'file_path',
        location: 'services/debate-governor/',
    },
    {
        name: 'src/kernel/services/debate-governor/types.ts',
        type: 'file_path',
        location: 'services/debate-governor/',
    },
    {
        name: 'src/kernel/services/debate-governor/claim-extractor.ts',
        type: 'file_path',
        location: 'services/debate-governor/',
    },
    {
        name: 'src/kernel/services/debate-governor/claim-graph.ts',
        type: 'file_path',
        location: 'services/debate-governor/',
    },
    {
        name: 'src/kernel/services/debate-governor/contradiction-detector.ts',
        type: 'file_path',
        location: 'services/debate-governor/',
    },
    {
        name: 'src/kernel/services/debate-governor/debate-governor.ts',
        type: 'file_path',
        location: 'services/debate-governor/',
    },
    {
        name: 'src/kernel/services/debate-state-builder.ts',
        type: 'file_path',
        location: 'services/debate-state-builder.ts',
    },
    {
        name: 'src/kernel/services/consistency-checker.ts',
        type: 'file_path',
        location: 'services/consistency-checker.ts',
    },
    {
        name: 'src/kernel/services/code-manifest.ts',
        type: 'file_path',
        location: 'services/code-manifest.ts',
    },
    {
        name: 'src/kernel/services/debate-runtime/debate-engine.ts',
        type: 'file_path',
        location: 'services/debate-runtime/',
    },
    {
        name: 'src/kernel/services/debate-runtime/debate-session.ts',
        type: 'file_path',
        location: 'services/debate-runtime/',
    },
    {
        name: 'src/kernel/services/debate-runtime/debate-budget.ts',
        type: 'file_path',
        location: 'services/debate-runtime/',
    },
    {
        name: 'src/kernel/services/debate-runtime/debate-memory.ts',
        type: 'file_path',
        location: 'services/debate-runtime/',
    },
    {
        name: 'src/kernel/services/debate-runtime/debate-consensus.ts',
        type: 'file_path',
        location: 'services/debate-runtime/',
    },
    {
        name: 'src/kernel/services/debate-runtime/debate-evaluator.ts',
        type: 'file_path',
        location: 'services/debate-runtime/',
    },
    {
        name: 'src/kernel/services/debate-runtime/debate-timeline.ts',
        type: 'file_path',
        location: 'services/debate-runtime/',
    },
    {
        name: 'src/kernel/services/debate-runtime/debate-orchestrator.ts',
        type: 'file_path',
        location: 'services/debate-runtime/',
    },
    {
        name: 'src/kernel/services/debate-runtime/debate-topology.ts',
        type: 'file_path',
        location: 'services/debate-runtime/',
    },
    {
        name: 'src/kernel/services/auto-debate/auto-debate-service.ts',
        type: 'file_path',
        location: 'services/auto-debate/',
    },
    {
        name: 'src/kernel/services/key-state-store.ts',
        type: 'file_path',
        location: 'services/key-state-store.ts',
    },
    {
        name: 'src/kernel/services/logger-service.ts',
        type: 'file_path',
        location: 'services/logger-service.ts',
    },
    {
        name: 'src/kernel/services/config-service.ts',
        type: 'file_path',
        location: 'services/config-service.ts',
    },
    {
        name: 'src/kernel/services/config-registry.ts',
        type: 'file_path',
        location: 'services/config-registry.ts',
    },
    {
        name: 'src/kernel/services/cache-service.ts',
        type: 'file_path',
        location: 'services/cache-service.ts',
    },
    {
        name: 'src/kernel/services/health-service.ts',
        type: 'file_path',
        location: 'services/health-service.ts',
    },
    {
        name: 'src/kernel/services/probe-service.ts',
        type: 'file_path',
        location: 'services/probe-service.ts',
    },
    {
        name: 'src/kernel/services/provider-adapter-registry.ts',
        type: 'file_path',
        location: 'services/provider-adapter-registry.ts',
    },
    {
        name: 'src/kernel/services/provider-router.ts',
        type: 'file_path',
        location: 'services/provider-router.ts',
    },
    {
        name: 'src/kernel/services/router-config-manager.ts',
        type: 'file_path',
        location: 'services/router-config-manager.ts',
    },
    {
        name: 'src/kernel/services/chat-executor.ts',
        type: 'file_path',
        location: 'services/chat-executor.ts',
    },
    {
        name: 'src/kernel/services/lifecycle-manager.ts',
        type: 'file_path',
        location: 'services/lifecycle-manager.ts',
    },
    {
        name: 'src/kernel/services/transaction.ts',
        type: 'file_path',
        location: 'services/transaction.ts',
    },
    {
        name: 'src/kernel/services/metrics-service.ts',
        type: 'file_path',
        location: 'services/metrics-service.ts',
    },
    {
        name: 'src/kernel/services/timeline-service.ts',
        type: 'file_path',
        location: 'services/timeline-service.ts',
    },
    {
        name: 'src/kernel/services/trace-service.ts',
        type: 'file_path',
        location: 'services/trace-service.ts',
    },
    {
        name: 'src/kernel/services/monitoring-service.ts',
        type: 'file_path',
        location: 'services/monitoring-service.ts',
    },
    {
        name: 'src/kernel/services/admin-service.ts',
        type: 'file_path',
        location: 'services/admin-service.ts',
    },
    {
        name: 'src/kernel/services/snapshot-service.ts',
        type: 'file_path',
        location: 'services/snapshot-service.ts',
    },
    {
        name: 'src/kernel/services/advisor-service.ts',
        type: 'file_path',
        location: 'services/advisor-service.ts',
    },
    {
        name: 'src/kernel/services/pricing-service.ts',
        type: 'file_path',
        location: 'services/pricing-service.ts',
    },
    {
        name: 'src/kernel/services/budget-service.ts',
        type: 'file_path',
        location: 'services/budget-service.ts',
    },
    {
        name: 'src/kernel/services/usage-tracker.ts',
        type: 'file_path',
        location: 'services/usage-tracker.ts',
    },
    {
        name: 'src/kernel/services/cognitive-service.ts',
        type: 'file_path',
        location: 'services/cognitive-service.ts',
    },
    {
        name: 'src/kernel/services/cognitive-intelligence/cognitive-intelligence-service.ts',
        type: 'file_path',
        location: 'services/cognitive-intelligence/',
    },
    {
        name: 'src/kernel/services/external-secrets-service.ts',
        type: 'file_path',
        location: 'services/external-secrets-service.ts',
    },
    {
        name: 'src/kernel/services/notification-webhook-service.ts',
        type: 'file_path',
        location: 'services/notification-webhook-service.ts',
    },
    {
        name: 'src/kernel/services/compromise-webhook-service.ts',
        type: 'file_path',
        location: 'services/compromise-webhook-service.ts',
    },
    {
        name: 'src/kernel/services/orchestration-service.ts',
        type: 'file_path',
        location: 'services/orchestration-service.ts',
    },
    {
        name: 'src/kernel/services/memory-engine.ts',
        type: 'file_path',
        location: 'services/memory-engine.ts',
    },
    {
        name: 'src/kernel/services/agent-service.ts',
        type: 'file_path',
        location: 'services/agent-service.ts',
    },
    {
        name: 'src/kernel/services/role-service.ts',
        type: 'file_path',
        location: 'services/role-service.ts',
    },
    {
        name: 'src/kernel/services/skill-service.ts',
        type: 'file_path',
        location: 'services/skill-service.ts',
    },
    {
        name: 'src/kernel/services/tool-executor.ts',
        type: 'file_path',
        location: 'services/tool-executor.ts',
    },
    {
        name: 'src/kernel/services/sandbox-service.ts',
        type: 'file_path',
        location: 'services/sandbox-service.ts',
    },
    {
        name: 'src/kernel/services/mcp-service.ts',
        type: 'file_path',
        location: 'services/mcp-service.ts',
    },
    {
        name: 'src/kernel/services/workspace-service.ts',
        type: 'file_path',
        location: 'services/workspace-service.ts',
    },
    {
        name: 'src/kernel/services/policy-service.ts',
        type: 'file_path',
        location: 'services/policy-service.ts',
    },
    {
        name: 'src/kernel/services/routing-policy/routing-policy-service.ts',
        type: 'file_path',
        location: 'services/routing-policy/',
    },
    {
        name: 'src/kernel/services/session-affinity-store.ts',
        type: 'file_path',
        location: 'services/session-affinity-store.ts',
    },
    {
        name: 'src/kernel/services/event-sourcing/event-recorder.ts',
        type: 'file_path',
        location: 'services/event-sourcing/',
    },
    {
        name: 'src/kernel/services/event-bridge/projection-registry.ts',
        type: 'file_path',
        location: 'services/event-bridge/',
    },
    {
        name: 'src/kernel/services/event-bridge/event-bridge.ts',
        type: 'file_path',
        location: 'services/event-bridge/',
    },
    {
        name: 'src/kernel/services/projections/key-state-projection.ts',
        type: 'file_path',
        location: 'services/projections/',
    },
    {
        name: 'src/kernel/services/projections/router-projection.ts',
        type: 'file_path',
        location: 'services/projections/',
    },
    {
        name: 'src/kernel/services/service-list.ts',
        type: 'file_path',
        location: 'services/service-list.ts',
    },
    {
        name: 'src/kernel/services/key-management/key-service.ts',
        type: 'file_path',
        location: 'services/key-management/',
    },
    {
        name: 'src/kernel/services/key-management/pool-selector-service.ts',
        type: 'file_path',
        location: 'services/key-management/',
    },
    {
        name: 'src/kernel/services/rotation-service.ts',
        type: 'file_path',
        location: 'services/rotation-service.ts',
    },
    {
        name: 'src/kernel/services/virtual-key-service.ts',
        type: 'file_path',
        location: 'services/virtual-key-service.ts',
    },
    {
        name: 'src/kernel/services/key-intelligence-pipeline.ts',
        type: 'file_path',
        location: 'services/key-intelligence-pipeline.ts',
    },
    {
        name: 'src/kernel/services/group-manager.ts',
        type: 'file_path',
        location: 'services/group-manager.ts',
    },
    {
        name: 'src/kernel/services/provider-runtime/provider-service.ts',
        type: 'file_path',
        location: 'services/provider-runtime/',
    },
    {
        name: 'src/kernel/services/provider-tracker.ts',
        type: 'file_path',
        location: 'services/provider-tracker.ts',
    },
    {
        name: 'src/kernel/services/llm-client-service.ts',
        type: 'file_path',
        location: 'services/llm-client-service.ts',
    },
    {
        name: 'src/kernel/services/system-status-service.ts',
        type: 'file_path',
        location: 'services/system-status-service.ts',
    },
    {
        name: 'src/kernel/services/causal-scope-manager.ts',
        type: 'file_path',
        location: 'services/causal-scope-manager.ts',
    },
    {
        name: 'src/kernel/services/causal-timeline-service.ts',
        type: 'file_path',
        location: 'services/causal-timeline-service.ts',
    },
    {
        name: 'src/kernel/services/counterfactual-engine.ts',
        type: 'file_path',
        location: 'services/counterfactual-engine.ts',
    },
    {
        name: 'src/kernel/services/counterfactual-explanation-service.ts',
        type: 'file_path',
        location: 'services/counterfactual-explanation-service.ts',
    },
    {
        name: 'src/kernel/services/counterfactual-narrative-service.ts',
        type: 'file_path',
        location: 'services/counterfactual-narrative-service.ts',
    },
    {
        name: 'src/kernel/services/temporal-replay-service.ts',
        type: 'file_path',
        location: 'services/temporal-replay-service.ts',
    },
    {
        name: 'src/kernel/services/truth-consistency-monitor.ts',
        type: 'file_path',
        location: 'services/truth-consistency-monitor.ts',
    },
    {
        name: 'src/kernel/services/settings-service.ts',
        type: 'file_path',
        location: 'services/settings-service.ts',
    },
    {
        name: 'src/kernel/services/storage-adapter.ts',
        type: 'file_path',
        location: 'services/storage-adapter.ts',
    },
    {
        name: 'src/kernel/services/config-history.ts',
        type: 'file_path',
        location: 'services/config-history.ts',
    },
    // ── Contracts ──
    {
        name: 'src/kernel/contracts/debate-runtime.ts',
        type: 'file_path',
        location: 'contracts/debate-runtime.ts',
    },
    {
        name: 'src/kernel/contracts/lifecycle.ts',
        type: 'file_path',
        location: 'contracts/lifecycle.ts',
    },
    {
        name: 'src/kernel/contracts/transaction.ts',
        type: 'file_path',
        location: 'contracts/transaction.ts',
    },
    { name: 'src/kernel/contracts/logger.ts', type: 'file_path', location: 'contracts/logger.ts' },
    {
        name: 'src/kernel/contracts/results.ts',
        type: 'file_path',
        location: 'contracts/results.ts',
    },
    { name: 'src/kernel/contracts/errors.ts', type: 'file_path', location: 'contracts/errors.ts' },
    {
        name: 'src/kernel/contracts/storage-adapter.ts',
        type: 'file_path',
        location: 'contracts/storage-adapter.ts',
    },
    {
        name: 'src/kernel/contracts/provider-adapter.ts',
        type: 'file_path',
        location: 'contracts/provider-adapter.ts',
    },
    {
        name: 'src/kernel/contracts/key-state.ts',
        type: 'file_path',
        location: 'contracts/key-state.ts',
    },
    {
        name: 'src/kernel/contracts/key-vault.ts',
        type: 'file_path',
        location: 'contracts/key-vault.ts',
    },
    { name: 'src/kernel/contracts/probe.ts', type: 'file_path', location: 'contracts/probe.ts' },
    { name: 'src/kernel/contracts/health.ts', type: 'file_path', location: 'contracts/health.ts' },
    {
        name: 'src/kernel/contracts/routing.ts',
        type: 'file_path',
        location: 'contracts/routing.ts',
    },
    {
        name: 'src/kernel/contracts/cognitive-intelligence.ts',
        type: 'file_path',
        location: 'contracts/cognitive-intelligence.ts',
    },
    {
        name: 'src/kernel/contracts/topology.ts',
        type: 'file_path',
        location: 'contracts/topology.ts',
    },
    {
        name: 'src/kernel/contracts/feature-flags.ts',
        type: 'file_path',
        location: 'contracts/feature-flags.ts',
    },
    {
        name: 'src/kernel/contracts/consistency-checker.ts',
        type: 'file_path',
        location: 'contracts/consistency-checker.ts',
    },
    { name: 'src/kernel/contracts/index.ts', type: 'file_path', location: 'contracts/index.ts' },
    // ── Kernel infrastructure ──
    { name: 'src/kernel/container.ts', type: 'file_path', location: 'container.ts' },
    { name: 'src/kernel/bootstrap.ts', type: 'file_path', location: 'bootstrap.ts' },
    { name: 'src/kernel/kernel.ts', type: 'file_path', location: 'kernel.ts' },
    { name: 'src/kernel/instances.ts', type: 'file_path', location: 'instances.ts' },
    {
        name: 'src/kernel/service-registration.ts',
        type: 'file_path',
        location: 'service-registration.ts',
    },
    {
        name: 'src/kernel/state/topology-defaults.ts',
        type: 'file_path',
        location: 'state/topology-defaults.ts',
    },
    {
        name: 'src/kernel/events/event-names.ts',
        type: 'file_path',
        location: 'events/event-names.ts',
    },
    { name: 'src/kernel/DEPENDENCY_MAP.md', type: 'file_path', location: 'DEPENDENCY_MAP.md' },
    // ── UI components ──
    {
        name: 'src/components/DebatePanel/DebatePanel.tsx',
        type: 'file_path',
        location: 'components/DebatePanel/DebatePanel.tsx',
    },
    {
        name: 'src/components/DebatePanel/AutoDebateSection.tsx',
        type: 'file_path',
        location: 'components/DebatePanel/AutoDebateSection.tsx',
    },
    {
        name: 'src/components/DebateRuntimePanel/DebateRuntimePanel.tsx',
        type: 'file_path',
        location: 'components/DebateRuntimePanel/DebateRuntimePanel.tsx',
    },
    // ── LLM layer ──
    { name: 'src/llm/core/types.ts', type: 'file_path', location: 'llm/core/types.ts' },
    {
        name: 'src/llm/core/base-decorator.ts',
        type: 'file_path',
        location: 'llm/core/base-decorator.ts',
    },
    { name: 'src/llm/core/command.ts', type: 'file_path', location: 'llm/core/command.ts' },
    {
        name: 'src/llm/core/middleware-pipeline.ts',
        type: 'file_path',
        location: 'llm/core/middleware-pipeline.ts',
    },
    // ── Docs ──
    { name: 'docs/00-overview.md', type: 'file_path', location: 'docs/00-overview.md' },
    {
        name: 'docs/01-system-architecture.md',
        type: 'file_path',
        location: 'docs/01-system-architecture.md',
    },
    { name: 'docs/02-core-concepts.md', type: 'file_path', location: 'docs/02-core-concepts.md' },
    {
        name: 'docs/03-cognitive-layers.md',
        type: 'file_path',
        location: 'docs/03-cognitive-layers.md',
    },
    {
        name: 'docs/04-behavior-modifiers.md',
        type: 'file_path',
        location: 'docs/04-behavior-modifiers.md',
    },
    { name: 'docs/05-metrics-system.md', type: 'file_path', location: 'docs/05-metrics-system.md' },
    {
        name: 'docs/06-interpretation-engine.md',
        type: 'file_path',
        location: 'docs/06-interpretation-engine.md',
    },
    { name: 'docs/07-ui-layer.md', type: 'file_path', location: 'docs/07-ui-layer.md' },
    { name: 'docs/08-data-flow.md', type: 'file_path', location: 'docs/08-data-flow.md' },
    {
        name: 'docs/09-design-principles.md',
        type: 'file_path',
        location: 'docs/09-design-principles.md',
    },
    {
        name: 'docs/10-experiments-framework.md',
        type: 'file_path',
        location: 'docs/10-experiments-framework.md',
    },
    { name: 'docs/README.md', type: 'file_path', location: 'docs/README.md' },
];

const TYPE_ENTRIES: CodeManifestEntry[] = [
    // ── Debate types ──
    { name: 'DebateSession', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'DebateParticipant', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'DebateArgument', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'DebateConfig', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'DebateStrategy', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'DebateConstraint', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'ParentResolution', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'DebateGraphMetrics', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'ActivityMetrics', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'AgentActivityMetric', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'ArgumentImpact', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'QualityMetrics', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'DepthMetric', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'OriginalityMetric', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'UsefulnessMetric', type: 'type_name', location: 'contracts/debate-types.ts' },
    { name: 'DebateInterpretation', type: 'type_name', location: 'debate-interpreter.ts' },
    { name: 'DisagreementPoint', type: 'type_name', location: 'debate-interpreter.ts' },
    { name: 'TrajectoryChanger', type: 'type_name', location: 'debate-interpreter.ts' },
    { name: 'ConstraintCorrelation', type: 'type_name', location: 'debate-interpreter.ts' },
    // ── Governor types ──
    { name: 'Claim', type: 'type_name', location: 'debate-governor/types.ts' },
    { name: 'ClaimEdge', type: 'type_name', location: 'debate-governor/types.ts' },
    { name: 'Contradiction', type: 'type_name', location: 'debate-governor/types.ts' },
    { name: 'ClaimGraph', type: 'type_name', location: 'debate-governor/types.ts' },
    { name: 'GovernorState', type: 'type_name', location: 'debate-governor/types.ts' },
    { name: 'SynthesisResult', type: 'type_name', location: 'debate-governor/types.ts' },
    // ── Debate Runtime types ──
    { name: 'DebatePhase', type: 'type_name', location: 'debate-runtime.ts' },
    { name: 'AgentPhase', type: 'type_name', location: 'debate-runtime.ts' },
    { name: 'DebateSessionSnapshot', type: 'type_name', location: 'debate-runtime.ts' },
    { name: 'DebateTopology', type: 'type_name', location: 'debate-runtime.ts' },
    { name: 'TopologyNode', type: 'type_name', location: 'debate-runtime.ts' },
    { name: 'TopologyEdge', type: 'type_name', location: 'debate-runtime.ts' },
    { name: 'ConsensusResult', type: 'type_name', location: 'debate-runtime.ts' },
    { name: 'DebateBudgetLimits', type: 'type_name', location: 'debate-runtime.ts' },
    { name: 'AgentScore', type: 'type_name', location: 'debate-runtime.ts' },
    // ── Consistency Checker ──
    {
        name: 'ConsistencyCheckItem',
        type: 'type_name',
        location: 'contracts/consistency-checker.ts',
    },
    { name: 'ConsistencyReport', type: 'type_name', location: 'contracts/consistency-checker.ts' },
    { name: 'CodeManifest', type: 'type_name', location: 'contracts/consistency-checker.ts' },
    { name: 'CodeManifestEntry', type: 'type_name', location: 'contracts/consistency-checker.ts' },
];

const INTERFACE_ENTRIES: CodeManifestEntry[] = [
    { name: 'IEventBus', type: 'interface_name', location: 'types/interfaces.ts' },
    { name: 'ILifecycle', type: 'interface_name', location: 'contracts/lifecycle.ts' },
    { name: 'ITransaction', type: 'interface_name', location: 'contracts/transaction.ts' },
    { name: 'ILogger', type: 'interface_name', location: 'contracts/logger.ts' },
    {
        name: 'ILocalStorageAdapter',
        type: 'interface_name',
        location: 'contracts/storage-adapter.ts',
    },
    { name: 'IProviderAdapter', type: 'interface_name', location: 'contracts/provider-adapter.ts' },
    { name: 'IKeyService', type: 'interface_name', location: 'contracts/key-vault.ts' },
    { name: 'IKeyStateStore', type: 'interface_name', location: 'contracts/key-state.ts' },
    { name: 'IProbeService', type: 'interface_name', location: 'contracts/probe.ts' },
    { name: 'IMemoryEngine', type: 'interface_name', location: 'contracts/memory.ts' },
    { name: 'ICostCalculator', type: 'interface_name', location: 'contracts/pricing.ts' },
    { name: 'IBudgetService', type: 'interface_name', location: 'contracts/budget.ts' },
    { name: 'IDebateEngine', type: 'interface_name', location: 'contracts/debate-runtime.ts' },
    {
        name: 'IDebateOrchestrator',
        type: 'interface_name',
        location: 'contracts/debate-runtime.ts',
    },
    { name: 'IDebateBudget', type: 'interface_name', location: 'contracts/debate-runtime.ts' },
    { name: 'IConsensusEngine', type: 'interface_name', location: 'contracts/debate-runtime.ts' },
    {
        name: 'ICognitiveIntelligenceService',
        type: 'interface_name',
        location: 'contracts/cognitive-intelligence.ts',
    },
    { name: 'IOptimizationEngine', type: 'interface_name', location: 'contracts/advisor.ts' },
    {
        name: 'IConsistencyChecker',
        type: 'interface_name',
        location: 'contracts/consistency-checker.ts',
    },
    { name: 'IWorkspaceService', type: 'interface_name', location: 'contracts/workspace.ts' },
];

const EVENT_ENTRIES: CodeManifestEntry[] = [
    { name: 'debate:started', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate:updated', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate:argument', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate:consensus', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:session:created', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:session:started', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:session:completed', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:session:failed', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:session:paused', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:session:resumed', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:session:cancelled', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:phase:changed', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:agent:phase:changed', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:round:started', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:round:ended', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:agent:thinking', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:agent:responded', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:agent:error', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:agent:fallback', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:agent:timeout', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:budget:updated', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:budget:pressure', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:consensus:reached', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:consensus:conflict', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:consensus:confidence', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:memory:claim', type: 'event_name', location: 'event-names.ts' },
    { name: 'debate-runtime:memory:chain', type: 'event_name', location: 'event-names.ts' },
    { name: 'key:loaded', type: 'event_name', location: 'event-names.ts' },
    { name: 'key:added', type: 'event_name', location: 'event-names.ts' },
    { name: 'key:removed', type: 'event_name', location: 'event-names.ts' },
    { name: 'key:state:changed', type: 'event_name', location: 'event-names.ts' },
    { name: 'key:quota:exceeded', type: 'event_name', location: 'event-names.ts' },
    { name: 'key:probe:result', type: 'event_name', location: 'event-names.ts' },
    { name: 'chat:send', type: 'event_name', location: 'event-names.ts' },
    { name: 'chat:stream:start', type: 'event_name', location: 'event-names.ts' },
    { name: 'chat:stream:chunk', type: 'event_name', location: 'event-names.ts' },
    { name: 'chat:stream:end', type: 'event_name', location: 'event-names.ts' },
    { name: 'system:notification', type: 'event_name', location: 'event-names.ts' },
    { name: 'system:runtime:ready', type: 'event_name', location: 'event-names.ts' },
    { name: 'kernel:updated', type: 'event_name', location: 'event-names.ts' },
];

const SERVICE_ENTRIES: CodeManifestEntry[] = [
    {
        name: 'DebateService',
        type: 'service_name',
        location: 'services/debate-runtime/debate-service.ts',
    },
    { name: 'DebateInterpreter', type: 'service_name', location: 'services/debate-interpreter.ts' },
    {
        name: 'DebateGovernor',
        type: 'service_name',
        location: 'services/debate-governor/debate-governor.ts',
    },
    {
        name: 'DebateEngine',
        type: 'service_name',
        location: 'services/debate-runtime/debate-engine.ts',
    },
    {
        name: 'DebateSession',
        type: 'service_name',
        location: 'services/debate-runtime/debate-session.ts',
    },
    {
        name: 'DebateBudget',
        type: 'service_name',
        location: 'services/debate-runtime/debate-budget.ts',
    },
    {
        name: 'DebateMemory',
        type: 'service_name',
        location: 'services/debate-runtime/debate-memory.ts',
    },
    {
        name: 'DebateConsensusEngine',
        type: 'service_name',
        location: 'services/debate-runtime/debate-consensus.ts',
    },
    {
        name: 'DebateEvaluator',
        type: 'service_name',
        location: 'services/debate-runtime/debate-evaluator.ts',
    },
    {
        name: 'DebateTimeline',
        type: 'service_name',
        location: 'services/debate-runtime/debate-timeline.ts',
    },
    {
        name: 'DebateOrchestrator',
        type: 'service_name',
        location: 'services/debate-runtime/debate-orchestrator.ts',
    },
    {
        name: 'AutoDebateService',
        type: 'service_name',
        location: 'services/auto-debate/auto-debate-service.ts',
    },
    {
        name: 'ConsistencyChecker',
        type: 'service_name',
        location: 'services/consistency-checker.ts',
    },
    {
        name: 'KeyService',
        type: 'service_name',
        location: 'services/key-management/key-service.ts',
    },
    {
        name: 'ProviderAdapterRegistry',
        type: 'service_name',
        location: 'services/provider-adapter-registry.ts',
    },
    { name: 'RouterService', type: 'service_name', location: 'services/provider-router.ts' },
    {
        name: 'RouterConfigManager',
        type: 'service_name',
        location: 'services/router-config-manager.ts',
    },
    { name: 'KeyStateStore', type: 'service_name', location: 'services/key-state-store.ts' },
    { name: 'LoggerService', type: 'service_name', location: 'services/logger-service.ts' },
    { name: 'ConfigService', type: 'service_name', location: 'services/config-service.ts' },
    { name: 'ProbeService', type: 'service_name', location: 'services/probe-service.ts' },
    { name: 'ChatExecutor', type: 'service_name', location: 'services/chat-executor.ts' },
    { name: 'AgentService', type: 'service_name', location: 'services/agent-service.ts' },
    { name: 'RoleService', type: 'service_name', location: 'services/role-service.ts' },
    { name: 'MemoryEngine', type: 'service_name', location: 'services/memory-engine.ts' },
    { name: 'AdvisorService', type: 'service_name', location: 'services/advisor-service.ts' },
    { name: 'MetricsService', type: 'service_name', location: 'services/metrics-service.ts' },
    { name: 'CognitiveService', type: 'service_name', location: 'services/cognitive-service.ts' },
    {
        name: 'CognitiveIntelligenceService',
        type: 'service_name',
        location: 'services/cognitive-intelligence/cognitive-intelligence-service.ts',
    },
    { name: 'ToolExecutor', type: 'service_name', location: 'services/tool-executor.ts' },
    { name: 'SandboxService', type: 'service_name', location: 'services/sandbox-service.ts' },
    { name: 'LifecycleManager', type: 'service_name', location: 'services/lifecycle-manager.ts' },
    { name: 'TransactionContext', type: 'service_name', location: 'services/transaction.ts' },
    { name: 'WorkspaceService', type: 'service_name', location: 'services/workspace-service.ts' },
    { name: 'AdminService', type: 'service_name', location: 'services/admin-service.ts' },
    { name: 'SnapshotService', type: 'service_name', location: 'services/snapshot-service.ts' },
    { name: 'BudgetService', type: 'service_name', location: 'services/budget-service.ts' },
    { name: 'PricingService', type: 'service_name', location: 'services/pricing-service.ts' },
    {
        name: 'EventSourcingService',
        type: 'service_name',
        location: 'services/event-sourcing/event-recorder.ts',
    },
];

const METHOD_ENTRIES: CodeManifestEntry[] = [
    // DebateService facade methods
    {
        name: 'startDebate',
        type: 'method_name',
        location: 'services/debate-runtime/debate-service.ts',
    },
    {
        name: 'stopDebate',
        type: 'method_name',
        location: 'services/debate-runtime/debate-service.ts',
    },
    {
        name: 'getSession',
        type: 'method_name',
        location: 'services/debate-runtime/debate-service.ts',
    },
    // DebateEngine methods
    {
        name: 'pauseSession',
        type: 'method_name',
        location: 'services/debate-runtime/debate-engine.ts',
    },
    {
        name: 'resumeSession',
        type: 'method_name',
        location: 'services/debate-runtime/debate-engine.ts',
    },
    {
        name: 'cancelSession',
        type: 'method_name',
        location: 'services/debate-runtime/debate-engine.ts',
    },
    { name: 'callLLM', type: 'method_name', location: 'services/debate-runtime/debate-engine.ts' },
    // Debate metrics
    {
        name: 'computeGraphMetrics',
        type: 'method_name',
        location: 'services/debate-runtime/debate-metrics.ts',
    },
    {
        name: 'computeActivityMetrics',
        type: 'method_name',
        location: 'services/debate-runtime/debate-metrics.ts',
    },
    {
        name: 'computeQualityMetrics',
        type: 'method_name',
        location: 'services/debate-runtime/debate-metrics.ts',
    },
    {
        name: 'scoreConstraintCompliance',
        type: 'method_name',
        location: 'services/debate-runtime/debate-metrics.ts',
    },
    {
        name: 'getConstraintCompliance',
        type: 'method_name',
        location: 'services/debate-runtime/debate-metrics.ts',
    },
    // Debate prompt builder
    {
        name: 'buildOpeningPrompt',
        type: 'method_name',
        location: 'services/debate-runtime/debate-prompt-builder.ts',
    },
    {
        name: 'buildArgumentPrompt',
        type: 'method_name',
        location: 'services/debate-runtime/debate-prompt-builder.ts',
    },
    {
        name: 'buildTemperaturePrompt',
        type: 'method_name',
        location: 'services/debate-runtime/debate-prompt-builder.ts',
    },
    // Debate stop conditions
    {
        name: 'calculateConfidence',
        type: 'method_name',
        location: 'services/debate-runtime/debate-stop-conditions.ts',
    },
    // DebateInterpreter methods
    { name: 'interpret', type: 'method_name', location: 'debate-interpreter.ts' },
    // DebateGovernor methods
    { name: 'ingestArgument', type: 'method_name', location: 'debate-governor/debate-governor.ts' },
    {
        name: 'updateContradictions',
        type: 'method_name',
        location: 'debate-governor/debate-governor.ts',
    },
    {
        name: 'computeConvergence',
        type: 'method_name',
        location: 'debate-governor/debate-governor.ts',
    },
    { name: 'computeNovelty', type: 'method_name', location: 'debate-governor/debate-governor.ts' },
    { name: 'shouldStop', type: 'method_name', location: 'debate-governor/debate-governor.ts' },
    { name: 'getState', type: 'method_name', location: 'debate-governor/debate-governor.ts' },
    {
        name: 'generateSynthesis',
        type: 'method_name',
        location: 'debate-governor/debate-governor.ts',
    },
    { name: 'reset', type: 'method_name', location: 'debate-governor/debate-governor.ts' },
    // ConsistencyChecker methods
    { name: 'checkDocs', type: 'method_name', location: 'consistency-checker.ts' },
    { name: 'getManifest', type: 'method_name', location: 'consistency-checker.ts' },
    { name: 'getLastReport', type: 'method_name', location: 'consistency-checker.ts' },
];

export const BUILTIN_MANIFEST: CodeManifest = {
    version: '4.5.0',
    generated: Date.now(),
    entries: [
        ...FILE_ENTRIES,
        ...TYPE_ENTRIES,
        ...INTERFACE_ENTRIES,
        ...EVENT_ENTRIES,
        ...SERVICE_ENTRIES,
        ...METHOD_ENTRIES,
    ],
};
