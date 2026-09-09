# 11 — OPPORTUNITIES for `agent-content`

Each: ID, Description, User value, Technical reuse, Effort, Risk, Dependencies, Existing infra, Why now.

## 5 QUICK WINS (days, low risk)

### QW-1 — Content-quality scorer (readability/SEO heuristic)

- **Description:** After `agent-content` produces a response, run a heuristic scorer (Flesch reading ease, keyword density, heading structure) and attach it to the step as a `cognitive:decision:made` or a step tag.
- **User value:** Users see "is this draft good?" instantly; makes the "Strategist" title meaningful.
- **Reuse:** `COGNITIVE_STEP_COMPLETED` listener (memory-engine.ts:181 pattern); `cognitive:decision:made` event (fixes dead event, 07).
- **Effort:** LOW (pure function + one listener).
- **Risk:** LOW (display-only).
- **Deps:** none hard.
- **Infra:** event-registry.ts:776, orchestration-service.ts:414.
- **Why now:** Dead event already exists; cheap win.

### QW-2 — Fix avatar consistency (📝 everywhere)

- **Description:** Make `AgentAvatar` prefer `node.config.avatar` from `resolveAgentIdentity`; keep hash fallback for unknown ids.
- **User value:** Lena looks like Lena on every screen.
- **Reuse:** agent-identity.ts:102-114, AgentAvatar.tsx:47.
- **Effort:** LOW (1 component).
- **Risk:** LOW (keep fallback).
- **Deps:** none.
- **Infra:** topology-defaults.ts:103 (avatar already injected).
- **Why now:** Trivial polish, currently inconsistent (10_P2).

### QW-3 — Specialization chips on AgentCard / Detail

- **Description:** Render `specializations` (Editorial/SEO/Messaging) as chips from `resolveAgentIdentity`.
- **User value:** Communicates the agent's domain at a glance.
- **Reuse:** agent-identity.ts:135, AgentsPanel components.
- **Effort:** LOW.
- **Risk:** LOW.
- **Deps:** none.
- **Infra:** agent-profiles.ts:170.
- **Why now:** Metadata already exists, just hidden (10_P5).

### QW-4 — RoomPanel content task presets

- **Description:** Quick-task buttons in RoomPanel prefill `reason` ("Draft blog post", "SEO audit", "Rewrite for audience X").
- **User value:** One-click content requests, no prompt engineering.
- **Reuse:** RoomPanel task textarea (AGENTS.md Step 6 rework); phase21-invocation.ts.
- **Effort:** LOW (UI only).
- **Risk:** LOW.
- **Deps:** none.
- **Infra:** phase21-invocation.ts:61-109.
- **Why now:** Invocation already works (B6).

### QW-5 — Editorial clarity debate persona

- **Description:** Add one `PersonaSelector` variant (`editorial_clarity`) matched on content/messaging keywords; let `Creative` group agents prefer it.
- **User value:** `agent-content` contributes uniquely in debates (clarity/framing), not generically.
- **Reuse:** persona-selector.ts:3-241 scoring machinery.
- **Effort:** LOW (one variant object).
- **Risk:** LOW (keyword-gated).
- **Deps:** none.
- **Infra:** persona-selector.ts:243-308.
- **Why now:** 10_P7 shows the gap; selector is extensible by design.

## 5 MEDIUM (1-3 weeks)

### MED-1 — Agent-scoped memory recall

- **Description:** Retrieve memories by `metadata.source==='agent-content'` and feed a "previous work" brief at turn time.
- **User value:** Lena gains continuity; remembers past drafts/audits.
- **Reuse:** memory-engine.ts:188 `source` field already present.
- **Effort:** MEDIUM (retrieval + prompt injection in resolveAgent/ChatExecutor).
- **Risk:** MEDIUM (prompt bloat, cross-agent leakage if filter wrong).
- **Deps:** 08_MEMORY_AND_CONTEXT.
- **Infra:** memory-engine.ts:181-200.
- **Why now:** Foundation exists; just not scoped.

### MED-2 — Content draft/review Director template

- **Description:** Ship a reusable Director scenario template: `agent-content` DRAFT → `agent-critic` REVIEW → `agent-content` EDIT (new `TurnProposal.objective.type` values DRAFT/EDIT/SEO_REVIEW).
- **User value:** One-click multi-pass content production.
- **Reuse:** conversation-orchestrator.ts, TurnProposal contract.
- **Effort:** MEDIUM (template + 2-3 new objective types).
- **Risk:** MEDIUM (contract extension; keep backward compatible).
- **Deps:** none.
- **Infra:** contracts/conversation/turn.ts, conversation-director-service.ts.
- **Why now:** Director is production (B6.2).

