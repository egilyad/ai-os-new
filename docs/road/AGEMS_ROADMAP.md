# AGEMS -> SuperAgents OS -- Roadmap

> **Goal:** Port all useful features from AGEMS (agems-ai/agems) into SuperAgents OS
> using OUR stack: Dexie/IndexedDB, Kernel DI, EventBus, Zustand, React.
> **NOT using:** PostgreSQL, NestJS, Prisma, Redis, Socket.io, BullMQ.

---

## Status

| Phase | Status | Description |
|-------|--------|-------------|
| Research | DONE | Full AGEMS analysis |
| Roadmap | DONE | This file |
| Phase 0 | DONE | Agent Management System (FULL) |
| Phase 1 | DONE | Agent Types + Config |
| Phase 2 | DONE | Tasks System (Kanban) |
| Phase 3 | DONE | Approvals (HITL) |
| Phase 4 | DONE | Budgets |
| Phase 5 | DONE | Meetings |
| Phase 6 | DONE | Skills + Tools |
| Phase 7 | DONE | Settings + UI |
| Phase 8 | DONE | Catalog/Marketplace |
| Phase 9 | DONE | Security + Audit |
| Phase 10 | DONE | Integrations |
| Phase 11 | DONE | Chat System |
| Phase 12 | DONE | AI Runner |

---

## OUR STACK vs AGEMS STACK

| Component | AGEMS | SuperAgents OS |
|-----------|-------|----------------|
| Backend | NestJS 11 + Prisma | Kernel DI + services |
| DB | PostgreSQL + pgvector | Dexie (IndexedDB) |
| Cache/Queue | Redis + BullMQ | In-process Map |
| Real-time | Socket.io | EventBus |
| Auth | JWT + Passport | (single-user) |
| Frontend | Next.js 15 + Tailwind v4 | React + Zustand + Tailwind |
| AI Runner | Vercel AI SDK v4 | LLMClientService + decorators |
| Deploy | Docker Compose | Static SPA |

---

## PHASE 0 -- Agent Management System (HIGH PRIORITY)

> This is the BIGGEST gap. AGEMS has a complete agent lifecycle management system.
> We need to port ALL of it to our stack.

### 0.1 Agent Data Model (Complete)

**AGEMS Agent model -- EVERY field:**
```typescript
model Agent {
  // Identity
  id: string
  name: string
  slug: string               // URL-safe unique identifier
  avatar?: string            // Emoji or image URL
  type: AgentType            // AUTONOMOUS | ASSISTANT | META | REACTIVE | EXTERNAL
  status: AgentStatus        // DRAFT | ACTIVE | PAUSED | ERROR | ARCHIVED

  // LLM Configuration (Brain)
  llmProvider: LLMProvider   // 19 providers (ANTHROPIC..CUSTOM)
  llmModel: string           // Model name (gpt-4, claude-3-opus, etc.)
  llmConfig: {               // Per-model settings
    temperature: number      // 0-2, default 0.7
    maxTokens: number        // 1-200000, default 4096
    topP?: number            // 0-1
    stopSequences?: string[]
  }

  // Mission & Values
  systemPrompt: string       // Core instruction set
  mission?: string           // What this agent is for
  values?: string[]          // Behavioral guidelines

  // Runtime Configuration (Eden-like execution)
  runtimeConfig: {
    mode: 'CLAUDE_CODE' | 'N8N' | 'API' | 'CUSTOM'
    maxIterations: number    // 1-100, default 50
    timeoutMs: number        // 1000-600000, default 120000
    allowedCommands?: string[]   // Bash whitelist
    blockedCommands?: string[]   // Bash blacklist
    workingDirectory?: string
    n8nApiUrl?: string
    n8nApiKey?: string
    mcpServers?: MCPServer[]     // Remote MCP servers
    agemsApiAccess?: boolean     // Can call AGEMS API
    agemsPermissions?: string[]  // Granular API permissions
    maxTokensPerMinute?: number
    maxApiCallsPerMinute?: number
    maxCostPerDay?: number       // USD
  }

  // External Agent Adapter (null = built-in LLM agent)
  adapterType?: AdapterType  // CLAUDE_CODE | CODEX | CURSOR | GEMINI_CLI | OPENCLAW | OPENCODE | PI | HTTP | PROCESS
  adapterConfig?: Record

  // Telegram Integration (per agent)
  telegramConfig?: {
    botToken?: string
    botEnabled?: boolean
    accessMode: 'OPEN' | 'WHITELIST'
    allowedChatIds?: number[]
    voiceEnabled?: boolean
    ttsVoice?: string
    apiId?: number           // MTProto (Telethon-style)
    apiHash?: string
    sessionString?: string
  }

  // Ownership & Hierarchy
  ownerId: string            // Who created this agent
  parentAgentId?: string     // Parent in hierarchy
  childAgents: Agent[]       // Children
  createdByAgentId?: string  // Which agent created this

  // Version control
  version: number            // Auto-incrementing
  metadata?: Record

  // Relations
  skills: AgentSkill[]       // Assigned skills with config
  tools: AgentTool[]         // Assigned tools with permissions
  responsibilities: Responsibility[]  // KPIs and duties
  metrics: AgentMetric[]     // Performance data
  memory: AgentMemory[]      // Long-term memory
  accessRules: AccessRule[]  // Resource permissions
  positions: OrgPosition[]   // Org chart positions
  executions: AgentExecution[]  // Run history
  telegramChats: TelegramChat[]
  approvalPolicy?: ApprovalPolicy
  approvalRequests: ApprovalRequest[]
  configRevisions: AgentConfigRevision[]  // Version history
  apiKeys: AgentApiKey[]     // Per-agent API keys
  budgets: AgentBudget[]     // Cost limits
  ownedGoals: Goal[]
  repositories: AgentRepository[]
}
```

**What we have:** Basic agent fields only (name, description, model).

**Action items -- COMPLETE agent data model:**
- [ ] Extend `src/kernel/types/runtime-types.ts` with ALL fields above
- [ ] Extend Dexie `agents` table with all new columns
- [ ] Add relation tables: `agentSkills`, `agentTools`, `agentResponsibilities`, `agentMetrics`, `agentMemory`
- [ ] Add `agentConfigRevisions` table
- [ ] Add `agentApiKeys` table
- [ ] Add `agentBudgets` table

### 0.2 Agent List Page (Card Grid)

**AGEMS has:**
- Card grid layout (responsive: 1/2/3 columns)
- Each card shows:
  - Avatar (emoji or image, 3 sizes)
  - Name + slug
  - Status badge (green=ACTIVE, gray=DRAFT, yellow=PAUSED, red=ERROR)
  - Type icon (robot, chat, crown, bolt)
  - LLM provider badge (Anthropic, OpenAI, etc.)
  - Tool count badge
  - Chat button (opens direct message)
  - Archive/Delete buttons
