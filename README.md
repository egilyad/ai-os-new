# SuperAgents OS

> **Browser-based cognitive orchestration system** — local-first, privacy-preserving, multi-agent runtime environment.

SuperAgents OS is an event-driven platform for orchestrating distributed intelligence. It brings together multiple LLM providers, agent roles, memory systems, and cognitive pipelines into a unified browser-based operating system — all data stays on your machine.

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev)
[![Dexie](https://img.shields.io/badge/Dexie-4-4B8BBE?logo=indexeddb)](https://dexie.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
  - [Provider Management](#provider-management)
  - [Chat & Execution](#chat--execution)
  - [Agent System](#agent-system)
  - [Memory Mesh](#memory-mesh)
  - [Cognitive Builder](#cognitive-builder)
  - [Debate Arena](#debate-arena)
  - [Telemetry & Monitoring](#telemetry--monitoring)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

SuperAgents OS reimagines the browser as an AI operating system. Every component — routing, memory, tool execution, agent orchestration — runs locally in your browser via Web Workers and IndexedDB. No server, no cloud dependency.

**Key principles:**

- **Local-first**: API keys stored locally in IndexedDB, never leave your browser
- **Event-driven**: All communication flows through a typed EventBus — panels and services are decoupled
- **Multi-strategy routing**: UCB1 bandit, broadcast, race, cost-optimized, and more
- **Pluggable providers**: Gemini, OpenRouter, Groq, NVIDIA, OpenAI-compatible, and custom endpoints

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                      UI Layer                        │
│  React components, Zustand stores                    │
│  (imports services + contracts only)                 │
└────────────────────────┬────────────────────────────┘
                          │ EventBus
┌────────────────────────▼────────────────────────────┐
│                   Kernel Layer                        │
│  SystemKernel  EventBus  Container  Bootstrap        │
│  KeyService  RouterService  MemoryService            │
│  RotationService  AdvisorService  ToolService        │
│  Contracts (96+)  Events (216+)  State  Types        │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│               Infrastructure Layer                    │
│  LLM adapters (OpenRouter, Gemini, Groq, NVIDIA)     │
│  Web Workers (memory.worker, sandbox.worker)         │
│  Dexie (IndexedDB) — sessions, keys, memory, traces  │
└─────────────────────────────────────────────────────┘
```

The system is built on three design patterns:

1. **Reducer pattern** (like Redux) — `SystemKernel` processes all mutations through a pure `reduce()` function
2. **Event sourcing** — every action is an event on the `EventBus`; state is derived from event history
3. **Service-oriented architecture** — each domain has an isolated service with its own persistence

---

## Features

### Provider Management

Connect any LLM provider through API keys. Keys are stored in IndexedDB (browser storage) and never leave your machine.

> **⚠️ Security note:** API keys are currently stored **in plaintext** in browser storage — they can be read by any code running in this browser profile. Treat this as a single-user, single-machine tool (equivalent to keeping keys in a `.env` file) and **do not use it on shared machines**.

**Supported providers:**

| Provider                                           | Streaming          | Health Check | Model Discovery |
| -------------------------------------------------- | ------------------ | ------------ | --------------- |
| **Gemini**                                         | ✅ (native SSE)    | ✅           | ✅              |
| **OpenRouter**                                     | ✅                 | ✅           | ✅              |
| **Groq** (via OpenAI-compatible)                   | ✅                 | ✅           | Partial         |
| **NVIDIA NIM**                                     | ✅                 | ✅           | ✅              |
| **OpenAI**                                         | ✅                 | ✅           | ✅              |
| **Cerebras** (via OpenAI-compatible)               | ✅                 | ✅           | Partial         |
| **Cloudflare** (via OpenAI-compatible)             | ✅                 | ✅           | Partial         |
| **Azure** (via OpenAI-compatible, user-configured) | ✅                 | ✅           | —               |
| **Anthropic**                                      | ❌ not implemented | —            | —               |
| **Custom**                                         | Depends            | Depends      | —               |

Each provider adapter wraps the vendor API through a decorator chain:

```
Request → Logging → Cache → CostManager → PriorityQueue → CircuitBreaker → Retry → RateLimit → Adapter
```

### Chat & Execution

- **Streaming responses** from any connected provider
- **Multi-provider execution modes**: single, broadcast (all), race (fastest wins)
- **Split-view comparison** — see multiple provider responses side-by-side
- **Smart routing**: UCB1 multi-armed bandit balances latency, cost, and reliability
- **Memory-enhanced prompts**: automatic retrieval of relevant past conversations

### Agent System

Define agent personas with system prompts, temperature, and model selection.

| Feature              | Status         |
| -------------------- | -------------- |
| CRUD roles           | ✅ Full        |
| Spawn from template  | ✅ 10 presets  |
| Bulk pause/resume    | ✅             |
| Skills registration  | ✅             |
| Topology integration | ✅             |
| Observability tab    | ⏳ Placeholder |

### Memory Mesh

Hybrid search combining keyword and semantic retrieval:

- **BM25 full-text search** via Orama (runs in Web Worker)
- **Semantic search** via Transformers.js (`all-MiniLM-L6-v2`, 384-dim embeddings)
- **Cosine similarity** scoring for semantic results
- **Hybrid mode**: auto-selects between BM25 and embeddings based on query
- **Automatic storage**: every cognitive step is logged and indexed

### Cognitive Builder

Visual workflow builder for creating multi-node cognitive pipelines using React Flow.

| Feature               | Status |
| --------------------- | ------ |
| Visual node editor    | ✅     |
| Deploy to engine      | ✅     |
| Save/Load workflow    | ✅     |
| Drag-and-drop palette | ⏳     |
| Undo/redo             | ⏳     |

### Debate Arena

Multi-agent debate system with configurable strategies and comprehensive metrics:

- **3 positions**: Pro, Con, Neutral
- **13 strategies** (33 built-in presets): Round-robin, Moderated, Free-for-all, Socratic Method, Argument Tree, Constrained Debates
- **25 agent workforce**: Distinct roles, prompts, temperatures, tools, models
- **Debate temperature slider**: Pure Logic → Balanced → Pure Emotion tone control
- **Structural graph metrics**: Depth, branching, orphan rate, challenge/refinement density
- **Constraint compliance scoring**: 6 constraint types (facts-only, emotional, data-driven, etc.)
- **Post-debate interpretation**: Disagreement timeline, trajectory changers, constraint correlation, insights
- **Activity heatmap**: Per-agent activity levels, most-discussed arguments
- **Round timeline**: Visual round-by-round progression with intensity bars
- **Quality metrics**: Depth (lexical diversity, topic breadth), Originality (self/cross-repetition), Usefulness (relevance, evidence, structure)
- **Convergence scoring**: Semantic similarity (Transformers.js) with Jaccard fallback
- **Human-in-the-loop**: Inject arguments mid-debate
- **Circuit breaker** for LLM calls

### Telemetry & Monitoring

| Panel         | Purpose                                                  |
| ------------- | -------------------------------------------------------- |
| **Dashboard** | Aggregate metrics, cost tracking, provider health        |
| **Traces**    | Cognitive trace viewer with DecisionGraph and Microscope |
| **Health**    | Per-provider latency, error rates, throughput            |
| **Hive**      | Animated topology visualization of active agents         |
| **Analytics** | Historical performance charts                            |

---

## Tech Stack

| Category         | Technology                                         |
| ---------------- | -------------------------------------------------- |
| **Language**     | TypeScript 6.x                                     |
| **UI Framework** | React 19.x                                         |
| **Build Tool**   | Vite 8.x                                           |
| **Database**     | Dexie.js (IndexedDB wrapper)                       |
| **State**        | React hooks + EventBus (custom typed event system) |
| **Workflows**    | React Flow (@xyflow/react 12.x)                    |
| **Search**       | Orama (BM25) + Transformers.js (embeddings)        |
| **Workers**      | Web Workers (memory, sandbox execution)            |
| **Animation**    | Framer Motion 12.x                                 |
| **Icons**        | Lucide React                                       |
| **Validation**   | Zod 4.x                                            |
| **Testing**      | Vitest + React Testing Library                     |
| **Charts**       | Custom SVG + Recharts                              |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 22.0.0
- **npm** ≥ 9.x
- A modern browser (Chrome, Firefox, Edge, Safari)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/n95887174-source/ai-os-new
cd ai-os-new

# Install dependencies
npm install

# Start everything (dev server + proxy + typecheck)
npm run dev:shared
```

Or for separate terminals:

```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Proxy for sandboxed tool execution
npm run proxy
```

Open `http://localhost:5173` in your browser.

### First Steps

1. **Add a provider key** — Navigate to **Providers → Installed → Add Key**. Start with OpenRouter (free tier available).
2. **Test the connection** — The system automatically runs a health check; verify green status.
3. **Start chatting** — Open **Chat** panel, select your provider, and send a message.
4. **Explore agents** — Go to **Roles** to create agent personas, then **Skills** to register capabilities.
5. **Build a workflow** — Use **Builder** to connect cognitive nodes visually and deploy.

---

## Project Structure

```
src/
├── kernel/              # Kernel (DI, contracts, services, events, state)
│   ├── contracts/       # 123 contract interfaces (IKeyVault, IProviderAdapter, etc.)
│   ├── services/        # 299 files across 18 subdirs (key-management, provider-runtime,
│   │                   #   debate-runtime, debate-governor, agent-diversity,
│   │                   #   routing-policy, rotation, cognitive-intelligence,
│   │                   #   event-sourcing, advisor, runtime-intelligence,
│   │                   #   storage, memory, research-adapters, debate-interpreter, etc.)
│   ├── events/          # Event registry: 198 registered schemas (event-registry.ts)
│   ├── types/           # Zod schemas, domain types
│   ├── state/           # State shapes + defaults
│   ├── utils/           # Kernel utilities
│   ├── bootstrap.ts     # Phase-based init (System→Kernel→Database→Topology→Services)
│   ├── container.ts     # DI container
│   ├── event-bus.ts     # Typed EventBus with onSafe<K>() Zod validation
│   ├── kernel.ts        # Reducer-pattern state machine
│   ├── runtime.ts       # LifecycleManager (init→start→destroy LIFO)
│   ├── transaction.ts   # TransactionContext (deferred persistence/emission)
│   ├── instances.ts     # 126 lazyService singleton exports
│   └── DEPENDENCY_MAP.md
├── components/          # 145 UI panels across 9 nav sections
│   ├── ChatPanel/       # Chat interface with streaming
│   ├── BuilderPanel/    # Visual cognitive workflow editor
│   ├── AgentsPanel/     # Agent role management + consortia
│   ├── ProviderManager/ # API key management suite
│   ├── DebatePanel/     # Multi-agent debate visualization + runtime
│   ├── DebateLive/      # Circular live debate view
│   ├── RolesPanel/      # Unified role registry (610+ roles, 37 consilia)
│   ├── MemoryPanel/     # Memory palace (7-store architecture)
│   ├── ResearchPanel/   # Research engine (23+ API sources)
│   ├── Editors/         # TipTap, Monaco, DSL Canvas, JSON Schema editors
│   └── ... (Cache, Webhooks, Budget, Rotations, Health, DocsHealth,
│           Traces, Analytics, Audience, Guardians, Deploy, Workflows,
│           Prompts, Security, GoogleStudio, GeminiLive, EvalDatasets,
│           CustomMetrics, Aquarium, Ecosystem, etc.)
├── kernel/workers/      # Web Workers (2 files)
│   ├── memory.worker.ts   # Web Worker: BM25 + semantic search
│   └── sandbox.worker.ts  # Web Worker: AST-based code validation
├── llm/                 # LLM provider adapters (7 adapters, 25 supported names, 11 decorators)
│   ├── gemini/          # Gemini adapter + Google GenAI SDK integration
│   ├── openai-compatible/ # OpenAI-compatible (Groq, Cerebras, Cloudflare, etc.)
│   ├── openrouter/      # OpenRouter adapter
│   ├── nvidia/          # NVIDIA NIM adapter
│   └── decorators/      # Circuit Breaker, Cache, Retry, Fallback, Rate Limiter, etc.
├── stores/              # React state stores
│   ├── useChatStore.ts  # Chat sessions & messages
│   ├── useKeyStore.ts   # API key management (StorageAdapter-backed)
│   └── debateLiveStore.ts # Live debate streaming state
├── types/               # Re-exports from kernel/types/
├── i18n/                # Internationalization (en.ts, ru.ts, I18nProvider)
├── styles/              # CSSProperties constants (common.ts — 302 constants)
├── routes.tsx            # ~70 routes across 9 nav sections
└── tests/               # Test setup and config
```

---

## Configuration

### Environment Variables

Create `.env` in the project root:

See `.env.example` for all available variables. Provider proxy targets default in `vite.config.ts` and can be overridden via `VITE_PROXY_*` env vars.

### Tool Execution Proxy

A lightweight CORS proxy is required for sandboxed tool execution (configured via `VITE_PROXY_URL` in `.env`):

```bash
npm run proxy
```

### SLA Configuration

Adjust routing behavior in **Settings → SLA Mode**:

| Mode             | Behavior                                                           |
| ---------------- | ------------------------------------------------------------------ |
| **LOW_LATENCY**  | Prioritize lowest latency                                          |
| **ECONOMY**      | Prioritize cheapest provider                                       |
| **BALANCED**     | Equal weight to latency, cost, reliability                         |
| **HIGH_QUALITY** | Prioritize highest success rate                                    |
| **FREE_FIRST**   | Use free-tier models until quota exhausted, then fall back to paid |

---

## Scripts

| Script                          | Description                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`                   | Start development server (HMR)                                               |
| `npm run build`                 | TypeScript check + production build                                          |
| `npm run preview`               | Preview production build                                                     |
| `npm run test`                  | Run all tests (Vitest)                                                       |
| `npm run test:ui`               | Run tests with UI dashboard                                                  |
| `npm run test:e2e`              | Run Playwright e2e tests                                                     |
| `npm run lint`                  | ESLint check                                                                 |
| `npm run typecheck`             | TypeScript check (no emit)                                                   |
| `npm run lint:staged`           | Lint staged files                                                            |
| `npm run check:circular-kernel` | Check circular deps in kernel                                                |
| `npm run check:deps`            | Check unused/missing dependencies                                            |
| `npm run proxy`                 | Start CORS proxy server                                                      |
| `npm run build:skip-typecheck`  | Vite build WITHOUT typecheck (prints warning — use only for quick iteration) |
| `npm run sourcemaps:upload`     | Upload hidden sourcemaps to Sentry/Datadog (no-op without credentials)       |
| `npm run check:deps:graph`      | Generate dependency graph SVG                                                |
| `npm run dev:shared`            | Runs Vite + sync-server together                                             |
| `npm run fix:unused`            | Remove unused exports                                                        |
| `npm run prepare`               | Install husky hooks                                                          |
| `npm run sync-server`           | Start collaboration sync server                                              |
| `npm run test:watch`            | Watch mode tests                                                             |
| `npm run typecheck:watch`       | Watch mode type checking                                                     |

---

## Documentation

| Document                                                   | Description                                             |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| [System Manifest](./docs/SYSTEM_MANIFEST.md)               | Architecture principles and design decisions            |
| [Full Registry (RU)](./docs/ПОЛНЫЙ_РЕЕСТР.md)              | Complete system passport: 246 entries across all layers |
| [Services Catalog (RU)](./docs/SERVICES_RU.md)             | All 277 DI services with purpose, events, lifecycle     |
| [UI Layer (RU)](./docs/07-ui-layer_RU.md)                  | All 145 panels with categories, event maps              |
| [Event Reference](./docs/events.md)                        | 141+ typed events with payloads and Zod schemas         |
| [Cognitive Runtime Spec](./docs/COGNITIVE_RUNTIME_SPEC.md) | Event data and runtime specification                    |
| [Architecture (RU)](./docs/01-system-architecture_RU.md)   | System architecture overview                            |
| [Debt Report](./docs/DEBT_REPORT.md)                       | Technical debt assessment                               |

---

## Contributing

Contributions are welcome! The project is in active development.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Guidelines

- Follow existing code style and patterns
- Add tests for new functionality
- Ensure TypeScript strict mode passes (`npx tsc -b --noEmit`)
- Update documentation as needed

---

## License

MIT © 2026 Antigravity

---

<p align="center">
  <i>Built with TypeScript, React, and 🧠</i>
</p>
