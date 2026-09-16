# Invocation Engine — Agent Rooms (DESIGN, no code yet)

Status: **DESIGN ONLY**. Architectural decisions are fixed below. No implementation
until the open question in §7 is resolved. Goal: avoid building throwaway bridges
like the forum→debate one we just removed.

## 1. Goal

A system where AI agents participate in **live rooms/channels** (mIRC-like: `#medicine`,
`#security`, `#architecture`…) and in the **forum**, but **only when invoked** — never
spontaneously. The Invocation Engine is a **thin dispatch layer over existing
infrastructure**, not a new conversation mechanism.

## 2. Fixed decisions

### D1 — Real-time + persistent log

A Room is a true live channel (WebSocket / event stream for the live view) **and** every
message is persisted as an event in `ConversationCore`. Forum is NOT replaced — it stays
the async public layer.

### D2 — Hybrid dispatcher, policy-gated (RESOLVED = option B)

An invocation can be triggered by any of:

- `@agent` mention
- explicit "request an expert" by a human
- automatic matching by agent **expertise/role**
- an event emitted by another module (via `EventBus`)
- a `consensus` / `debate` request
- a schedule / cron policy

**RESOLVED = option B (with the human-predefined caveat):** automatic triggers are permitted
**only when a human has predefined a policy** that authorizes them. A human configures once
(`architecture topic → architecture agents → auto-invoke`); afterwards that topic no longer
needs per-call confirmation. The Invocation Engine still checks the matching policy before
every single invocation. Agents never self-invoke.

### D3 — Managed call chains

An agent may _request_ another agent (e.g. "for this I need security-agent"). That request
does **not** go agent→agent directly. It is routed back through the Invocation Engine, which
creates a new invocation. This keeps a single choke point and avoids autonomous agent soup.

### D4 — Room ≠ forum thread

They are **two projections of one conversation/event context**:

```
Forum Topic  →  Invocation  →  Room Session  →  ConversationCore
```

Forum = async public layer. Room = live execution view. They can be linked, but a Room is
**not** "just a mode of a forum thread".

### D5 — Narrow responsibility (the contract discipline)

> The Invocation Engine answers ONLY: **who, why, in what context, with what constraints.**

Everything else is delegated:

- `ConversationCore` / `ConversationDirector` → runs the conversation
- `Debate` engine → structured adversarial
- Room UI → live presentation
- Forum → async public topics

It must NOT become "ConversationService #7".

### D6 — Authority = human via predefined policies; agents never self-invoke (RESOLVED)

The human is the sovereign authority: they define the invocation **policies** up front. The
engine checks the matching policy before every invocation and rejects if none applies. Agents
**never appear because they want to** — autonomy boundary: an agent only responds to a call.
A managed call chain (D3) is itself gated by a policy flag `allowAgentInitiatedInvocation`:
if false, an agent's suggestion to involve another agent stays a _suggestion_; if true, the
engine creates a new invocation through the same dispatcher path.

### D7 — Invocation is intent, not execution (RESOLVED)

An `Invocation` is a _recorded intention to invoke an agent_, distinct from the agent's actual
execution. Flow:

```
InvocationRequest
      → Policy Check
      → Invocation Accepted (persisted intent)
      → ConversationCore / Debate / Room (execution)
      → Agent Execution
```

This separation yields a clean audit trail
(who → why → which policy allowed → who chosen → context → what happened) and maps directly
onto the event-sourced architecture. Execution is always delegated; the engine never runs an
agent itself.

## 3. Architecture

```
Human
  │ configures policy
  ▼
Invocation Policy ──────────────┐
  │                             │
  ▼                             │ (checked every call)
Invocation Engine               │
  │                             │
  ├── trigger: @mention         │
  ├── trigger: topic expertise  │
  ├── trigger: forum event      │
  ├── trigger: consensus request│
  └── trigger: schedule         │
  │                             │
  ▼                             │
Agent Registry ◄────────────────┘
  │
  ▼
ConversationCore / Room / Debate  (execution, delegated)
```

`Forum → Invocation → ConversationCore → {Room | Debate}`. The EventBus is the wiring fabric
(already connects forum/generator/debate today). The Policy store is the human-authored
gate the engine consults before each invocation.

## 4. Proposed contract (design sketch, not implementation)