- Filter bar: search, status filter, type filter, LLM provider filter
- "New Agent" button
- "Import from Catalog" button (opens modal)
- Catalog modal: browse community agents, search, import with one click

**What we have:** Basic agent list.

**Action items:**
- [ ] Rewrite `AgentsPanel` with card grid layout
- [ ] Agent card component with all fields above
- [ ] Status badge component (colored dots)
- [ ] Type icon component (per-type icons)
- [ ] Filter bar with search + dropdowns
- [ ] Import from Catalog modal
- [ ] Responsive grid (1/2/3 columns)

### 0.3 Agent Detail Page (Full Management)

**AGEMS has (1766 lines of UI):**

**Section 1: Header**
- Avatar (large, clickable to change)
- Name (editable inline)
- Status badge + type badge
- LLM provider + model display
- Action buttons: Activate, Pause, Archive, Delete

**Section 2: Chat Integration**
- Embedded ChatPanel for direct messaging with the agent
- Auto-creates channel on first message
- Shows agent responses in real-time

**Section 3: Edit Form (tabbed)**
- Tab "General": name, slug, avatar, type, system prompt, mission, values
- Tab "LLM": provider selector (19 options), model selector, temperature/maxTokens sliders
- Tab "Runtime": mode selector, max iterations, timeout, allowed/blocked commands, MCP servers
- Tab "Telegram": bot token, access mode, voice settings, MTProto config
- Tab "Adapter": adapter type selector, adapter-specific config
- Save button with validation

**Section 4: Tools Management**
- List of assigned tools with permissions (read/write/execute)
- Approval mode per tool (FREE/REQUIRES_APPROVAL/BLOCKED)
- Add/remove tools
- Tool configuration editor

**Section 5: Skills Management**
- List of assigned skills with config
- Enable/disable per skill
- Add/remove skills

**Section 6: Memory CRUD**
- List of memory entries (CONTEXT/CONVERSATION/FILE/KNOWLEDGE)
- Add/edit/delete memory
- Search memory
- Memory type filter

**Section 7: Execution History**
- Table of all executions with:
  - Status (RUNNING/COMPLETED/FAILED/CANCELLED/WAITING_HITL)
  - Trigger type (TASK/MESSAGE/SCHEDULE/EVENT/MANUAL/MEETING/TELEGRAM/APPROVAL)
  - Duration, tokens used, cost
  - Input/output preview
  - Expand for full details

**Section 8: Hierarchy**
- Parent agent selector (dropdown)
- Children list
- "Spawn Child" button (creates child agent with inherited config)

**Section 9: Approval Policy**
- Preset selector (FULL_CONTROL/SUPERVISED/GUIDED/AUTOPILOT)
- Per-category overrides
- Per-tool overrides
- Auto-approve rules

**Section 10: Responsibilities & KPIs**
- List of responsibilities with title, description, KPI metrics
- Add/edit/delete responsibilities

**Section 11: Budget**
- Monthly/daily/hourly limits
- Current spend display
- Alert settings

**Section 12: Repository**
- Link to git repository
- Branch selector

**What we have:** Basic agent edit form.

**Action items:**
- [ ] Create `AgentDetailPage` component (full page, not modal)
- [ ] Tabbed edit form with all sections above
- [ ] Embedded ChatPanel integration
- [ ] Tools management section
- [ ] Skills management section
- [ ] Memory CRUD section
- [ ] Execution history table
- [ ] Hierarchy section (parent/child)
- [ ] Approval policy section
- [ ] Responsibilities section
- [ ] Budget section
- [ ] Repository section

### 0.4 Agent Service (Complete CRUD + Operations)

**AGEMS has:**
```typescript
class AgentsService {
  // CRUD
  create(input: CreateAgentInput): Promise<Agent>
  findAll(filters: AgentFilters): Promise<PaginatedResponse<Agent>>
  findOne(id: string): Promise<Agent>
  update(id: string, input: UpdateAgentInput): Promise<Agent>
  remove(id: string): Promise<void>

  // Lifecycle
  activate(id: string): Promise<Agent>    // DRAFT -> ACTIVE
  pause(id: string): Promise<Agent>       // ACTIVE -> PAUSED
  archive(id: string): Promise<Agent>     // Any -> ARCHIVED
  unarchive(id: string): Promise<Agent>   // ARCHIVED -> DRAFT

  // Hierarchy
  getParent(id: string): Promise<Agent | null>
  getChildren(id: string): Promise<Agent[]>
  setParent(childId: string, parentId: string): Promise<void>
  removeParent(childId: string): Promise<void>

  // Spawn (create child with inherited config)
  spawn(parentId: string, input: CreateAgentInput): Promise<Agent>

  // Delegate (parent assigns task to child)
  delegate(parentId: string, childId: string, taskInput): Promise<Task>

  // Memory
  getMemory(agentId: string, type?: MemoryType): Promise<AgentMemory[]>
  addMemory(agentId: string, input): Promise<AgentMemory>
  updateMemory(agentId: string, memoryId: string, input): Promise<AgentMemory>
  deleteMemory(agentId: string, memoryId: string): Promise<void>
  searchMemory(agentId: string, query: string): Promise<AgentMemory[]>

  // Executions
  getExecutions(agentId: string, filters?): Promise<PaginatedResponse<AgentExecution>>
  getCostStats(agentId: string, period?): Promise<CostStats>

  // Config Revisions
  getConfigRevisions(agentId: string): Promise<AgentConfigRevision[]>
  getConfigRevision(agentId: string, version: number): Promise<AgentConfigRevision>
  rollbackConfig(agentId: string, version: number): Promise<Agent>

  // API Keys
  createApiKey(agentId: string, input): Promise<AgentApiKey>
  getApiKeys(agentId: string): Promise<AgentApiKey[]>
  revokeApiKey(agentId: string, keyId: string): Promise<void>

  // Export/Import
  exportAgent(id: string): Promise<ExportedAgent>  // Full JSON dump
  importAgent(input: ImportAgentInput): Promise<Agent>  // Import with new id
  importFromCatalog(catalogId: string): Promise<Agent>

  // Metrics
  getMetrics(agentId: string, type?: MetricType): Promise<AgentMetric[]>
  recordMetric(agentId: string, input): Promise<AgentMetric>
}
```

**What we have:** Basic CRUD only.