### MED-3 — Structured content output card

- **Description:** When `agent-content` responds, render in a markdown/editor surface with export (MD/HTML) + copy.
- **User value:** Usable content artifacts, not chat blobs.
- **Reuse:** generic message rendering; identity-aware consumers.
- **Effort:** MEDIUM (UI component).
- **Risk:** LOW-MEDIUM.
- **Deps:** none.
- **Infra:** DirectorPanel RunTab, AgentDetailPanel.
- **Why now:** Complements QW-4.

### MED-4 — Content portfolio tab

- **Description:** AgentDetailPanel sub-tab aggregating `agentJournalService.listByAgent('agent-content')` + memory-by-source into a portfolio.
- **User value:** See everything Lena produced across sessions.
- **Reuse:** agent-journal-service.ts:253, memory source filter (MED-1).
- **Effort:** MEDIUM.
- **Risk:** LOW.
- **Deps:** MED-1.
- **Infra:** AgentHistoryTab pattern.
- **Why now:** Journal already queryable by agent.

### MED-5 — Expertise-match invocation policy

- **Description:** A policy matching `context.type:'forum'` + `expertise:'Editorial'` auto-routes content tasks to `agent-content` (D2 expertise-match, INVOCATION_ENGINE.md).
- **User value:** Content tasks auto-find the right agent without manual pick.
- **Reuse:** phase21-invocation.ts:125-144 policy seed; matches() source/event/expertise.
- **Effort:** MEDIUM (policy + resolver expertise field already exists).
- **Risk:** MEDIUM (auto-invocation authority; keep human-gated default).
- **Deps:** none.
- **Infra:** contracts/invocation.ts, phase21-invocation.ts.
- **Why now:** Policy model supports it (Step 6 note).

## 3 BIG IDEAS

### BIG-1 — Content Skill Pack (lens + tools + prompt-extensions)

- **Description:** A "content skill" composed of (a) a `lens:editorial-seo` lens, (b) content tools (readability scorer QW-1, SEO analyzer, plagiarism/draft diff), (c) per-turn prompt extensions (tone/audience/format). Attached to `agent-content` (and the `Creative` group) without forking the agent model.
- **User value:** Turns a generic node into a real Content Strategist.
- **Reuse:** lens-engine (lens-library.ts), tool registry (SEARCH_TOOLS pattern, topology-defaults.ts:326), TurnProposal objective extensions.
- **Effort:** HIGH (weeks).
- **Risk:** MEDIUM (scope creep; keep additive).
- **Deps:** QW-1, MED-2, MED-3.
- **Infra:** lens-engine, tool contracts, conversation contracts.
- **Why now:** All primitives exist; only composition is missing.

### BIG-2 — Autonomous Content Pipeline (Builder + Scheduler + Forum)

- **Description:** Let `agent-content` be the orchestrator-actor in a Builder workflow: draft → SEO score (QW-1) → post to Forum for review → schedule revisions. Human authority retained (D6).
- **User value:** End-to-end content production with human checkpoints.
- **Reuse:** builder-agent-service (workflows), forum-service (topics/posts), scheduler (future), ConversationCore.
- **Effort:** HIGH.
- **Risk:** HIGH (multi-subsystem).
- **Deps:** BIG-1, MED-1.
- **Infra:** phase19-builder, forum-service, phase21-invocation.
- **Why now:** Builder/Forum/Invocation are all production.

### BIG-3 — "Lena" as a persistent content persona with memory + voice

- **Description:** Promote `agent-content` from a stateless node to a _persistent content character_: agent-scoped memory (MED-1), brand-voice profile (stored in node config), decision log (QW-1 + 07), and a portfolio (MED-4). The identity ("Lena Petrova") becomes a durable, learning content operator.
- **User value:** A content colleague that remembers your brand and past work.
- **Reuse:** All of the above; no new subsystem.
- **Effort:** HIGH (integration).
- **Risk:** MEDIUM (memory leakage, identity confusion with other agents).
- **Deps:** MED-1, MED-4, QW-1, 07.
- **Infra:** agent-profiles.ts, memory-engine.ts, agent-journal-service.ts.
- **Why now:** The persona is already curated (agent-profiles.ts:162); only the persistence is missing.