```ts
// who decides + why
type InvocationCaller =
  | { kind: 'human'; id: string }
  | { kind: 'event'; event: string; source: string }
  | { kind: 'schedule'; jobId: string };

// what/who to involve
type InvocationTarget =
  { agentId: string } | { role: string } | { expertise: string[] };

// where it happens
type InvocationContext =
  | { type: 'forum-topic'; ref: string }
  | { type: 'room'; ref: string }
  | { type: 'conversation'; ref: string };

interface InvocationConstraints {
  maxTurns?: number;
  mode?: 'chat' | 'debate' | 'director-scenario';
  policyRef?: string;
  ttlMs?: number;
}

interface InvocationRequest {
  caller: InvocationCaller;
  target: InvocationTarget;
  reason: string; // why
  context: InvocationContext;
  constraints?: InvocationConstraints;
}

interface InvocationPlan {
  id: string;
  agents: AgentRef[]; // who (resolved)
  session: { kind: 'conversation' | 'debate' | 'room'; ref: string };
  authorizedBy: string; // human id or policy id (D6)
  policyRef?: string; // which policy allowed it
}

// D7: the invocation is an *intent* record. Execution is delegated and tracked separately.
type InvocationStatus =
  | 'requested'
  | 'accepted' // policy passed, intent persisted
  | 'rejected' // no policy / policy denied
  | 'executing' // handed to ConversationCore/Debate/Room
  | 'done';

interface IInvocationEngine {
  invoke(req: InvocationRequest): Promise<InvocationPlan>;
  // D3: agent may REQUEST, but it re-enters here (managed chain)
  handleAgentRequest(
    requestingAgent: AgentRef,
    desired: InvocationTarget,
    context: InvocationContext,
  ): Promise<InvocationPlan | { rejected: string }>;
}

interface IInvocationEngine {
  invoke(req: InvocationRequest): Promise<InvocationPlan>;
  // D3: agent may REQUEST, but it re-enters here (managed chain)
  handleAgentRequest(
    requestingAgent: AgentRef,
    desired: InvocationTarget,
    context: InvocationContext,
  ): Promise<InvocationPlan | { rejected: string }>;
}
```

The engine resolves `target` → concrete agent(s) (against the agent registry / personas),
then delegates execution to `ConversationCore` (or `Debate` / `Director` per `mode`).

## 5. Reuse map (do not rebuild)

| Need                | Existing                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| Run a conversation  | `ConversationDirectorService` + `ConversationCore` (`src/kernel/services/conversation-*`)                       |
| Structured dispute  | `Debate` engine                                                                                                 |
| Module wiring       | `EventBus` (`src/kernel/event-bus.ts`)                                                                          |
| Async public topics | `ForumService` (`src/kernel/services/forum/forum-service.ts`)                                                   |
| Agent identities    | agent registry / personas                                                                                       |
| Live stream seed    | existing live stream already visible in `AgentsPanel` during Debate — candidate first Room UI, not a new system |

## 6. Anti-goals (explicitly NOT building)

- NOT a new `ConversationService` / `ChatService` #7.
- NOT agent self-invocation / autonomous posting.
- NOT a Room that is "just a forum mode".
- NOT new parallel bridges (the failure mode we just removed from forum→debate).
- NOT auto-starting debates/calls without human authorization (D6).

## 7. Resolved: D2 = B

Confirmed by user. Automatic invocations are allowed **only via human-predefined policies**
(`Invocation Policy` in the diagram). The engine checks the policy before every call. The
`policyRef` hook already in the contract supports B without extra entities. Agent-initiated
chains (D3) remain gated by the `allowAgentInitiatedInvocation` policy flag.

## 8. Data model (design — minimal, no implementation yet)

Guiding rule (post-bridge doctrine): **only the persistence needed for event-sourced intent

- audit trail; no tables "for the future".** Exactly **two** tables. Agents, sessions and
  messages already live in existing subsystems and are referenced only via `sessionRef` /
  `resolvedAgents` — they are NOT duplicated here.

### 8.1 `invocations` (owner: Invocation Engine)

Indexes — primary `id`; secondary `status, callerKind, contextType, policyRef, createdAt`.
Fields mirror the approved `Invocation` contract (§11.3):

