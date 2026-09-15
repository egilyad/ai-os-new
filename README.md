# SuperAgents OS

> **Browser-based cognitive orchestration system** — local-first, privacy-preserving, multi-agent runtime environment.

SuperAgents OS is an event-driven platform for orchestrating distributed intelligence. It brings together multiple LLM providers, agent roles, memory systems, and cognitive pipelines into a unified browser-based operating system — all data stays on your machine.

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev)
[![Dexie](https://img.shields.io/badge/Dexie-4-4B8BBE?logo=indexeddb)](https://dexie.org)
[![Vitest](https://img.shields.io/badge/Vitest-3-6E9F18?logo=vitest)](https://vitest.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
  - [52 Agent Workforce](#52-agent-workforce)
  - [52 Role Templates](#52-role-templates)
  - [Provider Management](#provider-management)
  - [Chat & Execution](#chat--execution)
  - [Agent Channels (mIRC-like)](#agent-channels-mirc-like)
  - [Debate Arena](#debate-arena)
  - [Conversation Director](#conversation-director)
  - [Memory Mesh](#memory-mesh)
  - [Cognitive Modules](#cognitive-modules)
  - [AGEMS Port (Phases 0–12)](#agems-port-phases-0-12)
  - [Telemetry & Monitoring](#telemetry--monitoring)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
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
- **52 specialized agents**: English technical + Russian scientific/cognitive roles

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
│  Contracts (280+)  Events (480+)  State  Types       │
│  Service Registration (100+ phases)                   │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│               Infrastructure Layer                    │
│  LLM adapters (11 providers, 11 decorators)          │
│  Web Workers (memory, sandbox execution)             │
│  Dexie v44 (IndexedDB) — 130+ tables                 │
└─────────────────────────────────────────────────────┘
```

---

## Features

### 52 Agent Workforce

52 specialized agents across technical, analytical, creative, management, scientific, social, and medical domains:

| Category | Agents |
|----------|--------|
| **Technical** (6) | System Architect, Security Engineer, DevOps Engineer, Database Engineer, Network Engineer, Performance Engineer |
| **Analytical** (5) | Critical Auditor, Data Scientist, Risk Analyst, Research Analyst, Quality Engineer |
| **Creative** (4) | Creative Visionary, Product Designer, Content Strategist, UX Researcher |
| **Management** (3) | Project Manager, Product Owner, Team Lead |
| **Documentation** (5) | Documentation Architect, Documentation Auditor, Documentation Simplifier, Documentation Historian, Consistency Checker |
| **Russian Cognitive** (6) | Генератор идей, Критик, Аналитик, Защитник решения, Модератор, Факт-чекер |
| **Russian Knowledge** (4) | Секретарь, Эрудит, Организатор, Эксперт |
| **Russian Communication** (3) | Коммуникатор, Реализатор, Систематизатор |
| **Russian Science** (6) | Математик, Физик, Химик, Биолог, Информатик, Экономист |
| **Russian Social** (5) | Статистик, Социолог, Психолог, Философ, Юрист |
| **Russian Medical** (3) | Криптограф, Врач, Эколог |

Each agent has:
- Curated identity (name, avatar, specializations)
- Russian system prompt with role-specific instructions
- Provider/model assignment (groq, openrouter, nvidia)
- Router → agent → aggregator topology edges

### 52 Role Templates

52 role templates for quick agent creation via the Roles panel. Each template includes name, description, system prompt, tools, and temperature.

### Provider Management

Connect any LLM provider through API keys. Keys are stored in IndexedDB (browser storage) and never leave your machine.

> **⚠️ Security note:** API keys are currently stored **in plaintext** in browser storage — they can be read by any code running in this browser profile. Treat this as a single-user, single-machine tool and **do not use it on shared machines**.

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
- **Tool loop detection** and **smart retry** with exponential backoff

### Agent Channels (mIRC-like)

Real-time agent communication channels:

- **Channel creation** with topic, description, and member management
- **Real-time message streaming** via EventBus
- **Agent presence** tracking (online/offline/typing)
- **Message history** with Dexie persistence
- **Cross-channel context** via ContextBuilderService

### Debate Arena

Multi-agent debate system with configurable strategies and comprehensive metrics:

- **3 positions**: Pro, Con, Neutral
- **13 strategies** (33 built-in presets): Round-robin, Moderated, Free-for-all, Socratic Method, Argument Tree, Constrained Debates
- **52 agent workforce**: Distinct roles, prompts, temperatures, tools, models
- **Debate temperature slider**: Pure Logic → Balanced → Pure Emotion tone control
- **Structural graph metrics**: Depth, branching, orphan rate, challenge/refinement density
- **Constraint compliance scoring**: 6 constraint types (facts-only, emotional, data-driven, etc.)
- **Post-debate interpretation**: Disagreement timeline, trajectory changers, constraint correlation, insights
- **Activity heatmap**: Per-agent activity levels, most-discussed arguments
- **Quality metrics**: Depth, Originality, Usefulness
- **Convergence scoring**: hash-based embeddings (FNV) + cosine similarity with Jaccard fallback
- **Human-in-the-loop**: Inject arguments mid-debate
- **Circuit breaker** for LLM calls
- **Multi-session support**: Concurrent debates with per-session store projection

### Conversation Director

Scenario-based conversation orchestration:

- **Scenario CRUD**: Create, edit, duplicate, archive conversation scenarios
- **Turn-based execution**: Ordered turns with participant assignment and objective types
- **Runtime controls**: Run, Pause, Resume, Skip, Override, Abort
- **Live status tracking**: Real-time turn progress and completion
- **Event integration**: `conversation:*` events for observability

### Memory Mesh

Hybrid retrieval combining keyword and lightweight vector search (no external model):

- **BM25 full-text search** via Orama (runs in Web Worker)
- **Hash-based embeddings** (FNV / word-level hashing, zero dependencies) with cosine similarity
- **Hybrid mode**: auto-selects between BM25 and embeddings based on query
- **Automatic storage**: every cognitive step is logged and indexed

### Cognitive Modules

7 cognitive modules for knowledge processing:

| Module | Purpose |
|--------|---------|
| **Lenses** | Apply analytical perspectives to content |
| **Crystal Vault** | Knowledge crystallization and lifecycle management |
| **Junction Engine** | Detect connections between concepts |
| **Synthesis Engine** | Multi-perspective synthesis with consensus zones |
| **Knowledge Generator** | Automated knowledge creation with peer review |
| **Agent Forum** | Discussion and debate on knowledge topics |
| **Builder Agent** | Visual workflow builder for cognitive pipelines |

### AGEMS Port (Phases 0–12)

Full port of the AGEMS agent management system:

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Agent Management System | ✅ |
| 1 | Agent Types + Config | ✅ |
| 2 | Tasks System (Kanban) | ✅ |
| 3 | Approvals / HITL | ✅ |
| 4 | Budgets | ✅ |
| 5 | Meetings | ✅ |
| 6 | Skills + Tools | ✅ |
| 7 | Settings + UI | ✅ |
| 8 | Catalog/Marketplace | ✅ |
| 9 | Security + Audit | ✅ |
| 10 | Integrations (Telegram, N8N, MCP) | ✅ |
| 11 | Chat System (Dock, Queuing, Context) | ✅ |
| 12 | AI Runner Enhancements | ✅ |

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
| **Database**     | Dexie.js v44 (IndexedDB wrapper, 130+ tables)      |
| **State**        | Zustand + React hooks + EventBus                    |
| **Workflows**    | React Flow (@xyflow/react 12.x)                    |
| **Search**       | Orama (BM25) + hash-based embeddings (FNV)         |
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
git clone https://github.com/egilyad/ai-os-new.git
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
4. **Explore agents** — Go to **Agents** to see 52 pre-configured agents, or **Roles** to create custom personas.
5. **Start a debate** — Go to **Debate** and launch a multi-agent discussion.
6. **Build a workflow** — Use **Builder** to connect cognitive nodes visually and deploy.

---

## Project Structure

```
src/
├── kernel/              # Kernel (DI, contracts, services, events, state)
│   ├── contracts/       # 280+ contract interfaces
│   ├── services/        # 890+ service implementation files
│   │   ├── agent-management/    # AGEMS agent management
│   │   ├── task-manager/        # Task system with Kanban
│   │   ├── approval-service/    # HITL approval workflows
│   │   ├── meeting-service/     # Meeting management
│   │   ├── catalog-service/     # Agent/skill marketplace
│   │   ├── audit-service/       # Security audit logging
│   │   ├── integration-service/ # Telegram, N8N, MCP
│   │   ├── chat-queue/          # Message queuing
│   │   ├── context-builder/     # Cross-channel context
│   │   ├── debate-runtime/      # Debate engine + governor
│   │   ├── key-management/      # API key vault
│   │   ├── provider-runtime/    # LLM provider adapters
│   │   ├── memory/              # Memory mesh (BM25 + hash embeddings)
│   │   ├── routing-policy/      # Smart routing (UCB1 bandit)
│   │   └── ... (30+ more subdirs)
│   ├── agents/          # 6 registry-canonical agent definitions
│   ├── dal/             # Data Access Layer (Dexie)
│   ├── events/          # Event registry: 480+ events
│   ├── state/           # Topology defaults (52 agents)
│   ├── types/           # Zod schemas, domain types
│   ├── bootstrap.ts     # Phase-based init (100+ phases)
│   ├── container.ts     # DI container
│   ├── event-bus.ts     # Typed EventBus with dead-letter queue
│   └── instances.ts     # Lazy singleton exports
├── components/          # 790+ UI files across 9 nav sections
│   ├── AgentsPanel/     # Agent management + avatars
│   ├── ChatPanel/       # Chat interface with streaming
│   ├── BuilderPanel/    # Visual cognitive workflow editor
│   ├── DebatePanel/     # Multi-agent debate visualization
│   ├── DirectorPanel/   # Conversation Director
│   ├── RolesPanel/      # Role registry (52 builtin + custom)
│   ├── MemoryPanel/     # Memory palace (7-store architecture)
│   ├── TasksPanel/      # Kanban board + task management
│   ├── ApprovalPanel/   # HITL approval workflows
│   ├── MeetingsPanel/   # Meeting management
│   ├── AuditPanel/      # Security audit logging
│   ├── IntegrationsPanel/ # Telegram, N8N, MCP
│   ├── RoomPanel/       # Agent rooms (invocation engine)
│   ├── ForumPanel/      # Agent forum
│   ├── CrystalVaultPanel/ # Knowledge crystals
│   ├── SynthesisPanel/  # Multi-perspective synthesis
│   └── ... (50+ more panels)
├── llm/                 # LLM provider adapters (7 adapters, 11 decorators)
│   ├── gemini/          # Gemini adapter
│   ├── openai-compatible/ # OpenAI-compatible (Groq, Cerebras, etc.)
│   ├── openrouter/      # OpenRouter adapter
│   ├── nvidia/          # NVIDIA NIM adapter
│   └── decorators/      # Cache, Retry, CircuitBreaker, etc.
├── stores/              # Zustand stores (22 files)
├── i18n/                # Internationalization (en/ru)
├── styles/              # CSS tokens + variables (7 themes)
└── tests/               # Test setup and config
```

---

## Scripts

| Script                          | Description                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`                   | Start development server (HMR)                                               |
| `npm run build`                 | TypeScript check + production build                                          |
| `npm run test`                  | Run all tests (Vitest)                                                       |
| `npm run lint`                  | ESLint check                                                                 |
| `npm run typecheck`             | TypeScript check (no emit)                                                   |
| `npm run typecheck:fast`        | Fast typecheck (src/ only)                                                   |
| `npm run proxy`                 | Start CORS proxy server                                                      |
| `npm run dev:shared`            | Runs Vite + sync-server together                                             |
| `npm run check:circular-kernel` | Check circular deps in kernel                                                |

---

## Documentation

| Document                                                   | Description                                             |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| [System Manifest](./docs/SYSTEM_MANIFEST.md)               | Architecture principles and design decisions            |
| [AGEMS Roadmap](./docs/road/AGEMS_ROADMAP.md)              | AGEMS port phases 0–12 roadmap                          |
| [Consolidated Plan](./docs/new/CONSOLIDATED_PLAN.md)       | Full project plan and status                            |
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
- Ensure TypeScript strict mode passes (`npm run typecheck:fast`)
- Update documentation as needed

---

## License

MIT © 2026 Antigravity

---

<p align="center">
  <i>Built with TypeScript, React, and 52 AI agents</i>
</p>