**Action items:**
- [ ] Extend `AgentService` with ALL methods above
- [ ] Lifecycle methods (activate/pause/archive)
- [ ] Hierarchy methods (parent/child)
- [ ] Spawn method (create child with inheritance)
- [ ] Memory CRUD
- [ ] Execution history
- [ ] Config revision tracking
- [ ] API key management
- [ ] Export/Import with tool/skill re-linking
- [ ] Metrics recording

### 0.5 Agent Interactions & Communication

**AGEMS has:**

**Agent-to-Agent Communication:**
- Agents can communicate via channels (DIRECT/GROUP/BROADCAST)
- Each agent has its own channel
- Messages are bridged between agents
- Loop prevention: max 6 exchanges per pair per 10 minutes
- Cross-channel context: can inject messages from other channels

**Agent Spawning:**
- Parent agent can spawn child agents
- Child inherits: LLM config, runtime config, tools, skills
- Child has separate memory and execution history
- Parent can delegate tasks to children

**Agent Delegation:**
- Parent assigns task to child via `delegate(parentId, childId, taskInput)`
- Task is created and assigned to child
- Parent tracks child's progress

**Agent Hierarchy:**
- Tree structure: parent -> children -> grandchildren
- META agents manage other agents
- Org positions can be held by agents or humans

**What we have:** Basic channel system.

**Action items:**
- [ ] Agent-to-agent communication via channels
- [ ] Loop prevention (max exchanges per pair)
- [ ] Cross-channel context injection
- [ ] Agent spawning UI
- [ ] Agent delegation UI
- [ ] Hierarchy tree view
- [ ] Org chart with agent positions

### 0.6 Agent Avatars (Complete System)

**AGEMS has:**
```typescript
// Avatar by type (fallback)
const TYPE_AVATARS = {
  AUTONOMOUS: '🤖',
  ASSISTANT: '💬',
  META: '🧠',
  REACTIVE: '⚡',
  EXTERNAL: '🔗',
}

// AgentAvatar component
<AgentAvatar
  agent={agent}
  size="sm" | "md" | "lg"   // 32px, 40px, 64px
  showStatus={true}          // Green dot if active
/>

// Features:
// - Emoji display (if avatar is emoji)
// - Image display (if avatar is URL)
// - Fallback to first letter of name
// - Status indicator (green dot)
// - 3 sizes
```

**We have:** `AgentAvatarService` -- basic.

**Action items:**
- [ ] `AgentAvatar` React component (not just service)
- [ ] 3 sizes: sm (32px), md (40px), lg (64px)
- [ ] Status indicator (green dot for active)
- [ ] Emoji support
- [ ] Image URL support
- [ ] Fallback to first letter
- [ ] Avatar picker in agent creation (emoji grid + URL input)

### 0.7 Agent Execution System

**AGEMS has:**
```typescript
enum TriggerType {
  TASK        // Assigned task
  MESSAGE     // Incoming message
  SCHEDULE    // Cron trigger
  EVENT       // System event
  MANUAL      // User-initiated
  MEETING     // Meeting participation
  TELEGRAM    // Telegram bot message
  APPROVAL    // Resume after approval
}

enum ExecutionStatus {
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
  WAITING_HITL  // Waiting for human approval
}

model AgentExecution {
  agentId: string
  status: ExecutionStatus
  triggerType: TriggerType
  triggerId?: string
  input?: Record
  output?: Record
  toolCalls?: Array<{ tool, input, output }>
  tokensUsed?: number
  costUsd?: number
  provider?: string
  model?: string
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
  error?: string
  startedAt: DateTime
  endedAt?: DateTime
}
```

**We have:** `ActivityPanel` -- basic logging.

**Action items:**
- [ ] Dexie table `agentExecutions`
- [ ] Execution service: start, update, complete, fail
- [ ] Per-execution cost tracking
- [ ] Tool call logging
- [ ] Token usage tracking
- [ ] Execution history UI in agent detail

### 0.8 Agent Responsibilities & KPIs

**AGEMS has:**
```typescript
model Responsibility {
  agentId: string
  title: string
  description?: string
  kpiMetrics?: Record   // { "tasks_completed": ">=10/week", "quality": ">=95%" }
  priority: Priority    // LOW | MEDIUM | HIGH | CRITICAL
}
```

**We have:** None.

**Action items:**
- [ ] Dexie table `responsibilities`
- [ ] Responsibility service: CRUD
- [ ] UI: responsibilities section in agent detail
- [ ] KPI tracking against targets

### 0.9 Agent Memory System

**AGEMS has:**
```typescript
enum MemoryType {
  CONTEXT       // System context
  CONVERSATION  // Chat history summary
  FILE          // File-based memory
  KNOWLEDGE     // Knowledge base entries
}

model AgentMemory {
  agentId: string
  type: MemoryType
  content: string
  metadata?: Record
  expiresAt?: DateTime
  createdAt: DateTime
}
```

**We have:** `MemoryEngine` -- different semantics.

**Action items:**
- [ ] Dexie table `agentMemory`
- [ ] Agent memory service: CRUD + search
- [ ] Auto-save conversation summaries
- [ ] Memory type filter
- [ ] Search across memory
- [ ] Expiry support

### 0.10 Agent Metrics & Cost Tracking

**AGEMS has:**
```typescript
enum MetricType {
  COST          // USD spent
  LATENCY       // Response time
  QUALITY       // Quality score
  ERROR_RATE    // Error percentage
  TASKS_DONE    // Completed tasks
  TOKENS_USED   // Token consumption
}

model AgentMetric {
  agentId: string
  metricType: MetricType
  value: number
  periodStart: DateTime
  periodEnd: DateTime
  metadata?: Record
}

// Cost stats endpoint
GET /agents/:id/cost-stats?period=month
// Returns: { totalCost, byProvider, byModel, byDay }
```

**We have:** Basic pricing service.

**Action items:**
- [ ] Dexie table `agentMetrics`
- [ ] Metrics service: record, query, aggregate
- [ ] Cost stats per agent (daily/monthly)
- [ ] UI: metrics charts in agent detail
- [ ] UI: cost breakdown by provider/model

### 0.11 Agent Export/Import (with Re-linking)

**AGEMS has:**
```typescript
// Export: full agent dump
GET /agents/:id/export
// Returns: { agent, tools[], skills[] } -- all data

// Import: re-link tools/skills by slug
POST /agents/import
// Input: { agent, tools[], skills[] }
// Logic:
//   1. Create agent with new id
//   2. Find existing tools by slug, link them
//   3. Find existing skills by slug, link them
//   4. If tool/skill not found, create it
// Returns: { id, toolsLinked, skillsLinked }
```

**We have:** None.