```
invocations: 'id, status, callerKind, contextType, policyRef, createdAt'
  id: string                              // pk, engine
  status: InvocationStatus                // engine (only writer)
  source: InvocationSource                // engine (copy of request)
  caller: { kind, id }                    // engine (copy)
  target: { agentId? | role? | expertise? } // engine (copy)
  resolvedAgents: AgentRef[]              // engine (post-accept)
  reason: string                          // engine (copy)
  context: { type, ref }                  // engine (copy)
  constraints: { maxTurns?, mode?, ttlMs? } // engine (finalized; no policyRef hint column)
  policyRef: string                       // engine (authoritative)
  sessionRef?: { kind, ref }              // engine (set on accept; opaque correlation)
  rejectionReason?: string                // engine (on 'rejected')
  createdAt: number                       // engine
  updatedAt: number                       // engine
```

No execution-result columns (per §11.3.1): the outcome lives in the execution subsystem.

### 8.2 `invocationPolicies` (owner: human; engine enforces)

Indexes — primary `id`; secondary `enabled, domain, source, priority`.
Fields mirror the approved `InvocationPolicy` contract (§11.4):

```
invocationPolicies: 'id, enabled, domain, source, priority'
  id: string                              // pk, engine (genId) / human create
  name: string                            // human
  enabled: boolean                        // human (default true)
  createdBy: string                       // human (human id)
  match: { domain?, topicPattern?, expertise?, event?, schedule?, source? } // human
  actions: { target: InvocationTarget; mode? } // human (single action, v1 — §11.4)
  allowAgentInitiatedInvocation: boolean  // human (D3 gate)
  priority?: number                       // human (resolution order)
```

These two tables are the **entire** persistence surface of the Invocation Engine. Anything
else is out of scope until the architecture actually needs it. The actual Dexie schema bump
(`schema-types.ts` version increment + table registration) happens only at the implementation
step, not here.

## 9. Event model (design — exactly 5 events, no implementation)

All events flow on the existing `EventBus`. Event-sourced, supports the D7 audit trail.

**Hard rule (APPROVED): exactly five `invocation:*` events.** No `failed` / `timeout` /
`cancelled` / `agent-selected` / `policy-matched` / `session-created` / "we-might-need-later".
Execution-detail events belong to the execution subsystem, not here. Adding events = expanding
the "Invocation Event Universe" — the same trap as the bridges.

For every event the separation is fixed:

1. **emitter / owner** — who publishes it (only the Invocation Engine, except the _request_
   which is delivered as a method call, not an event — see below);
2. **aggregate writer** — who may mutate `Invocation` (always the Engine only);
3. **observer** — who may only read (Forum/Debate/Core/Room UI, audit log);
4. **snapshot vs correlation** — `invocationId` + the engine-assigned fields are _snapshot of
   intent_; `sessionRef` / `resultRef` are _correlation metadata_ (opaque to observers, owned
   by the execution subsystem).

```
invocation:requested   { invocationId, caller, target, context }
invocation:accepted    { invocationId, policyRef, agents }
invocation:rejected    { invocationId, reason }            // no policy / denied
invocation:executing   { invocationId, sessionRef }
invocation:done        { invocationId, resultRef }

> **`sessionRef` rule (intent-first lifecycle):** the execution session is created
> only inside `execution.start()`, i.e. **after** the invocation is accepted. Therefore
> `sessionRef` is part of `INVOCATION_EXECUTING`, NOT `INVOCATION_ACCEPTED`.
> `accepted` = "intent resolved + policy allowed"; `executing` = "execution actually
> started, here is its session". This keeps the engine from provisioning an external
> execution resource before the invocation is officially accepted.
```

### 9.1 Per-event ownership

| Event                  | Emitter / owner                                                         | Aggregate writer | Observer                     | Payload kind                                                        |
| ---------------------- | ----------------------------------------------------------------------- | ---------------- | ---------------------------- | ------------------------------------------------------------------- |
| `invocation:requested` | **Invocation Engine** (emitted _after_ it receives `InvocationRequest`) | Engine           | Forum/Debate/Core/Room/audit | snapshot of intent (caller, target, context)                        |
| `invocation:accepted`  | Engine                                                                  | Engine           | observers + policy audit     | snapshot (`policyRef`, `agents`) — no `sessionRef` (see rule above) |
| `invocation:rejected`  | Engine                                                                  | Engine           | observers + policy audit     | snapshot (`reason`)                                                 |
| `invocation:executing` | Engine                                                                  | Engine           | observers                    | correlation (`sessionRef`) only                                     |
| `invocation:done`      | Engine                                                                  | Engine           | observers + audit            | correlation (`resultRef`) only                                      |

