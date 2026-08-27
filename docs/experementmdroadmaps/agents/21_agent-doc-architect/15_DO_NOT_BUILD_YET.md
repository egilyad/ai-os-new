# 15_DO_NOT_BUILD_YET — `agent-doc-architect`

> Things explicitly NOT to build now, with reasons. **OPINION** on the "yet"; **VERIFIED** on the constraints cited.

## DNB-1 — A dedicated "Documentation Service / DocEngine"

- **Why not:** Violates the project's dependency rule and "no doc-specific subsystem" finding (VERIFIED: no `document:*` events, no doc service exists; the doc cluster is 5 generic nodes). Building a new facade duplicates `AgentService` + `ConversationDirectorService` + `CrystalVault`. Per `AGENTS.md`, behavior is SHARED infra; agents are topology nodes, not services.
- **Instead:** evolve via tools + lenses + a `documents` store (13-A/B) consumed through existing services.

## DNB-2 — A doc-architect-specific vector/embedding store

- **Why not:** Premature. The agent has no grounding tools yet (P1); a vector store before tools is unused infrastructure. Embedding/search is already available via `SEARCH_TOOLS`/existing retrieval.
- **Instead:** First grant tools (A1); only consider a specialized taxonomy index if the `documents` store (B1) proves insufficient.

## DNB-3 — Autonomous doc rewriting / auto-publish

- **Why not:** Breaks human authority (D6 in `INVOCATION_ENGINE.md`): "Authority = human; agents never self-invoke." Auto-rewriting shipped docs without review risks shipping confidently-wrong documentation (P1 ungrounded).
- **Instead:** agent **proposes** (Future Concept 12); human approves; `agent-doc-auditor` validates.

## DNB-4 — Separate documentation microservice / separate EventBus

- **Why not:** `AGENTS.md` — "No circular deps", "events first through EventBus". A second bus or service duplicates the kernel contract boundary. The Invocation Engine is explicitly "NOT a new conversation service" — same principle applies here.
- **Instead:** add at most 5 `document:*` events to the existing `event-registry.ts` (B2).

## DNB-5 — Special-casing doc-architect in `persona-selector.ts` by specialization

- **Why not:** The selector is topic/role-based and shared by all 25 agents (`persona-selector.ts:251-290`). Hard-coding doc-architect would fracture the generic model. A documentation-architecture **variant** (additive to the 10 variants) is acceptable; an `if (agentId==='agent-doc-architect')` branch is not.
- **Instead:** add a doc-architecture persona variant + trigger keywords (O4) applied to any agent in a doc debate.

## DNB-6 — Bumping doc-architect to a bigger/more expensive model

- **Why not:** Already on 70B (`agent-profiles.ts:229`). A larger model multiplies cost for every doc task with no proven quality gain; `agent-writer` deliberately stays 8B for drafts (`agent-writer/10_PROBLEMS_AND_LIMITATIONS.md:22`). Right agent, right cost.
- **Instead:** route heavy doc tasks to doc-architect (70B) and light drafts to `agent-writer` (8B) — already possible via groups/policies.

## DNB-7 — New agent to "manage" the doc cluster

- **Why not:** Adds an agent that manages agents — against D3 (managed call chains, engine-mediated) and YAGNI. The doc cluster can be coordinated by a scenario/policy (D1/O5), not a new node.
- **Instead:** coordinate via Director scenario + consistency-checker pipeline (D1).

## Summary

Everything "do not build" shares one theme: **do not create new subsystems, services, buses, or agents for documentation.** Extend the existing shared infra (tools, lenses, events, store, scenarios, policies) additively. Human authority and the generic-agent model are hard constraints.