**Action items:**
- [ ] Export: serialize agent + tools + skills to JSON
- [ ] Import: parse JSON, re-link by slug, create if missing
- [ ] UI: Export button on agent detail
- [ ] UI: Import modal (paste JSON or file upload)
- [ ] Import from Catalog (browse community agents)

### 0.12 Agent Repository Integration

**AGEMS has:**
```typescript
model AgentRepository {
  agentId: string
  repositoryId: string
  branch: string
  isDefault: boolean
}

// Agent can work on a git repository
// Linked to Repos module
```

**We have:** `WorkspaceService` (P2) -- partial.

**Action items:**
- [ ] Link agent to git repository
- [ ] Branch selector
- [ ] Agent can read/write files in repo

### 0.13 Agent Approval Policy (Per-Agent)

**AGEMS has:**
```typescript
model ApprovalPolicy {
  agentId: string @unique
  preset: ApprovalPreset  // FULL_CONTROL | SUPERVISED | GUIDED | AUTOPILOT

  // Per-category overrides
  readMode?: ToolApprovalMode
  writeMode?: ToolApprovalMode
  deleteMode?: ToolApprovalMode
  executeMode?: ToolApprovalMode
  sendMode?: ToolApprovalMode
  adminMode?: ToolApprovalMode

  // Per-tool overrides: { "db_execute": "BLOCKED" }
  toolOverrides?: Record<string, ToolApprovalMode>

  // Default approver
  approverType?: ActorType
  approverId?: string

  // Auto-approve rules
  autoApproveAfterMin?: number     // Auto-approve after N minutes
  autoApproveLowRisk?: boolean     // Auto-approve low-risk actions
  costThresholdUsd?: number        // Auto-approve under $X
}
```

**We have:** `SafetyGates` (P10) -- global, not per-agent.

**Action items:**
- [ ] Dexie table `approvalPolicies`
- [ ] Per-agent approval policy
- [ ] Preset selector UI
- [ ] Per-category overrides UI
- [ ] Per-tool overrides UI
- [ ] Auto-approve rules UI

---

## PHASE 1 -- Agent Types + Config (HIGH PRIORITY)

### 1.1 Agent Types

**AGEMS has:**
`	ypescript
enum AgentType {
  AUTONOMOUS  // Fully autonomous, plans and executes
  ASSISTANT   // Responds to requests
  META        // Manages other agents (Gemma-style)
  REACTIVE    // Reacts to events
  EXTERNAL    // External agent via adapter
}
`

**We have:** No agent types. All agents are equal.

**Action items:**
- [ ] Add AgentType enum to src/kernel/types/runtime-types.ts
- [ ] Extend IAgentService contract: 	ype?: AgentType
- [ ] Update AgentService -- filter by types
- [ ] UI: type picker in agent creation/edit
- [ ] UI: icons by type (robot, assistant, crown, bolt)

**Files to change:**
- src/kernel/types/runtime-types.ts -- type
- src/kernel/contracts/agent-runtime.ts -- contract
- src/kernel/services/agent-service.ts -- implementation
- src/components/AgentsPanel/ -- UI

### 1.2 Agent Config Revisions (Version Control)

**AGEMS has:**
`	ypescript
model AgentConfigRevision {
  agentId: string
  version: number
  changeset: { field: { old, new } }
  snapshot: FullConfig
  changedBy: ActorType
  changeNote?: string
}
`

**We have:** No version control for agent config.

**Action items:**
- [ ] Add Dexie table gentConfigRevisions in schema-types.ts
- [ ] Create src/kernel/contracts/agent-config-revision.ts
- [ ] Create src/kernel/services/agent-config-revision-service.ts
- [ ] Agent service: save revision on every update
- [ ] UI: "Version History" button on agent page
- [ ] UI: diff view between versions
- [ ] UI: rollback to previous version

### 1.3 Agent Hierarchy (Parent/Child)

**AGEMS has:**
`	ypescript
parentAgentId?: string  // parent
childAgents: Agent[]    // children
`

**We have:** No agent hierarchy.

**Action items:**
- [ ] Add parentAgentId? to agent type
- [ ] Agent service: getParent(), getChildren(), setParent()
- [ ] UI: tree view in AgentsPanel
- [ ] UI: drag-and-drop for parent/child assignment

### 1.4 Agent Avatar System

**AGEMS has:**
- Emoji-based by type (robot, chat, crown, bolt) or custom URL
- 3 sizes: sm (32px), md (40px), lg (64px)
- Fallback: first letter of name

**We have:** AgentAvatarService -- basic support.

**Action items:**
- [ ] Extend AgentAvatarService: emoji support by type
- [ ] Add avatar picker in agent creation
- [ ] UI: 3 sizes (sm/md/lg) everywhere

### 1.5 Agent Export/Import

**AGEMS has:**
- JSON export with tools/skills
- Import from JSON
- Catalog import (from marketplace)

**We have:** No export/import.

**Action items:**
- [ ] exportAgent(id) -> JSON -- full dump
- [ ] importAgent(json) -> id -- import with new id
- [ ] UI: Export/Import buttons in AgentsPanel

### 1.6 External Agent Adapters

**AGEMS has:**
`	ypescript
enum AdapterType {
  CLAUDE_CODE   // Anthropic Claude Code CLI
  CODEX         // OpenAI Codex CLI
  CURSOR        // Cursor IDE agent
  GEMINI_CLI    // Google Gemini CLI
  OPENCLAW      // OpenClaw agent
  OPENCODE      // OpenCode AI agent
  PI            // Pi agent
  HTTP          // Generic HTTP webhook
  PROCESS       // Generic shell command
}
`

**We have:** AgentAdapterRegistry -- basic.

**Action items:**
- [ ] Extend with more adapters
- [ ] Claude Code, Codex, Cursor adapters
- [ ] UI: adapter configuration

---

## PHASE 2 -- Tasks System (HIGH PRIORITY)

### 2.1 Task Types + Status

**AGEMS has:**
`	ypescript
enum TaskType { ONE_TIME, RECURRING, CONTINUOUS }
enum TaskStatus {
  PENDING, IN_PROGRESS, IN_REVIEW, IN_TESTING, VERIFIED,
  AWAITING_APPROVAL, COMPLETED, FAILED, BLOCKED, CANCELLED
}
`

**We have:** TasksPanel -- basic, no types/statuses.

**Action items:**
- [ ] Extend src/kernel/types/autonomy-types.ts: TaskType, TaskStatus enums
- [ ] Add Dexie table 	asks in schema-types.ts
- [ ] Create src/kernel/contracts/task-manager.ts
- [ ] Create src/kernel/services/task-manager-service.ts
- [ ] UI: full TasksPanel with Kanban