### 9.2 `invocation:requested` — the dangerous one (APPROVED guard)

The `InvocationRequest` arrives at the Engine as a **method call** (`IInvocationEngine.invoke`),
NOT as a bus event. The Engine then emits `invocation:requested` carrying a **copy** of the
raiser-supplied fields. Consequences:

- The raiser never publishes to the bus on its own → it cannot write into the `Invocation`
  aggregate. It only hands data to the Engine.
- The event payload is a **snapshot** taken by the Engine; the persisted `Invocation` is the
  authoritative copy. External modules that observe `invocation:requested` are **read-only** —
  they must not treat it as an input channel back into the aggregate.
- This is precisely the boundary that prevents an external module from accidentally becoming an
  `Invocation` writer via the event bus (the failure mode we are guarding against).

Audit trail = ordered replay: `requested → accepted(policyRef) → executing → done`
(or `rejected`). This is exactly the event-sourced history the architecture already uses.

## 10. Integration points (design — boundary map, no new adapters/buses)

No new adapters, facades or buses. For each existing module we state only:
**calls Engine → contract passed → what Engine returns → events observed → who owns the result.**

```
① Forum  (trigger raiser — human or policy-gated)
   Forum ──invoke(InvocationRequest)──▶ InvocationEngine
   ◀── Invocation (persisted intent)
   observes:  invocation:*     (read-only)
   owns result of: nothing — Forum stays owner of its topic/post only.
   NOTE: Forum does NOT auto-create invocations; it raises a request the
         Engine policy-gates. No forum→X bridge (anti-goal).

② EventBus  (module events as potential triggers)
   Emitter (CrystalVault / Debate / Generator) ──event──▶ EventBus
   InvocationEngine ──subscribes (policy.match.event)──▶ builds InvocationRequest(caller:'event')
   ◀── Invocation
   observes:  its own domain events only; emitter does NOT know about invocations.
   owns result of: nothing — emitter keeps owning its domain.

③ Agent Registry  (resolution only)
   InvocationEngine ──resolve(target)──▶ AgentRegistry
   ◀── AgentRef[]  (resolvedAgents)
   observes:  nothing (sync read)
   owns result of: AgentRegistry owns agent definitions; Engine only reads.

④ ConversationCore / Director  (execution target)
   InvocationEngine ──start(sessionInput + invocationId as opaque metadata)──▶ Core
   ◀── sessionRef
   observes (Engine):  nothing extra; Core emits conversation:* on EventBus
   observes (Room/UI/audit):  conversation:* (live view / audit)
   owns result of:  ConversationCore owns the session + its messages/execution.

⑤ Debate  (execution target, structured)
   InvocationEngine ──start(debateInput + invocationId metadata)──▶ Debate
   ◀── sessionRef
   observes (Engine):  nothing extra; Debate emits debate:* on EventBus
   observes (Room/UI/audit):  debate:* (live view / audit)
   owns result of:  Debate owns the debate; Engine keeps only sessionRef correlation.

⑥ Room UI  (live projection + human initiator)
   Human ──invoke(InvocationRequest)──▶ InvocationEngine   (Room UI is the request surface)
   ◀── Invocation
   observes:  invocation:*  +  conversation:* / debate:*  (for the live #channel stream)
   owns result of:  nothing — Room is a view; Core/Debate own execution.
   seed: existing live stream in AgentsPanel during Debate.
```

### 10.1 Boundary summary

| Module           | Calls Engine?          | Contract in                  | Returns      | Owns result                |
| ---------------- | ---------------------- | ---------------------------- | ------------ | -------------------------- |
| Forum            | yes (human/policy)     | `invoke(InvocationRequest)`  | `Invocation` | Forum owns topic/post only |
| EventBus emitter | no (Engine subscribes) | policy `match.event`         | —            | emitter owns domain        |
| Agent Registry   | Engine→registry        | `resolve(target)`            | `AgentRef[]` | Registry owns agents       |
| ConversationCore | Engine→core            | `start(input, invocationId)` | `sessionRef` | Core owns session          |
| Debate           | Engine→debate          | `start(input, invocationId)` | `sessionRef` | Debate owns debate         |
| Room UI          | human→engine           | `invoke(InvocationRequest)`  | `Invocation` | Room owns nothing          |

