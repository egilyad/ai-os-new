# 00_PROFILE — `agent-writer` (Clara Bengtsson)

> Research-only deep-dive. All claims tagged **[VERIFIED]** (found in source), **[INFERRED]** (reasoned from source), or **[OPINION]** (recommendation/assessment). No source changes made.

## Identity

| Field           | Value                                  | Evidence                                                                                                   |
| --------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Node id         | `agent-writer`                         | `src/kernel/state/agent-profiles.ts:212`; `src/kernel/state/topology-defaults.ts:383`                      |
| Display name    | **Clara Bengtsson**                    | `agent-profiles.ts:215`                                                                                    |
| First / last    | Clara / Bengtsson                      | `agent-profiles.ts:213-214`                                                                                |
| Base role       | **Technical Writer**                   | `agent-profiles.ts:216`; topology node `roleName` `topology-defaults.ts:387`                               |
| Avatar          | emoji `📝`, color `#14b8a6`            | `agent-profiles.ts:217`                                                                                    |
| Provider        | **groq**                               | `agent-profiles.ts:218`                                                                                    |
| Model           | **llama-3.1-8b-instant**               | `agent-profiles.ts:219`                                                                                    |
| Specializations | **Documentation, Tutorials, API Docs** | `agent-profiles.ts:220`                                                                                    |
| Lens ids        | _(none)_                               | node config has no `lensIds`; profile does not set any. Lens library has no documentation lens — see 02/07 |

## Node placement (topology)

- Type `agent`, label "Technical Writer". `topology-defaults.ts:382-393`.
- Edges: `router → agent-writer` (`e-router-writer:485`) and `agent-writer → aggregator` (`e-writer-agg:537`). So in the **default topology** the writer is a pipeline stage between the mission router and the synthesis aggregator — same shape as the five `agent-doc-*` nodes.

## Persona prompt (system prompt)

> "You are a technical writer. Document APIs, architecture decisions, and user guides. Write clearly, precisely, and for your target audience. Use consistent terminology." — `topology-defaults.ts:388`

Node temperature `0.3`, tools `SEARCH_TOOLS`. `topology-defaults.ts:389-390`.

## Where it is used / surfaced

- **Runtime pipeline**: as a topology node, the writer can be a participant in any request routed through the default topology and in debates whose topology includes it.
- **Agent identity**: resolved everywhere via `AgentService.resolveAgent` (`agent-service.ts:337`) → `resolveAgentIdentity` (`agent-identity.ts:62`) → `AgentAvatarView` (`agent-identity.ts:20`). Consumed by Director/AgentIdentityChip, Debate runtime AgentControlPanel, Forum AuthorBadge, AgentComparisonPanel, Dashboard AgentLiveBoard.
- **AgentsPanel UI**: listed in `getAgents()` (`agent-service.ts:306`) → `AgentsPanelView` / `AgentCard` / `AgentDetailPanel` / `AgentIdentityEditor` / `AgentWizard` / `AgentAvatar`.
- **Role registry**: a built-in role `r-tech-writer` ("Technical Writer") exists independently in `role-service.ts:298-309` (separate from the agent node).
- **Prompt-audit classification**: `'agent-writer': 'Specialized'` in `prompt-audit-service.ts:30`.

## Systems that can invoke it

- **ConversationCore / Director**: via `agentService.resolveAgent('agent-writer')` in `ConversationOrchestrator` / `ChatExecutor` / `ConversationDirectorService` — any scenario/turn that names `agent-writer` as `participantId`.
- **Debate**: any debate session whose topology contains the node; persona assigned by topic keyword (`persona-selector.ts`), **not** by the "Documentation" specialization.
- **Invocation (RoomPanel)**: a human can pick Clara from the agent `<select>` (`RoomPanel` → `invocationEngine.invoke` with `target.agentId:'agent-writer'`), gated by a `human-mention` policy (`phase21-invocation.ts`).
- **Runtime pipeline (router)**: the Mission Router may route a task to the writer. `[INFERRED]` whether it actually does depends on the router's classification — writer is a generic "specialized" node, not a domain node.

## Related agents (the "documentation cluster")

`agent-profiles.ts:212-271` defines six documentation agents. `agent-writer` is the **generalist**; the other five are specialized variants:

| id                     | Name            | Role                     | Specializations                               |
| ---------------------- | --------------- | ------------------------ | --------------------------------------------- |
| `agent-writer`         | Clara Bengtsson | Technical Writer         | Documentation, Tutorials, API Docs            |
| `agent-doc-architect`  | Bianca Conti    | Documentation Architect  | Information Architecture, Taxonomy, Standards |
| `agent-doc-auditor`    | Felix Moreau    | Documentation Auditor    | Compliance, Review, Accuracy                  |
| `agent-doc-simplifier` | Maya Lindholm   | Documentation Simplifier | Plain Language, Clarity, Restructure          |
| `agent-doc-historian`  | Oscar Vilhelm   | Documentation Historian  | (history/changelog focus)                     |
| `agent-doc-checker`    | (see profiles)  | Documentation Checker    | (consistency checks)                          |

All six are wired router→node→aggregator in the same topology (`topology-defaults.ts:485-565`). `[OPINION]` The writer overlaps heavily with the five `doc-*` agents; the system currently has no mechanism to distinguish or coordinate them (no "documentation team", no routing by specialization).

## Persona vs role vs profile

- The **node** carries `roleName`, `prompt`, `temperature`, `tools`, `model` (`topology-defaults.ts:386-392`).
- The **profile** (`agent-profiles.ts:212-221`) supplies human identity (name, avatar, provider, model, specializations) and is **merged into the node config** by `normalizeAgentIdentity` (`topology-defaults.ts:91-118`), overriding `model:'auto'` with `llama-3.1-8b-instant` and `provider:groq`.
- The **role** `r-tech-writer` (`role-service.ts:298`) is a _separate_ reusable template; it is not auto-attached to the node.