### 2.2 Kanban Board

**AGEMS has:**
- 5 columns: Pending, In Progress, In Review, Completed, Failed
- Drag-and-drop between columns
- List view toggle
- Quick filters: All, My Tasks, Assigned to Me, Created by Me
- Detailed filters: assignee, creator dropdowns

**We have:** TasksPanel -- simple list.

**Action items:**
- [ ] Rewrite TasksPanel: Kanban + List view
- [ ] Drag-and-drop via @dnd-kit/core or similar
- [ ] Quick filter tabs
- [ ] Detailed filter dropdowns
- [ ] Task cards: title, priority badge, assignee avatar, due date

### 2.3 Cron Schedule Builder

**AGEMS has:**
- Friendly UI: presets (Daily, Weekday, Monday, Hourly)
- Time picker, day-of-week selector
- Human-readable description

**We have:** No cron UI.

**Action items:**
- [ ] CronBuilder component
- [ ] Presets: Daily, Weekday, Weekly, Monthly, Hourly
- [ ] Custom: minute/hour/day/month/day-of-week
- [ ] Preview: "Runs every day at 09:00"

### 2.4 Task Comments

**AGEMS has:**
`	ypescript
model TaskComment {
  taskId, authorType, authorId, content, metadata, createdAt
}
`

**We have:** No task comments.

**Action items:**
- [ ] Dexie table 	askComments
- [ ] Task service: ddComment(), getComments()
- [ ] UI: comments in task detail view

### 2.5 Task Labels

**AGEMS has:**
`	ypescript
model Label { name, color (hex) }
model TaskLabel { taskId, labelId }
`

**We have:** No labels.

**Action items:**
- [ ] Dexie tables labels, 	askLabels
- [ ] Label service: CRUD
- [ ] UI: label picker in task creation/edit
- [ ] UI: colored chips on task cards

### 2.6 Task Locking (Atomic Checkout)

**AGEMS has:**
`	ypescript
lockedBy?: string
lockedUntil?: number  // TTL: crash recovery
`

**We have:** No locking.

**Action items:**
- [ ] Task service: claimTask(taskId, workerId)
- [ ] Task service: eleaseTask(taskId)
- [ ] TTL: if lockedUntil < now(), task is available again

### 2.7 Task Work Products

**AGEMS has:**
`	ypescript
enum WorkProductType { ARTIFACT, DOCUMENT, CODE, REPORT, FILE }
model TaskWorkProduct {
  taskId, title, description, type, content, metadata, createdBy
}
`

**We have:** ArtifactsService -- partial.

**Action items:**
- [ ] Extend ArtifactsService: link to tasks
- [ ] UI: work products in task detail

### 2.8 Task Triggers (External Events)

**AGEMS has:**
`	ypescript
enum TriggerKind { WEBHOOK, GMAIL, N8N }
enum TriggerAuthKind { HMAC, BEARER, NONE }
model TaskTrigger {
  taskId, slug, kind, authKind, authSecretEnc, enabled, lastFiredAt, firingCount
}
`

**We have:** WebhooksPanel -- basic.

**Action items:**
- [ ] Extend webhook system: link to tasks
- [ ] HMAC verification
- [ ] Gmail trigger (polling)
- [ ] N8N trigger (webhook)
- [ ] UI: trigger management in task detail

---

## PHASE 3 -- Approvals / HITL (HIGH PRIORITY)

### 3.1 Approval Presets

**AGEMS has:**
`	ypescript
enum ApprovalPreset { FULL_CONTROL, SUPERVISED, GUIDED, AUTOPILOT }
`

**We have:** SafetyGates (P10) -- basic.

**Action items:**
- [ ] Extend SafetyGates: 4 presets
- [ ] Per-category overrides (READ/WRITE/DELETE/EXECUTE/SEND/ADMIN)
- [ ] Per-tool overrides
- [ ] Auto-approve rules

### 3.2 Approval Request Flow

**AGEMS has:**
`	ypescript
enum ApprovalStatus { PENDING, APPROVED, REJECTED, EXPIRED, AUTO_APPROVED }
model ApprovalRequest {
  agentId, toolName, toolInput, category, riskLevel, description,
  status, resolvedBy, resolvedAt, rejectionReason, expiresAt
}
`

**We have:** Basic approval flow.

**Action items:**
- [ ] Dexie table pprovalRequests
- [ ] Approval service: full CRUD + resolve
- [ ] Expiration: auto-reject after timeout
- [ ] Auto-approve: by rules

### 3.3 Bulk Approve/Reject

**AGEMS has:**
- Select all checkbox
- Bulk approve/reject buttons
- Real-time updates

**We have:** No bulk operations.

**Action items:**
- [ ] UI: checkboxes on approval cards
- [ ] Bulk actions toolbar
- [ ] pproveAll(ids), ejectAll(ids, reason)

### 3.4 Approval Comments

**AGEMS has:**
`	ypescript
model ApprovalComment { requestId, authorType, authorId, content, createdAt }
`

**We have:** No approval comments.

**Action items:**
- [ ] Dexie table pprovalComments
- [ ] UI: comments in approval detail

---

## PHASE 4 -- Budgets (MEDIUM PRIORITY)

### 4.1 Agent Budget (Per-Agent)

**AGEMS has:**
`	ypescript
model AgentBudget {
  agentId, monthlyLimitUsd, dailyLimitUsd?, hourlyLimitUsd?,
  currentSpendUsd, periodStart, periodEnd,
  softAlertPercent (80), hardStopEnabled (true), alertSent, hardStopTriggered
}
`

**We have:** BudgetService -- basic.

**Action items:**
- [ ] Extend BudgetService: monthly/daily/hourly limits
- [ ] Soft alert at 80%
- [ ] Hard stop at 100%
- [ ] Period tracking (monthly reset)

### 4.2 Platform Budget (Org-Wide)

**AGEMS has:**
`	ypescript
model PlatformBudget {
  orgId, hourlyLimitUsd?, dailyLimitUsd?, monthlyLimitUsd?,
  currentSpendUsd, softAlertPercent, hardStopEnabled
}
`

**We have:** No platform-wide budget.

**Action items:**
- [ ] Dexie table platformBudget
- [ ] Budget service: checkPlatformBudget()
- [ ] If platform limit exceeded: block all agents

### 4.3 Budget Incidents

**AGEMS has:**
`	ypescript
enum BudgetIncidentType { SOFT_ALERT, HARD_STOP, BUDGET_RESET, MANUAL_OVERRIDE }
model BudgetIncident { budgetId, type, message, spendUsd, limitUsd, createdAt }
`

**We have:** BudgetAlertService -- partial.