**Key invariant:** every cross-module call is one-directional and the Engine is the only
writer of `Invocation`. No module translates its own events into `invocation:*` writes, and
no execution subsystem reaches back into the Invocation aggregate. After §10, pause and
review the whole design (decisions → contract → data → events → integration) before any
implementation.

## 11. Contracts (DRAFT — review only, no code yet)

Pure type/interface definitions. **No implementation, no DB schema, no service changes.**
Each field lists **M**andatory / **O**ptional and its **owner** — the only component allowed
to write it. This prevents `ForumService` / `ConversationDirector` / `DebateEngine` /
`InvocationEngine` from dragging each other's responsibility (the exact failure mode of the
forum→debate bridge).

### 11.1 Supporting value types

```ts
// Who/what raised the trigger. Set by the external raiser; engine copies it immutably.
interface InvocationCaller {
  kind: 'human' | 'event' | 'schedule'; // M, owner: trigger raiser
  id: string; // M, owner: trigger raiser
}

// The 6 trigger mechanisms (D2). Declared by raiser; engine validates + policy-gates.
type InvocationSource =
  | 'human-mention'
  | 'human-expert-request'
  | 'expertise-match'
  | 'module-event'
  | 'consensus-request'
  | 'schedule';

// What/who to involve. Declared by raiser; engine resolves role/expertise → agents.
type InvocationTarget =
  { agentId: string } | { role: string } | { expertise: string[] };

// Where it happens. Declared by raiser (immutable).
type InvocationContext =
  | { type: 'forum-topic'; ref: string }
  | { type: 'room'; ref: string }
  | { type: 'conversation'; ref: string };

type ExecutionMode = 'chat' | 'debate' | 'director-scenario';

// Optional guardrails. Raiser MAY supply; engine finalizes (applies defaults).
interface InvocationConstraints {
  maxTurns?: number; // O, owner: raiser (hint) / engine (final)
  mode?: ExecutionMode; // O, owner: raiser (hint) / engine (final)
  ttlMs?: number; // O, owner: raiser (hint) / engine (final)
  policyRef?: string; // O, owner: raiser (HINT ONLY) — engine decides authoritative policy
}

// Lightweight agent reference produced by the registry.
interface AgentRef {
  id: string;
  role?: string;
  expertise?: string[];
}
```

### 11.2 InvocationRequest (input intent — raiser → engine)

```ts
// Everything here is SUPPLIED BY THE RAISER. Engine does not own/mutate these.
interface InvocationRequest {
  source: InvocationSource; // M, owner: raiser
  caller: InvocationCaller; // M, owner: raiser
  target: InvocationTarget; // M, owner: raiser
  reason: string; // M, owner: raiser (why)
  context: InvocationContext; // M, owner: raiser (where)
  constraints?: InvocationConstraints; // O, owner: raiser (hint) / engine (final)
}
```

| Field       | Req | Owner                          | Notes                                     |
| ----------- | --- | ------------------------------ | ----------------------------------------- |
| source      | M   | raiser                         | engine validates against policy           |
| caller      | M   | raiser                         | immutable snapshot on `Invocation`        |
| target      | M   | raiser                         | engine resolves to agents, keeps original |
| reason      | M   | raiser                         | free text, audit                          |
| context     | M   | raiser                         | immutable                                 |
| constraints | O   | raiser hint / **engine final** | engine applies defaults                   |

### 11.3 Invocation (persisted intent — owned solely by Invocation Engine)

```ts
type InvocationStatus =
  'requested' | 'accepted' | 'rejected' | 'executing' | 'done';

interface Invocation {
  id: string; // M, owner: Invocation Engine (genId)
  status: InvocationStatus; // M, owner: Invocation Engine (ONLY writer)
  source: InvocationSource; // M, owner: engine (immutable copy of request)
  caller: InvocationCaller; // M, owner: engine (immutable copy)
  target: InvocationTarget; // M, owner: engine (immutable copy)
  resolvedAgents: AgentRef[]; // M (post-accept), owner: engine (registry resolve)
  reason: string; // M, owner: engine (copy of request)
  context: InvocationContext; // M, owner: engine (copy of request)
  constraints: InvocationConstraints; // M (finalized), owner: engine
  policyRef: string; // M, owner: engine (authoritative; NOT the request hint)
  sessionRef?: ExecutionTarget; // O→M on accept, owner: engine (set when handed off)
  rejectionReason?: string; // O, owner: engine (set on 'rejected')
  createdAt: number; // M, owner: engine
  updatedAt: number; // M, owner: engine
}
```

