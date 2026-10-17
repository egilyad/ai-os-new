# SuperAgents OS

> **Browser-based cognitive orchestration system** — local-first, privacy-preserving, multi-agent runtime environment.

**Language:** English · [Русский](./README.md) — русская вики-версия (портал документации).

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
  - [Execution Trail](#execution-trail-team-supervision)
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
| **Anthropic**                                      | ✅ (SSE + vision, computer-use loop) | ✅ | — |
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
- **Debate RAG**: round arguments indexed every round, chunks persisted across reloads

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
- **33 built-in strategies** (full tables below): Round-robin, Moderated, Free-for-all, Socratic Method, Argument Tree, Constrained Debates, …
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
- **Rich answers**: Markdown rendering — links (incl. bare URLs), images with graceful fallback, code highlight + run, tables, Mermaid diagrams
- **Live web research**: Grounded search once per round, shared by all participants, cited as clickable sources
- **Repetition gate & outcome validator**: Cross-agent duplicate detection with pre-prompt warning; synthesis groundedness + contradiction-consistency checks
- **Source credibility & triangulation**: Tiered source scoring, real-URL citation plumbing, never-invent-URLs rule
- **Recoverable history**: Failed/cancelled debates persist with arguments; fact-check joins work across id namespaces; reload-verified snapshots

<!-- README-MAPS:STRATEGIES:BEGIN -->
_Generated from code on 2026-10-17 by `node scripts/gen-readme-maps.mjs` — do not hand-edit, re-run the script._

<details>
<summary><b>All 33 built-in debate strategies (from code)</b></summary>

| Strategy | ID | What it does |
| -------- | -- | ----------- |
| **Round Robin** | `builtin.round_robin` | Classic sequential round-robin where each agent speaks once per round |
| **Socratic Method** | `builtin.socratic` | Question-driven inquiry that probes assumptions through iterative questioning |
| **Argument Tree** | `builtin.argument_tree` | Tree-structured argumentation with challenges and refinements |
| **Constrained Debate** | `builtin.constrained` | Debate with specific constraints on argument structure and evidence requirements |
| **Moderated Debate** | `builtin.moderated` | Debate with a neutral moderator controlling flow and enforcing rules |
| **Free-for-All** | `builtin.free_for_all` | Multiple agents debate simultaneously without turn ordering |
| **Jury Trial** | `builtin.jury_trial` | Adversarial format with prosecution, defense, witnesses, and jury |
| **Brainstorming** | `builtin.brainstorming` | Free-form idea generation without critique, followed by clustering |
| **Delphi Method** | `builtin.delphi` | Iterative anonymous consensus-building with controlled feedback |
| **Debate-athon** | `builtin.debate_athon` | Extended marathon format with multiple rounds, breaks, and endurance scoring |
| **Meta-Debate** | `builtin.meta_debate` | Debate about the debate itself — rules, framing, methodology |
| **Post-Mortem / Autopsy** | `builtin.autopsy` | Retrospective analysis of a past event, decision, or failure |
| **Simulated Negotiation** | `builtin.simulated_negotiation` | Role-play negotiation between parties with competing interests |
| **Premortem** | `builtin.premortem` | Assume a project has failed and work backwards to identify what went wrong |
| **Red Teaming** | `builtin.red_teaming` | Adversarial testing where one team attacks and another defends |
| **Rhetorical Triangle** | `builtin.rhetorical_triangle` | Analyze arguments through ethos, pathos, and logos lenses |
| **Evidence-Based Policy Debate** | `builtin.evidence_based_policy` | Policy debate requiring cited evidence for each claim |
| **Principle-Based Negotiation** | `builtin.principle_based_negotiation` | Harvard-style principled negotiation focusing on interests not positions |
| **Uncertainty Quantification** | `builtin.uncertainty_quantification` | Systematically identify and quantify uncertainties in arguments |
| **Multi-Criteria Decision Analysis** | `builtin.multi_criteria` | Evaluate options against multiple weighted criteria |
| **Stakeholder Mapping** | `builtin.stakeholder_mapping` | Identify and analyze stakeholders, their interests, and influence |
| **Cross-Examination** | `builtin.cross_examination` | Intense back-and-forth questioning between two parties |
| **Trial by Argument** | `builtin.trial` | Full trial format with opening, evidence, witnesses, closing, and verdict |
| **Parliamentary Debate** | `builtin.parliamentary` | Formal debate with government and opposition teams following parliamentary procedure |
| **Oxford Union Debate** | `builtin.oxford_union` | Traditional Oxford Union format with proposition, opposition, and floor votes |
| **Lincoln-Douglas Debate** | `builtin.lincoln_douglas` | Values-based one-on-one debate with structured case construction |
| **Spontaneous Argumentation** | `builtin.spontaneous_argumentation` | Impromptu arguments with minimal preparation, testing quick thinking |
| **Asynchronous Marathon** | `builtin.asynchronous_marathon` | Extended multi-day debate where agents respond at their own pace |
| **Flash Debate** | `builtin.flash_debate` | Ultra-fast debate with very short response times and limited characters |
| **Collaborative Consensus** | `builtin.collaborative_consensus` | Non-adversarial format focused on finding common ground and shared understanding |
| **Scenario Testing** | `builtin.scenario_testing` | Test assumptions by exploring multiple hypothetical scenarios |
| **Hypothesis Testing** | `builtin.hypothesis_testing` | Scientific method approach: hypothesis, test, evidence evaluation, conclusion |
| **Contest Mode** | `builtin.contest_mode` | Competitive format with judges scoring each round, winner declared at end |

</details>
<!-- README-MAPS:STRATEGIES:END -->

<!-- README-MAPS:TECHNIQUES:BEGIN -->
_Generated from code on 2026-10-17 by `node scripts/gen-readme-maps.mjs` — do not hand-edit, re-run the script._

<details>
<summary><b>All 75 debate quality techniques (from code)</b></summary>

**P0** (18)

- **Cross-Examination** (`cross-examination`) — Directly question opponent claims, demand missing evidence
- **Delta-Focusing** (`delta-focusing`) — Highlight only points of disagreement, skip consensus
- **Shadow Opponent** (`shadow-opponent`) — Anticipate and pre-rebut unspoken counter-arguments
- **Adversarial Source** (`adversarial-source`) — Verify factual claims against source URLs, flag fabrications
- **Vulnerability Targeting** (`vulnerability-targeting`) — Identify and attack weakest claims in opponent argument graph
- **Agreement Anchoring** (`agreement-anchoring`) — Start from shared premises, then reveal logical inconsistencies
- **Belief Mining** (`belief-mining`) — Detect contradictions between stated positions and earlier claims
- **Graph Minimax** (`graph-minimax`) — Plan argument moves several steps ahead using argument graph
- **Meta-Agent** (`meta-agent`) — Tactical directives: when to attack, defend, pivot, or concede
- **Steelman** (`steelman`) — Strengthen opponent position before refuting — steelman fallacies
- **Burden of Proof** (`burden-of-proof`) — Track which claims remain unsupported; demand evidence
- **Entanglement** (`entanglement`) — Force opponent to defend two incompatible positions simultaneously
- **Consistency Check** (`consistency-check`) — Detect self-contradictions across rounds
- **Credibility Scoring** (`credibility-scoring`) — Track source reliability of each participant
- **Causal Loop Mapping** (`causal-graph`) — Force systems thinking: detect feedback loops and second-order effects
- **Objection Anticipation Slot** (`objection-anticipation`) — Dedicate a thinking slot to pre-rebut unspoken counter-arguments
- **Evidence Triangulation Requirement** (`evidence-triangulation`) — Require cross-referencing claims against multiple independent sources
- **Executable Evidence** (`executable-evidence`) — Write executable code (Python/JS) to numerically verify factual claims

**P1** (33)

- **Pre-Publish Critic** (`pre-publish-critic`) — Internal critic evaluates argument before release
- **Fact-Checking** (`fact-checking`) — Verify factual claims in real-time against knowledge base
- **Epistemic Calibration** (`epistemic-calibration`) — Enforce confidence calibration: penalize over/under-confidence
- **Socratic Pivot** (`socratic-pivot`) — Switch from arguing to questioning when opponent is inconsistent
- **Concession Engine** (`concession-engine`) — Monitor concession opportunities based on argument strength shift
- **Bayesian Judges** (`bayesian-judges`) — Reward acknowledging uncertainty and limitations
- **Stance Drift** (`stance-drift`) — Detect when agent silently changes position across rounds
- **Persona Mixer** (`persona-mixer`) — Blend multiple persona archetypes for richer argumentation
- **DPO Sampler** (`dpo-sampler`) — Sample argument styles from high-win-rate past debates
- **Self-Critic** (`critic`) — Pre-validate own argument before submission
- **Pivot Strategy** (`pivot`) — Change argument direction when current approach is failing
- **Strategic Concession** (`concession`) — Concede minor points to gain credibility on major ones
- **Counterfactual Analysis** (`counterfactual`) — Explore "what if" scenarios to test opponent logic
- **Synthesis Engine** (`synthesis`) — Combine best arguments from both sides into coherent whole
- **Triangulation** (`triangulation`) — Cross-reference claims against multiple independent sources
- **Empathy Mirroring** (`empathy`) — Acknowledge opponent perspective before refuting
- **Heat Detection** (`heat`) — Detect emotional escalation, adjust tone accordingly
- **Argument Sentinel** (`sentinel`) — Monitor for abandoned claims and re-introduce them
- **Redundancy Detector** (`redundancy`) — Penalize repeating same evidence or reasoning
- **Insight Bus** (`insight-bus`) — Broadcast cross-argument patterns to all agents
- **Replay Selector** (`replay`) — Re-engage with strongest unresolved points from earlier rounds
- **Enthymeme Attack** (`enthymeme`) — Target hidden premises in opponent arguments
- **Multi-Hop Reasoning** (`multi-hop`) — Require multi-step justification for complex claims
- **Bias Exploitation** (`bias-exploit`) — Identify and exploit opponent cognitive biases
- **Clarification Interrupt** (`interrupt`) — Send targeted clarification requests to ambiguous claims
- **Stakeholder Mapper** (`stakeholder`) — Map which groups are affected by each position
- **Frame Tracker** (`frame`) — Track how each side frames the issue, reframe strategically
- **Expert Witness** (`expert-witness`) — Cite relevant domain experts and their credibility scores
- **Hegelian Dialectical Synthesis** (`hegelian-synthesis`) — Push agents to synthesize thesis + antithesis into coherent resolution
- **Uncertainty Propagation** (`uncertainty-propagation`) — Explicitly propagate confidence levels through multi-step reasoning chains
- **Hidden Incentives Mining** (`hidden-incentives`) — Generate 3 reasoning branches, synthesize strongest into public argument
- **Semantic Concept Blending** (`semantic-blending`) — When deadlocked, invent new frameworks combining opposing concepts
- **Outcome Forecaster** (`outcome-forecaster`) — 

**P2** (24)

- **Rhetorical Device** (`rhetorical-device`) — Inject rhetorical devices (anaphora, tricolon, chiasmus)
- **Hidden Scratchpad** (`scratchpad`) — Internal deliberation before public response
- **Narrative Arc** (`narrative-arc`) — Structure arguments as story arcs (hero journey, mystery, etc.)
- **Abstraction Ladder** (`abstraction-ladder`) — Switch between concrete evidence and abstract principles
- **Role-Reversal** (`role-reversal`) — Occasionally argue from opponent perspective
- **Fog of War** (`fog-of-war`) — Limit information available to each agent
- **Evidence Revelation** (`evidence-revelation`) — Stage evidence release by round
- **Humor Injection** (`humor`) — Inject wit, irony, or analogy where appropriate
- **Status Dynamics** (`status-dynamics`) — Assign social status levels that affect persuasiveness
- **Style Matching** (`style-matching`) — Mirror opponent communication style
- **Dynamic Persona** (`dynamic-persona`) — Topic-matched persona variant selection
- **Strategist** (`strategist`) — Adaptive strategic directives (flank, fortify, probe, etc.)
- **Whisper Channels** (`whisper-channels`) — Private coordination signals between allied agents
- **Audience Sentiment** (`audience`) — Simulate audience reactions to each argument
- **Dynamic Alliance** (`alliance`) — Form and leverage coalitions between agents
- **Prediction Market** (`prediction-market`) — Agents predict debate trajectory, reputation on the line
- **Theory of Mind** (`rtom`) — Model other agents beliefs about the debate state
- **Strategy Fingerprinting** (`strategy-fingerprint`) — Detect and counter opponent debate strategies
- **Rhetoric Safety Layer** (`rhetoric-safety`) — Monitor for ad hominem, inflammatory language, and rhetorical manipulation
- **Blind Evaluation** (`blind-evaluation`) — Judge arguments without knowing which agent made them
- **Bidding for Speaking Time** (`bidding-time`) — Agents bid for speaking time — concise, high-impact arguments win the floor
- **Adaptive Speaking Order** (`adaptive-order`) — Shuffle speaking order dynamically based on argument patterns
- **Judge Deliberation** (`judge-deliberation`) — 
- **Best-of-N Selection** (`best-of-n`) — 

</details>
<!-- README-MAPS:TECHNIQUES:END -->

### Execution Trail (team supervision)

Durable record of what agents actually did — the foundation for a manager that diagnoses from facts, not messages:

- **Tool journal**: Every tool call (ToolService, ToolRunner, computer-use loop) lands in one persistent KV trail — success, error, and denied outcomes with run linkage (`runId`/`taskId`/`agentId`)
- **Real ProjectRun chain**: Run row first (`startRun`), tool names stored on completion, stale running runs failed loudly after 5 min (zombie sweep)
- **Memory that works**: Synthesis steps conclude reasoning chains (persona memory alive), snapshots prune only the saved copy, debate RAG index fed every round and persisted

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
| **Diagrams**     | Mermaid 12.x (rendered from fenced code blocks)    |
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
git clone https://github.com/egilyad/ai-os-new
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

<!-- README-MAPS:PANELS:BEGIN -->
_Generated from code on 2026-10-17 by `node scripts/gen-readme-maps.mjs` — do not hand-edit, re-run the script._

<details>
<summary><b>All 259 statically-wired nav panels by section (from code)</b></summary>

**DASHBOARD** (`dashboard`, 22)

- Overview (`dashboard`)
- Providers (`keys`)
- Knowledge (`knowledge`)
- Project OS Explorer (`project-os`)
- Cognitive Lenses (`lenses`)
- Crystal Vault (`crystals`)
- Junction Engine (`junctions`)
- Synthesis Engine (`synthesis`)
- Knowledge Generator (`knowledge-generator`)
- Agent Forum (`forum`)
- Workflows (`builder`)
- Conversation Director (`director`)
- Agent Rooms (`room`)
- Projects (`projects`)
- Channels (`channels`)
- Group Chat (`group-chat`)
- Scheduler (`scheduler`)
- Planner (`planner`)
- Autonomy (`autonomy`)
- Dyad (`dyad`)
- SOP (`sop`)
- Run Queue (`run-queue`)

**BUDGET AI** (`budget`, 7)

- Analytics (`analytics`)
- Economics (`pricing`)
- Budget (`budget`)
- Cost Analytics (`cost-analytics`)
- Cost Optimization (`cost-optimization`)
- Budget Alerts (`budget-alerts`)
- Company Costs (`costs`)

**CHAT** (`chat`, 4)

- Chat (`chat`)
- Chat Sessions (`chat-sessions`)
- Session Hub (`session-hub`)
- Bookmarks (`bookmarks`)

**DEBATES** (`debates`, 17)

- Debate Arena (`debate`)
- Debate Live (`debate-live`)
- Debate Rooms (`debate-workspace`)
- Debate Replay (`debate-replay`)
- Tournament (`debate-tournament`)
- Audience (`audience`)
- Argument Graph (`argument-graph`)
- Strategy Builder (`strategy-builder`)
- Debate Analysis (`debate-analysis`)
- Debate History (`debate-history`)
- Debates Manager (`debates-manager`)
- Topics (`topics`)
- Debate Templates (`debate-templates`)
- Debate Quality (`debate-quality`)
- Quality Impact (`quality-impact`)
- Experimental (`experimental`)
- Scratchpad (`scratchpad`)

**DEBATE STRATEGY & ANALYSIS** (`debate-strategy`, 4)

- Outcome Forecaster (`outcome-forecaster`)
- Minimax Planner (`minimax-planner`)
- Similarity (`similarity`)
- Drift Detector (`drift-detector`)

**TECHNIQUES** (`techniques`, 84)

- Steelman (`steelman`)
- Bayesian Judge (`bayesian-judge`)
- Blind Eval (`blind-eval`)
- Credibility (`credibility`)
- Calibration (`calibration`)
- Consistency (`consistency`)
- Frame Tracker (`frame-tracker`)
- Stance Drift (`stance-drift`)
- Insight Bus (`insight-bus`)
- Entanglement (`entanglement`)
- Anchoring (`anchoring`)
- Concept Blender (`concept-blender`)
- Belief Mining (`belief-mining`)
- Expert Witness (`expert-witness`)
- Rhetoric (`rhetoric`)
- Bias Profiler (`bias-profiler`)
- Incentive Detector (`incentive-detector`)
- Stakeholder (`stakeholder`)
- Persona Mixer (`persona-mixer`)
- BoP Tracker (`bop-tracker`)
- GoT Deliberation (`got-deliberation`)
- Shadow Opponent (`shadow-opponent`)
- Adversarial Source (`adversarial-source`)
- Vuln Targeting (`vuln-targeting`)
- Justification (`justification`)
- Logical Form (`logical-form`)
- Cross Examination (`cross-examination`)
- Delta Focusing (`delta-focusing`)
- Vulnerability Targeting (`vulnerability-targeting`)
- Agreement Anchoring (`agreement-anchoring`)
- Graph Minimax (`graph-minimax`)
- Burden Of Proof (`burden-of-proof`)
- Consistency Check (`consistency-check`)
- Credibility Scoring (`credibility-scoring`)
- Causal Graph (`causal-graph`)
- Pre Publish Critic (`pre-publish-critic`)
- Fact Checking (`fact-checking`)
- Epistemic Calibration (`epistemic-calibration`)
- Socratic Pivot (`socratic-pivot`)
- Concession Engine (`concession-engine`)
- Bayesian Judges (`bayesian-judges`)
- Dpo Sampler (`dpo-sampler`)
- Critic (`critic`)
- Pivot (`pivot`)
- Concession (`concession`)
- Triangulation (`triangulation`)
- Empathy (`empathy`)
- Heat (`heat`)
- Sentinel (`sentinel`)
- Redundancy (`redundancy`)
- Replay (`replay`)
- Enthymeme (`enthymeme`)
- Multi Hop (`multi-hop`)
- Bias Exploit (`bias-exploit`)
- Interrupt (`interrupt`)
- Frame (`frame`)
- Rhetorical Device (`rhetorical-device`)
- Narrative Arc (`narrative-arc`)
- Abstraction Ladder (`abstraction-ladder`)
- Role Reversal (`role-reversal`)
- Fog Of War (`fog-of-war`)
- Evidence Revelation (`evidence-revelation`)
- Humor (`humor`)
- Status Dynamics (`status-dynamics`)
- Style Matching (`style-matching`)
- Dynamic Persona (`dynamic-persona`)
- Strategist (`strategist`)
- Whisper Channels (`whisper-channels`)
- Alliance (`alliance`)
- Prediction Market (`prediction-market`)
- Rtom (`rtom`)
- Strategy Fingerprint (`strategy-fingerprint`)
- Objection Anticipation (`objection-anticipation`)
- Evidence Triangulation (`evidence-triangulation`)
- Hegelian Synthesis (`hegelian-synthesis`)
- Uncertainty Propagation (`uncertainty-propagation`)
- Rhetoric Safety (`rhetoric-safety`)
- Blind Evaluation (`blind-evaluation`)
- Bidding Time (`bidding-time`)
- Adaptive Order (`adaptive-order`)
- Executable Evidence (`executable-evidence`)
- Hidden Incentives (`hidden-incentives`)
- Semantic Blending (`semantic-blending`)
- Judge Deliberation (`judge-deliberation`)

**AGENTS** (`agents`, 15)

- Agents (`agents`)
- Roles (`roles`)
- Roles & Consortia (`roles-consortia`)
- SRE Agent (`sre`)
- Agent Journal (`agent-journal`)
- Mission Control (`mission`)
- Live Workspace (`live`)
- Agent Marketplace (`agent-marketplace`)
- Agent Comparison (`agent-comparison`)
- Agent Protocol (`agent-protocol`)
- Persona Marketplace (`persona-marketplace`)
- Persona Library (`persona-picker`)
- Skills (`skills`)
- Leaderboard (`leaderboard`)
- Meta Agent (`meta-agent`)

**DIAGNOSTICS** (`diagnostics`, 20)

- Activity Log (`logs`)
- Traces (`debugger`)
- Router Trace (`router-trace`)
- Memory (`memory`)
- Provider Health (`health`)
- System Status (`system-health`)
- Docs Health (`docs-health`)
- Pressure Map (`pressure`)
- Runtime Pressure (`runtime-pressure`)
- What-If (`what-if`)
- Dependency Graph (`dependency-map`)
- Diagnostics (`diagnostics`)
- State Inspector (`state-inspector`)
- Profiler (`performance-profiler`)
- Shadow Compare (`shadow`)
- Causal Debugger (`causal-debugger`)
- Counterfactual (`counterfactual`)
- Observability Gaps Scanner (`obs-gaps`)
- Health SLA (`health-sla`)
- Custom Metrics (`custom-metrics`)

**WIKI** (`wiki`, 1)

- Wiki (`wiki`)

**FLEET** (`fleet`, 12)

- Fleet Console (`fleet`)
- Fleet — Crews (`fleet-crews`)
- Fleet — Councils (`fleet-councils`)
- Fleet — Graphs (`fleet-graphs`)
- Fleet — Persona (`fleet-persona`)
- Fleet — Interop (`fleet-interop`)
- Fleet — Frontier (`fleet-frontier`)
- Companies (`companies`)
- Issues (`issues`)
- Heartbeat Runs (`runs`)
- Agent Tasks (`agent-tasks`)
- Provenance Graph (`provenance`)

**GOOGLE AI** (`google`, 4)

- Google Studio (`google-studio`)
- Google Cache (`google-cache`)
- Gemini Live (`gemini-live`)
- Research: Gemini AI (`research-gemini`)

**RESEARCH** (`research`, 7)

- Research Engine (`research-engine`)
- Debate System Research (`debate-system-research`)
- Research Reports (`research-reports`)
- Research: Advanced (`research-advanced`)
- Hypothesis Generator (`hypothesis-gen`)
- Rival Labs (`rival-labs`)
- Rivals Projects (`rivals-catalog`)

**INTEGRATIONS** (`integrations`, 1)

- Workflows (`workflows`)

**RANDOMS** (`randoms`, 2)

- Tutorials (`tutorials`)
- Template Sharing (`template-sharing`)

**AI PROVIDERS & KEYS** (`ai-providers`, 13)

- Key Pools (`pools`)
- Key Groups (`groups`)
- Key Notes (`key-notes`)
- Rotations (`rotations`)
- Session Bindings (`session-bindings`)
- Smart Routing 🧭 (`smart-routing`)
- Routing AI (`routing`)
- Provider Dashboard (`provider-dashboard`)
- Provider Marketplace (`provider-marketplace`)
- Key Usage Analytics (`key-usage-analytics`)
- Groq Speed ⚡ (`groq-speed`)
- NVIDIA Enterprise 🏢 (`nvidia-enterprise`)
- OpenRouter ◈ (`openrouter`)

**SYSTEM SERVICES** (`system`, 11)

- Tools (`tools`)
- Connectors (`connectors`)
- MCP Servers (`mcp`)
- Service Registry (`service-registry`)
- Topology Templates (`topology-templates`)
- Cache (`cache`)
- Webhooks (`webhooks`)
- Plugin SDK (`plugin-sdk`)
- Bridge-Keepers (`guardians`)
- Agent Adapters (`adapters`)
- Portability (`portability`)

**SECURITY & RULES** (`security`, 11)

- Settings (`settings`)
- Policies (`policies`)
- Policy Rules Engine (`policy-editor`)
- Audit Log (`audit`)
- Config History (`history`)
- Export / Import (`export-import`)
- Time Machine (`time-machine`)
- Governance / RBAC (`governance`)
- Guardrails (`guardrails`)
- Security Scan (`security`)
- Approvals (`approvals`)

**SYSTEM MEMORY** (`memory`, 3)

- Memory Palace (`memory-palace`)
- Federated Memory (`federated-memory`)
- Memory Export/Import (`memory-export-import`)

**LAB** (`lab`, 8)

- Eval Datasets (`eval-datasets`)
- Model Routing Experiments (`routing-experiments`)
- Model Playground (`playground`)
- A/B Testing (`ab-testing`)
- Architecture Review (`arch-review`)
- Prompt & Strategy Audit (`prompt-audit`)
- Simulation Lab (`simulation`)
- Governance Stress-Test (`gov-stress-test`)

**OTHER** (`other`, 13)

- Editors (`editors`)
- Prompt Library (`prompts`)
- Prompt Versions (`prompt-versions`)
- Batch Processing (`batch`)
- Team Collaboration (`team-collaboration`)
- Community Hub (`community-hub`)
- Model Distillation (`model-distillation`)
- Deploy to Production (`deploy`)
- Voice & Multimodal (`voice-input`)
- Aquarium (`aquarium`)
- Contribution Graph (`contribution-graph`)
- Tasks (`tasks`)
- Files (`files`)

> Technique panels under Debate Techniques are generated at build time
> by `node scripts/gen-technique-panels.mjs` from the quality-technique catalog.
</details>
<!-- README-MAPS:PANELS:END -->

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
| `npm run test:stable`           | Stable subset (stores, hooks, kernel, llm, tools)                            |
| `npm run test:server`           | Gateway/sidecar contract tests (node:test)                                   |
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
| `npm run gen:wiki-docs`         | Regenerate the markdown Wiki mirror under `docs/wiki`                        |
| `npm run gen:wiki-manifest`     | Regenerate the machine-readable index (`docs/manifest.json`)                 |
| `npm run gen:wiki-connections`  | Regenerate panel → route → component → tests links                           |
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
| [Debt Report](./docs/DEBT_REPORT.md)                       | Technical debt assessment                                |
| [Wiki (RU)](./docs/wiki/README.md)                         | Full system wiki: panels, agents, debates, memory, providers, diagnostics, history, dev guides |
| [manifest.json](./docs/manifest.json)                      | Machine-readable index: sections, articles (sources/tests/related), panels (route/component/article) |
| Wiki site (GitHub Pages)                                   | Static wiki with section menu, search and mermaid, built from the same mirror and served at `/wiki/` (`npm run gen:wiki-site`) |

### Wiki map

The full documentation lives in [docs/wiki](./docs/wiki/README.md) — the same material as the in-app **Wiki** panel, readable straight on GitHub. The mirror is also built into a static site with a section menu and search, published on GitHub Pages at `/wiki/` (`npm run gen:wiki-site` builds it locally).

#### Essentials

| Document | About |
| --- | --- |
| [What is SuperAgents OS](./docs/wiki/what-is.md) | Philosophy, how it differs from a chatbot |
| [Capabilities](./docs/wiki/capabilities.md) | Feature overview |
| [Using the panels](./docs/wiki/panels-guide.md) | Navigation and a typical scenario |
| [Architecture](./docs/wiki/architecture.md) | Layers, patterns, data flow |
| [Execution trail](./docs/wiki/execution-trail.md) | Observability of agent steps |

#### Domains

| Document | About |
| --- | --- |
| [Debates](./docs/wiki/debates.md) | Formats, strategies, quality metrics |
| [Agents](./docs/wiki/agents.md) | Roles, personas, topologies, consortia |
| [Memory](./docs/wiki/memory.md) | BM25 + semantics, debate RAG |
| [Providers](./docs/wiki/providers.md) | Keys, router, health, budgets |
| [Diagnostics](./docs/wiki/diagnostics.md) | Logs, traces, health, audits |

#### Panels

A guide per panel — `panel-*` in the [wiki index](./docs/wiki/README.md#панели): [Chat](./docs/wiki/panel-chat.md), [Providers](./docs/wiki/panel-providers.md), [Tasks](./docs/wiki/panel-tasks.md), [Observability](./docs/wiki/panel-observability.md), [SRE](./docs/wiki/panel-sre.md), [Governance](./docs/wiki/panel-governance.md) and ~200 more.

#### Development history

The audit and fix chronology by zone — [zone-1](./docs/wiki/zone-1.md) … [zone-26](./docs/wiki/zone-26.md).

#### For developers

| Guide | About |
| --- | --- |
| [Overview](./docs/wiki/dev-overview.md) | Where to start in the code |
| [Layout](./docs/wiki/dev-layout.md) | What lives where |
| [Boot and DI](./docs/wiki/dev-boot.md) | Container, initialization phases |
| [Events](./docs/wiki/dev-events.md) | EventBus and the event registry |
| [Services](./docs/wiki/dev-services.md) | lazyService and barrels |
| [Components](./docs/wiki/dev-components.md) | Anatomy of a panel |
| [Routing](./docs/wiki/dev-routing.md) | How to add a panel |
| [Stores](./docs/wiki/dev-stores.md) | State and hooks |
| [i18n](./docs/wiki/dev-i18n.md) | Localization en/ru |
| [Testing](./docs/wiki/dev-testing.md) | Vitest, what to run |
| [CI](./docs/wiki/dev-ci.md) | Pipeline gates |
| [Generators](./docs/wiki/dev-generators.md) | Auto-catalogs |
| [Conventions](./docs/wiki/dev-conventions.md) | Code rules |
| [Glossary](./docs/wiki/dev-glossary.md) | Terms |
| [Cookbook](./docs/wiki/dev-cookbook.md) | Common tasks |

**Auto-catalogs (from code):** [panels: section → route → component → article](./docs/wiki/panels-catalog.md), [components](./docs/wiki/dev-component-catalog.md), [events](./docs/wiki/dev-event-catalog.md), [contracts](./docs/wiki/dev-contracts.md), [core service map](./docs/wiki/dev-service-map.md), [stores](./docs/wiki/dev-store-catalog.md), [locales](./docs/wiki/dev-i18n-catalog.md), [scripts](./docs/wiki/dev-scripts.md), [tests](./docs/wiki/dev-tests-catalog.md), [documentation health](./docs/wiki/docs-health.md), [documentation inventory](./docs/wiki/docs-inventory.md), [documentation standard](./docs/wiki/docs-standard.md), [documentation map](./docs/wiki/docs-index.md).

> The wiki mirror is generated by `npm run gen:wiki-docs`; CI checks it is not stale.

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
