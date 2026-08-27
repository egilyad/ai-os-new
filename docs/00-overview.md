# 00 — System Overview

## Concept Layer

SuperAgents OS is a **multi-agent cognitive orchestration system**. It is not a chatbot platform, not an agent framework, and not a workflow engine. It is a runtime that manages structured reasoning across multiple LLM-powered agents — enforcing turn order, tracking claims, measuring convergence, and interpreting the result.

The system exists to solve one core problem: **LLM responses are unstructured, non-reproducible, and unmeasurable**. SuperAgents OS imposes structure on multi-agent interaction so that reasoning becomes a traceable artifact — a graph of claims with measurable properties (depth, diversity, convergence, originality).

## System Mapping Layer

The system is organized as a layered runtime:

- **Kernel** (`src/kernel/`) — DI container, event bus, contracts, lifecycle management
- **Services** (`src/kernel/services/`) — debate orchestration, governor, interpretation, metrics, provider routing
- **UI** (`src/components/`) — React panels for debate setup, live tracking, post-hoc analysis
- **LLM** (`src/llm/`) — provider adapters with decorators (circuit breaker, retry, rate limit, caching)

There are **two parallel debate engines**:

| Engine              | File                                    | Purpose                                                                           |
| ------------------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| `DebateSyncManager` | `debate-runtime/debate-sync-manager.ts` | High-level, synchronous, single-session. Used by UI. Has metrics + interpretation |
| `DebateEngine`      | `debate-runtime/debate-engine.ts`       | Contract-driven, DAG topology, formal phase lifecycle. Budget, memory, consensus  |

The documentation focuses on `DebateSyncManager` — the primary engine used for interactive debates.

## Behavior Layer

At runtime, the system:

1. **Receives a topic** and participant list from the user
2. **Dispatches LLM calls** to each participant sequentially (for opening statements) and then in strategy-defined order (for subsequent rounds)
3. **Tracks every argument** as a structured `DebateArgument` with metadata (source, confidence, parent reference, provider used)
4. **Feeds a governor** (`DebateGovernor`) that extracts claims, builds a claim graph, detects contradictions, and computes convergence
5. **Measures** the debate with graph metrics, activity metrics, and quality metrics
6. **Interprets** the result — disagreement peak, trajectory changers, insights
7. **Emits events** at every step so the UI can react in real-time

The system does NOT:

- Pretend LLM output is reliable (everything is measured and fallback chains exist)
- Use a single LLM call for complex tasks (multi-agent decomposition is built in)
- Assume the first provider will work (retry with provider fallback across up to 3 attempts)
- Store mutable state (deep-freeze + structured clone for state reads)