**Ownership rule (critical):** `Invocation` is an aggregate owned _exclusively_ by the
Invocation Engine. `ForumService`, `ConversationDirector`, `DebateEngine` and Room **NEVER
write any field**. They receive `sessionRef` (an opaque correlation id) and emit execution
events; the engine correlates them back. This keeps subsystems decoupled — no responsibility
drift.

#### 11.3.1 Invocation lifecycle semantics (APPROVED — do not expand)

Legal transitions only:
`requested → accepted → executing → done` and `requested → rejected`.

- `done` is **terminal for the invocation _intent_**. It means the invocation was handed to
  the execution subsystem — **not** that execution succeeded.
- The actual execution outcome (success / failure / partial / timeout) lives in the execution
  subsystem (`ConversationCore` / `Debate` / `Room`) and its events. It is **not** an
  `InvocationStatus`.
- **Do NOT add** `failed` / `expired` / `cancelled` / `timeout` / `partial` statuses.
  Invocation owns the fate of the _calling intent_, not the full business model of the
  execution result. If a future need appears, record it as an `invocation:done` event payload
  or in the execution subsystem — never as a new `Invocation` status. This is the explicit
  guard against lifecycle-expansion (the same trap as the bridges).

### 11.4 InvocationPolicy (human-authored gate, D2=B / D6)

```ts
interface InvocationPolicyMatch {
  domain?: string; // O, owner: human
  topicPattern?: string; // O (regex), owner: human
  expertise?: string[]; // O, owner: human
  event?: string; // O, owner: human (EventBus event name)
  schedule?: string; // O (cron), owner: human
  source?: InvocationSource; // O, owner: human (restrict trigger type)
}

interface InvocationPolicy {
  id: string; // M, owner: engine (genId) / human create
  name: string; // M, owner: human
  enabled: boolean; // M, owner: human (default true)
  createdBy: string; // M, owner: human (human id)
  match: InvocationPolicyMatch; // M, owner: human
  actions: { target: InvocationTarget; mode?: ExecutionMode }; // M, owner: human
  allowAgentInitiatedInvocation: boolean; // M, owner: human (D3 gate)
  priority?: number; // O, owner: human (resolution order)
}
```

> **v1 scope (APPROVED):** `actions` is a **single** object, not an array. Do **not** pre-build
> a general-purpose policy engine with multi-action chains. If a future need arises, extend
> `actions` to an array — but that is out of scope now.

### 11.5 Policy evaluation result (produced by engine)

```ts
type PolicyEvaluation =
  | {
      decision: 'allow';
      policy: InvocationPolicy;
      resolvedTarget: InvocationTarget;
    }
  | { decision: 'deny'; reason: string; policy?: InvocationPolicy }
  | { decision: 'no-match' };
```

Owner: **Invocation Engine** produces it; the matched `policy` is referenced, never mutated.

### 11.6 Link Invocation → ConversationCore / Debate / Room

```ts
type ExecutionTarget =
  | { kind: 'conversation'; ref: string } // ConversationCore session id
  | { kind: 'debate'; ref: string } // Debate session id
  | { kind: 'room'; ref: string }; // Room session id
```

The engine, after `accepted`, creates the session in the target subsystem, passing
`invocationId` as **opaque correlation metadata** (subsystem stores it but does not interpret
or own it). `Invocation.sessionRef` records the result. This one-way correlation
(engine → subsystem) preserves ownership boundaries.

### 11.7 Service contract (design)

```ts
interface IInvocationEngine {
  invoke(req: InvocationRequest): Promise<Invocation>; // requested → accepted/rejected
  handleAgentRequest(
    requestingAgent: AgentRef,
    desired: InvocationTarget,
    context: InvocationContext,
  ): Promise<Invocation | { rejected: string }>; // D3, policy-gated
  getInvocation(id: string): Promise<Invocation | undefined>;
}
```

