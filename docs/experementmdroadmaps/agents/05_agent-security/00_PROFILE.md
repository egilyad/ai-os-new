# 00_PROFILE — `agent-security`

> RESEARCH-ONLY deep-dive. Read-only. All claims tagged VERIFIED (file:line evidence) / INFERRED (reasoned from code) / OPINION (recommendation).

## Identity (VERIFIED — `src/kernel/state/agent-profiles.ts:62-71`)

| Field           | Value                               | Source                 |
| --------------- | ----------------------------------- | ---------------------- |
| node id         | `agent-security`                    | `agent-profiles.ts:62` |
| firstName       | Yara                                | `agent-profiles.ts:63` |
| lastName        | Haddad                              | `agent-profiles.ts:64` |
| displayName     | Yara Haddad                         | `agent-profiles.ts:65` |
| baseRole        | Security Engineer                   | `agent-profiles.ts:66` |
| avatar          | emoji `🛡️`, color `#10b981`         | `agent-profiles.ts:67` |
| provider        | `nvidia`                            | `agent-profiles.ts:68` |
| model           | `meta/llama-3.3-70b-instruct`       | `agent-profiles.ts:69` |
| specializations | Threat Modeling, AppSec, Zero Trust | `agent-profiles.ts:70` |

## Topology node (VERIFIED — `src/kernel/state/topology-defaults.ts:194-205`)

- The node exists as a real topology agent node `id: 'agent-security'`, `type: 'agent'`, `label: 'Security Engineer'`.
- Default config before identity normalization: `roleName: 'Security Engineer'`, `prompt: 'You are a security engineer. Identify threats, attack vectors, and security gaps. Apply defense-in-depth and least-privilege principles. Use STRIDE and OWASP Top 10.'`, `temperature: 0.15`, `tools: SECURITY_TOOLS`, `model: 'auto'`.
- `SECURITY_TOOLS = ['vulnerability_scan', 'code_audit', 'threat_model']` (`topology-defaults.ts:9`).
- Wired into the **default mission topology**: edge `e-router-security` `router → agent-security` (data_flow) and `e-security-agg` `agent-security → aggregator` (on_success) (`topology-defaults.ts:468,520`).

## Identity normalization (VERIFIED — `topology-defaults.ts:91-119`)

`normalizeAgentIdentity()` merges `AGENT_PROFILES[node.id]` into the node config at topology-build time: `displayName`, `firstName`, `lastName`, `baseRole`, `specializations`, `avatar`, `provider`, `model` are overwritten from the curated profile; `lensIds` defaults to `[]`. **Result: at runtime the node carries provider `nvidia` and model `meta/llama-3.3-70b-instruct`.**

## Persona / system prompt (VERIFIED)

- The LLM-facing **system prompt is the static topology `prompt`** (`topology-defaults.ts:200`), NOT derived from the curated specializations or the name "Yara Haddad". `agent-profiles.ts` only supplies identity metadata; the behavioral prompt is the generic "You are a security engineer…" text.
- The name "Yara Haddad" is surfaced in **UI only** via `resolveAgentIdentity` (`agent-identity.ts:129-143`), not in the LLM prompt.

## Avatar (VERIFIED — `AgentAvatar.tsx:47`, `agent-identity.ts:102-114`)

- Because `normalizeAgentIdentity` injects `avatar: { emoji:'🛡️', color:'#10b981' }` into node config, `resolveAgentIdentity` uses it directly. The fallback deterministic hash (`AgentAvatar.tsx:47`) is NOT used for this agent.

## Where used / which systems can reach it (VERIFIED / INFERRED)

- **Default topology mission flow**: router may route a task to `agent-security` (`topology-defaults.ts:468`). INFERRED: only if mounted topology is the default and the router classifies the request as security-relevant.
- **AgentsPanel** generic agent card (`AgentsPanelView.tsx:344` → `AgentCard`).
- **Debate**: selectable participant. `DebatePanel.tsx:232-252` reads `node.config.provider`/`model` and injects them into the participant config, so a debate with `agent-security` runs on `nvidia`/`meta/llama-3.3-70b-instruct`.
- **ConversationCore / Director**: referenced by id in scenario participants (e.g. `ParticipantsField.tsx`, `RunTab.tsx` via `AgentIdentityChip`).
- **Invocation (RoomPanel)**: human can pick any registered agent, including `agent-security` (`phase21-invocation.ts:43-58`, RoomPanel UI).
- **Agent journal / stats**: visible via `AgentJournalService` + `AgentService.getStats`.

## Related agents (VERIFIED)

- Adjacent technical agents in default topology: `agent-architect` (`topology-defaults.ts:183`), `agent-devops` (`:207`), `agent-database` (`:219`), `agent-perf` (`:231`).
- Security-adjacent: `agent-risk` (Risk Analyst, STRIDE/DREAD/FAIR — `:157`), `agent-ethics` (Ethics Officer — `:169`). **No predefined team/group links them** (see 02/03).
- A `lens:security` exists (`lens-library.ts:69`) but is **not** attached to `agent-security.lensIds` (`normalizeAgentIdentity` leaves `lensIds: []`).

## Systems that can invoke it (VERIFIED)

| System                                     | Can invoke?      | Mechanism                                                                        |
| ------------------------------------------ | ---------------- | -------------------------------------------------------------------------------- |
| Default router/orchestrator                | Yes (if mounted) | topology edge `router→agent-security`                                            |
| Debate                                     | Yes              | `DebatePanel` participant picker; `InvocationExecutionDelegate` debate mode      |
| ConversationCore / Director                | Yes              | scenario participant by id                                                       |
| Invocation Engine (Room)                   | Yes              | human picks agent; default policy `Manual Room Chat` matches `human-mention`     |
| Knowledge/Crystal/Forum/Workflow/Scheduler | No automatic     | N/A — these operate on content/domains, not agent-security specifically (see 02) |