**Action items:**
- [ ] Extend: 4 incident types
- [ ] Dexie table udgetIncidents
- [ ] UI: incident log in BudgetPanel

---

## PHASE 5 -- Meetings (MEDIUM PRIORITY)

### 5.1 Meeting Structure

**AGEMS has:**
`	ypescript
enum MeetingStatus { SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED }
enum MeetingRole { CHAIR, MEMBER, OBSERVER }
model Meeting {
  title, agenda, status, scheduledAt, startedAt, endedAt,
  creatorType, creatorId, summary
}
`

**We have:** Debate/Discussion -- different semantics.

**Action items:**
- [ ] Dexie table meetings
- [ ] Meeting service: CRUD + lifecycle
- [ ] UI: MeetingsPanel

### 5.2 Meeting Voting

**AGEMS has:**
`	ypescript
enum VoteResult { APPROVED, REJECTED, TABLED }
model MeetingDecision {
  meetingId, description, votesFor, votesAgainst, votesAbstain, result
}
`

**We have:** Debate voting -- different semantics.

**Action items:**
- [ ] Meeting service: createDecision(), castVote()
- [ ] UI: voting in meeting detail

### 5.3 Auto-Create Tasks from Meetings

**AGEMS has:**
- Autonomy 4+ creates tasks from action items
- JSON parsing: { assignee, task, deadline }

**We have:** None.

**Action items:**
- [ ] Meeting service: parse action items
- [ ] Auto-create tasks
- [ ] UI: "Create Tasks" button after meeting

---

## PHASE 6 -- Skills + Tools (MEDIUM PRIORITY)

### 6.1 Skill Lifecycle (Hermes-Style)

**AGEMS has:**
`	ypescript
enum SkillState { ACTIVE, STALE, ARCHIVED }
model Skill {
  name, slug, description, version (semver), type (BUILTIN/PLUGIN/CUSTOM),
  entryPoint, configSchema?, state, lastUsedAt?, archivedAt?,
  authorType, authorId?
}
`

**We have:** SkillService -- basic.

**Action items:**
- [ ] Extend SkillService: lifecycle states
- [ ] Auto-detect stale skills (unused > 30 days)
- [ ] UI: state badges (Active/Stale/Archived)

### 6.2 Tool Auth Types

**AGEMS has:**
`	ypescript
enum AuthType { NONE, API_KEY, BEARER_TOKEN, BASIC, OAUTH2, CUSTOM }
model Tool { name, type, config, authType?, authConfig? (encrypted) }
`

**We have:** ToolCatalogService -- basic.

**Action items:**
- [ ] Extend ToolCatalogService: auth types
- [ ] Encrypted auth config storage
- [ ] UI: auth type picker in tool creation

### 6.3 Tool Execution Modes

**AGEMS has:**
`	ypescript
enum ToolApprovalMode { FREE, REQUIRES_APPROVAL, BLOCKED }
model AgentTool {
  agentId, toolId, permissions (read/write/execute), approvalMode, enabled
}
`

**We have:** Basic tool assignment.

**Action items:**
- [ ] Extend: per-agent tool permissions
- [ ] Approval mode per tool per agent
- [ ] UI: permission matrix

---

## PHASE 7 -- Settings + UI (MEDIUM PRIORITY)

### 7.1 Settings Page (Tabbed)

**AGEMS has:** 6 tabs: LLM Keys, Platform, AI Modules, System Prompts, N8N, System.

**We have:** SettingsPanel -- exists.

**Action items:**
- [ ] Extend SettingsPanel: add tabs
- [ ] LLM Keys management
- [ ] Platform defaults
- [ ] AI Modules settings
- [ ] System prompts editor

### 7.2 AI Modules Settings

**AGEMS has:**
`	ypescript
// Per-module settings
{ enabled, activityLevel (1-5), autonomyLevel (1-5) }
`

**We have:** No per-module settings.

**Action items:**
- [ ] Settings service: module settings
- [ ] UI: sliders for activity/autonomy levels
- [ ] Save to Dexie

### 7.3 Command Palette (Cmd+K)

**AGEMS has:** Global search/execute, navigation, actions, theme toggle.

**We have:** CommandPalette -- basic.

**Action items:**
- [ ] Extend: more commands
- [ ] Search across all pages
- [ ] Keyboard navigation (up/down/enter)

### 7.4 Mobile Bottom Nav

**AGEMS has:** 5 icons (Home, Agents, Tasks, Inbox, Chat) + mobile sidebar overlay.

**We have:** None.

**Action items:**
- [ ] Mobile navigation component
- [ ] Responsive sidebar overlay

---

## PHASE 8 -- Catalog/Marketplace (LOW PRIORITY)

### 8.1 Agent Catalog

**AGEMS has:**
`	ypescript
model CatalogAgent {
  slug, name, avatar?, type, description, systemPrompt,
  llmProvider, llmModel, tags[], toolSlugs[], skillSlugs[],
  authorOrg, downloads
}
`

**We have:** AgentMarketplace -- basic.

**Action items:**
- [ ] Dexie table catalogAgents
- [ ] Catalog service: browse, search, import
- [ ] UI: catalog modal

### 8.2 Skill Catalog

**AGEMS has:**
`	ypescript
model CatalogSkill {
  slug, name, description, content, version, type, tags[], downloads
}
`

**We have:** None.

**Action items:**
- [ ] Dexie table catalogSkills
- [ ] UI: skill marketplace

### 8.3 Tool Catalog

**AGEMS has:**
`	ypescript
model CatalogTool {
  slug, name, description, type, configTemplate, authType?, tags[], downloads
}
`

**We have:** ToolCatalogService -- basic.

**Action items:**
- [ ] Extend: download count, tags
- [ ] UI: tool marketplace

---

## PHASE 9 -- Security + Audit (LOW PRIORITY)

### 9.1 Audit Log

**AGEMS has:**
`	ypescript
enum AuditAction {
  CREATE, READ, UPDATE, DELETE, EXECUTE, COMMUNICATE, LOGIN,
  GRANT_ACCESS, REVOKE_ACCESS, APPROVE, REJECT
}
model AuditLog {
  actorType, actorId, action, resourceType, resourceId, details?, ipAddress?, createdAt
}
`

**We have:** ActivityPanel -- basic.

**Action items:**
- [ ] Extend: full action set
- [ ] Dexie table uditLogs
- [ ] UI: filter by actor/action/resource

### 9.2 Access Rules (Per-Agent)

**AGEMS has:**
`	ypescript
enum Permission { READ, WRITE, EXECUTE, ADMIN }
model AccessRule {
  agentId, resourceType, resourceId?, permissionLevel,
  grantedByType, grantedById, expiresAt?
}
`