## 12. Next steps (strict order, no code until implementation)

1. **Contract** — `IInvocationEngine` + types in `src/kernel/contracts/` (design only so far).
2. **Data model** — `invocations` + `invocationPolicies` Dexie tables (schema bump).
3. **Event model** — `invocation:*` Zod payloads in `event-registry.ts`.
4. **Integration points** — wire triggers (forum/EventBus) → engine, engine → Core/Debate.
5. **Implementation** — only after 1–4 are reviewed and accepted.
6. **Room UI** — extend existing live stream into a `#channel` view.
7. Drop any new auto-bridge; keep forum→forum/generator bridges only.

## 13. E2E Validation / Step 6 closure (DONE 2026-08-14)

**Status: CLOSED ✅** — the full chain was proven with the _real_ runtime, not a mock of the Engine.

**Chain proven:**

```
RoomPanel → InvocationEngine → Policy → Agent Registry → ConversationCore → live events → Store → done
```

### 13.1 Integration test

`src/components/RoomPanel/room-invocation-e2e.integration.test.tsx` — **2/2 pass** (`vitest run`).
Mirrors the Conversation Director B6.1 pattern:

- real `defaultContainer` + singleton `coreEventBus` + `clearResolvedServices()` + real `invocationEngineService` registered;
- stubbed `chatService` (`IChatExecutorAdapter`) echoes a valid `MESSAGE_RESPONSE` on `coreEventBus`;
- renders the **real** `RoomPanel`;
- asserts the **real** `useInvocationStore` (subscribed to `coreEventBus`).

**Test 1 — full lifecycle:**
`requested` → (smoke policy `match.source:'human-mention'` allows) → `accepted` →
`ConversationCore` (chat mode via `ChatExecutor`) → `executing` → `conversation:*` live output
observed in store → `done`. Aggregate persisted in `invocationRepository` with `INVOCATION_DONE`
status + `sessionRef`.

**Test 2 — generic guard:**
`coreEventBus.subscribeAll` during the run asserts **no `debate:`/`forum:`-prefixed event** fires
while `INVOCATION_*` + `CONVERSATION_*` do — proves the new mechanism did not accidentally drag the
old architecture along.

### 13.2 Smoke policy (seeded in test)

```ts
{
  id: 'smoke-policy',
  enabled: true,
  match: { source: 'human-mention' },
  actions: { target: { agentId: SMOKE_AGENT }, mode: 'chat' },
  allowAgentInitiatedInvocation: false,
}
```

Target `smoke-agent` is supplied by `RoomPanel` as `req.target` and resolved by
`InvocationEngineService.resolveTarget()` from the test `agentService`.

### 13.3 Verified

- **2/2 integration tests pass.**
- **Full lifecycle** `requested→accepted→executing→done` with **live `conversation:*`** output.
- **Persistence** — aggregate written to `invocations` table via `InvocationRepository`.
- **No `debate`/`forum` events** during the run (generic-architecture guard).
- `tsc -p tsconfig.json --noEmit` **clean** for all `room/invocation/e2e` files.

### 13.4 Files changed (by test work only)

- `src/kernel/dal/_test-harness.ts` — added v20 `invocations`/`invocationPolicies` getters + `clearAll()`
  (shim previously omitted v20 tables).
- `src/components/RoomPanel/room-invocation-e2e.integration.test.tsx` — NEW (2 tests).
- Production architecture / contracts / schema / events / Room UI **untouched** by test changes.

### 13.5 Pending Design Question (NOT a bug — do NOT fix now)

**Policy `actions.target` vs `InvocationRequest.target` semantics.** `policy.actions.target` is a
declarative part of the policy, but actual target resolution is performed from `req.target`
(`InvocationEngineService.invoke()` resolves `req.target`, not `policy.actions.target`);
`evaluate()`/`matches()` only gate on `match.source/event/expertise`. Open question: should the
policy _define_ the target, or only _permit/constrain_ the invocation? Requires a separate decision;
no code change made.

### 13.6 Outcome

- **E2E — CLOSED ✅**
- **Production architecture — untouched ✅**
- **Invocation Engine — proven end-to-end ✅**
- **Room proof surface — working ✅**

The invocation dispatch layer now stands as a thin, policy-gated router over the existing execution
environments (ConversationCore / Director / Debate) — none of which had to be modified.