**We have:** ACLService -- basic.

**Action items:**
- [ ] Extend: per-resource permissions
- [ ] Expiry support
- [ ] UI: access rule management

### 9.3 Agent API Keys

**AGEMS has:**
`	ypescript
model AgentApiKey {
  agentId, name, keyHash (bcrypt), keyPrefix (first 8 chars),
  lastUsedAt?, expiresAt?, revokedAt?
}
`

**We have:** KeyManagementService -- for LLM keys.

**Action items:**
- [ ] New service: per-agent API keys
- [ ] Bcrypt hashing
- [ ] UI: key management

---

## PHASE 10 -- Integrations (LOW PRIORITY)

### 10.1 Telegram Integration

**AGEMS has:**
`	ypescript
model TelegramChat {
  agentId, telegramChatId, channelId, username?,
  firstName?, lastName?, isApproved
}
`

**We have:** None.

**Action items:**
- [ ] Telegram bot adapter
- [ ] Per-agent bot tokens
- [ ] Message bridging: Telegram <-> Channel

### 10.2 N8N Integration

**AGEMS has:** Workflow triggers from agents, N8N API integration.

**We have:** Basic n8n connector.

**Action items:**
- [ ] Extend: workflow triggers
- [ ] Bidirectional communication

### 10.3 MCP Server Support

**AGEMS has:**
`	ypescript
model MCPServer {
  name, url, authorizationToken?, toolConfiguration { enabled, allowedTools? }
}
`

**We have:** MCPHarness + MCPPanel -- exists.

**Action items:**
- [ ] Verify existing implementation
- [ ] Add UI for MCP server management

---

## PHASE 11 -- Chat System (MEDIUM PRIORITY)

### 11.1 ChatDock (Floating Chat)

**AGEMS has:**
- Floating chat panel on all pages
- Multiple concurrent chats (up to 5)
- Minimize/maximize/close
- Unread badges
- Chat history per participant
- Gemma widget (META agent always available)

**We have:** ChatPanel -- exists.

**Action items:**
- [ ] ChatDock component: floating panels
- [ ] Multiple concurrent chats
- [ ] Minimize/maximize
- [ ] Unread badges
- [ ] Chat history per participant

### 11.2 Channel Filters

**AGEMS has:** All / Direct / Group / Agent tabs, Agent-to-agent chat.

**We have:** ChannelPanel -- exists.

**Action items:**
- [ ] Add filter tabs
- [ ] A2A chat support

### 11.3 Message Queuing

**AGEMS has:** If agent is busy, messages queued (Redis LPUSH/LPOP).

**We have:** No queuing.

**Action items:**
- [ ] In-process message queue (Map)
- [ ] Process messages when agent free

### 11.4 Cross-Channel Context

**AGEMS has:** Optional injection of recent messages from other channels.

**We have:** None.

**Action items:**
- [ ] Context builder: collect messages from channels
- [ ] Injection into LLM context

---

## PHASE 12 -- AI Runner Enhancements (HIGH PRIORITY)

### 12.1 Tool Loop Detector

**AGEMS has:**
`	ypescript
class ToolLoopDetector {
  private window: number[] = []  // Sliding window (20)
  private seen = new Map<string, number>()  // Hash dedup (threshold 4)
  detect(tools: string[]): { loop, shouldBreak }
  // + ping-pong detection (A-B-A-B)
}
`

**We have:** ExecutionGovernor -- timeout only.

**Action items:**
- [ ] ToolLoopDetector class
- [ ] Sliding window (20)
- [ ] Hash dedup (threshold 4)
- [ ] Ping-pong detection
- [ ] Integration into execution pipeline

### 12.2 Extended Thinking Extraction

**AGEMS has:**
- Anthropic: 	hinking.content blocks
- Google Gemini: 	hinking reasoningContent
- DeepSeek: <think>...</think> tags
- GLM/Zhipu: 	hinking content
- Ollama: delta.reasoning

**We have:** Basic thinking extraction.

**Action items:**
- [ ] Extend for all providers
- [ ] Normalize thinking output

### 12.3 Provider Error Classification

**AGEMS has:**
`	ypescript
function classifyProviderError(error) {
  // invalid_api_key, rate_limit, context_too_long, connection, unknown
}
`

**We have:** debate-llm-errors.ts (13 codes) -- BETTER.

**Action items:** None needed. We are ahead.

### 12.4 Tool Repair

**AGEMS has:** epairToolCall -- fix invalid tool_use input before sending back.

**We have:** None.

**Action items:**
- [ ] Tool repair function
- [ ] Fix common LLM mistakes (missing required fields, wrong types)

### 12.5 MCP Integration

**AGEMS has:** MCP servers as tools via MCPClient.

**We have:** MCPHarness -- exists.

**Action items:**
- [ ] Verify and extend

---

## DEXIE TABLES TO ADD

All new Dexie tables needed (mapped from AGEMS Prisma models):

```typescript
// Phase 0: Agent Management (COMPLETE)
agents: '++id, slug, status, type, llmProvider, ownerId, parentAgentId, [status,type]'
agentSkills: '++id, [agentId,skillId]'
agentTools: '++id, [agentId,toolId]'
agentResponsibilities: '++id, agentId'
agentMetrics: '++id, [agentId,metricType], [agentId,periodStart]'
agentMemory: '++id, [agentId,type]'
agentExecutions: '++id, [agentId,status], [agentId,startedAt], [provider,model]'
agentConfigRevisions: '++id, [agentId,version]'
agentApiKeys: '++id, agentId'
agentBudgets: '++id, agentId'
agentRepositories: '++id, [agentId,repositoryId]'
approvalPolicies: '++id, agentId'

// Phase 1: Agent Types + Config
// (covered by Phase 0 above)

// Phase 2: Tasks
tasks: '++id, status, assigneeId, creatorId, projectId, goalId, [status,lockedBy,lockedUntil]'
taskComments: '++id, taskId'
labels: '++id, name'
taskLabels: '++id, taskId, labelId'
taskAttachments: '++id, taskId'
taskWorkProducts: '++id, taskId'
taskTriggers: '++id, taskId, slug'

// Phase 3: Approvals
approvalRequests: '++id, agentId, status, [status,createdAt]'
approvalPolicies: '++id, agentId'
approvalComments: '++id, requestId'

// Phase 4: Budgets
agentBudgets: '++id, agentId'
platformBudgets: '++id, orgId'
budgetIncidents: '++id, budgetId'

// Phase 5: Meetings
meetings: '++id, status'
meetingParticipants: '++id, meetingId'
meetingEntries: '++id, meetingId, order'
meetingDecisions: '++id, meetingId'
meetingTasks: '++id, meetingId, taskId'

// Phase 6: Skills/Tools (extend existing)
// No new tables needed - extend existing skill/tool tables

// Phase 8: Catalog
catalogAgents: '++id, slug'
catalogSkills: '++id, slug'
catalogTools: '++id, slug'

// Phase 9: Security
auditLogs: '++id, [actorType,actorId], [resourceType,resourceId], createdAt'
accessRules: '++id, agentId, [agentId,resourceType]'
agentApiKeys: '++id, agentId'

// Phase 10: Integrations
telegramChats: '++id, agentId, [agentId,telegramChatId]'

// Phase 11: Chat
// Extend existing channel/message tables
`

---

## EVENTS TO ADD

All new events needed:

```typescript
// Phase 0: Agent Management (COMPLETE)
AGENT_CREATED, AGENT_UPDATED, AGENT_DELETED
AGENT_ACTIVATED, AGENT_PAUSED, AGENT_ARCHIVED, AGENT_UNARCHIVED
AGENT_PARENT_CHANGED, AGENT_SPAWNED
AGENT_MEMORY_ADDED, AGENT_MEMORY_UPDATED, AGENT_MEMORY_DELETED
AGENT_EXECUTION_STARTED, AGENT_EXECUTION_COMPLETED, AGENT_EXECUTION_FAILED
AGENT_METRIC_RECORDED
AGENT_CONFIG_REVISION_SAVED, AGENT_CONFIG_ROLLBACK
AGENT_API_KEY_CREATED, AGENT_API_KEY_REVOKED
AGENT_EXPORTED, AGENT_IMPORTED
AGENT_DELEGATED

// Phase 1: Agent Types + Config
// (covered by Phase 0 above)

// Phase 2: Tasks
TASK_CREATED, TASK_UPDATED, TASK_DELETED, TASK_STATUS_CHANGED
TASK_CLAIMED, TASK_RELEASED
TASK_COMMENT_ADDED
TASK_LABEL_ADDED, TASK_LABEL_REMOVED

// Phase 3: Approvals
APPROVAL_REQUESTED, APPROVAL_APPROVED, APPROVAL_REJECTED
APPROVAL_EXPIRED, APPROVAL_AUTO_APPROVED
APPROVAL_BULK_APPROVED, APPROVAL_BULK_REJECTED

// Phase 4: Budgets
BUDGET_SOFT_ALERT, BUDGET_HARD_STOP
BUDGET_RESET, BUDGET_OVERRIDE
PLATFORM_BUDGET_ALERT

// Phase 5: Meetings
MEETING_CREATED, MEETING_STARTED, MEETING_COMPLETED, MEETING_CANCELLED
MEETING_DECISION_CREATED, MEETING_VOTE_CAST
MEETING_TASKS_CREATED

// Phase 8: Catalog
CATALOG_AGENT_IMPORTED, CATALOG_SKILL_IMPORTED, CATALOG_TOOL_IMPORTED

// Phase 9: Security
AUDIT_LOG_CREATED
ACCESS_RULE_GRANTED, ACCESS_RULE_REVOKED
AGENT_API_KEY_CREATED,_AGENT_API_KEY_REVOKED

// Phase 10: Integrations
TELEGRAM_MESSAGE_RECEIVED, TELEGRAM_MESSAGE_SENT

// Phase 11: Chat
CHAT_DOCK_OPENED, CHAT_DOCK_CLOSED
MESSAGE_QUEUED, MESSAGE_DEQUEUED
`

---

## IMPLEMENTATION ORDER

### Sprint 1 (Week 1-2): Agent Management Foundation
1. Agent data model (0.1) -- ALL fields
2. Agent service (0.4) -- full CRUD + lifecycle
3. Agent types (1.1) -- AUTONOMOUS/ASSISTANT/META/REACTIVE/EXTERNAL
4. Agent avatars (0.6) -- component with 3 sizes
5. Agent list page (0.2) -- card grid with filters

### Sprint 2 (Week 3-4): Agent Detail + Interactions
6. Agent detail page (0.3) -- full management UI
7. Agent hierarchy (0.4) -- parent/child
8. Agent spawning (0.4) -- create child with inheritance
9. Agent delegation (0.4) -- assign tasks to children
10. Agent memory (0.9) -- CRUD + search

### Sprint 3 (Week 5-6): Agent Execution + Metrics
11. Agent executions (0.7) -- history + cost tracking
12. Agent metrics (0.10) -- KPIs + cost stats
13. Agent responsibilities (0.8) -- KPI tracking
14. Agent config revisions (1.2) -- version history + rollback

### Sprint 4 (Week 7-8): Tasks + Approvals
15. Task types + status (2.1)
16. Kanban board (2.2)
17. Approval presets (3.1)
18. Approval request flow (3.2)
19. Per-agent approval policy (0.13)

### Sprint 5 (Week 9-10): Export/Import + Skills
20. Agent export/import (0.11) -- with re-linking
21. Skill lifecycle (6.1) -- ACTIVE/STALE/ARCHIVED
22. Tool auth types (6.2)
23. Agent repository integration (0.12)

### Sprint 6 (Week 11-12): Budgets + Meetings
24. Agent budget (4.1) -- per-agent limits
25. Platform budget (4.2) -- org-wide
26. Meeting structure (5.1)
27. Meeting voting (5.2)

### Sprint 7 (Week 13-14): Settings + UI
28. Settings tabbed (7.1)
29. AI modules settings (7.2)
30. Command palette extended (7.3)
31. ChatDock (11.1)

### Sprint 8 (Week 15-16): Catalog + Security
32. Agent catalog (8.1)
33. Skill catalog (8.2)
34. Audit log (9.1)
35. Access rules (9.2)

### Sprint 9 (Week 17-18): AI Runner + Integrations
36. Tool loop detector (12.1)
37. Extended thinking (12.2)
38. Telegram integration (10.1)
39. N8N integration (10.2)

---

## KEY PRINCIPLES

1. **OUR stack** -- Dexie, Kernel DI, EventBus, Zustand, React
2. **No PostgreSQL** -- all data in IndexedDB via Dexie
3. **No Redis** -- in-process queues and Maps
4. **No Socket.io** -- EventBus for real-time
5. **No NestJS** -- Kernel DI container
6. **Single-user** -- no JWT/RBAC/multi-tenant (unlike AGEMS)
7. **Copy ideas, not code** -- implement features our way
8. **Test everything** -- vitest for each new service
9. **i18n parity** -- en/ru for all new UI strings
10. **DI registration** -- new phaseXX for each feature group
