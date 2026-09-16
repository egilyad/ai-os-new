# 00_PROFILE — `agent-doc-architect`

> Status: RESEARCH-ONLY deep-dive. No source changes. All claims tagged **VERIFIED** (read from source) / **INFERRED** / **OPINION**.

## Identity (VERIFIED — `src/kernel/state/agent-profiles.ts:222-231`)

| Field           | Value                                               | Source                      |
| --------------- | --------------------------------------------------- | --------------------------- |
| Node id         | `agent-doc-architect`                               | `agent-profiles.ts:222`     |
| First / Last    | Bianca / Conti                                      | `agent-profiles.ts:223-224` |
| Display name    | "Bianca Conti"                                      | `agent-profiles.ts:225`     |
| Base role       | "Documentation Architect"                           | `agent-profiles.ts:226`     |
| Avatar          | emoji `🏛️`, color `#a855f7`                         | `agent-profiles.ts:227`     |
| Provider        | `openrouter`                                        | `agent-profiles.ts:228`     |
| Model           | `openrouter/meta-llama/llama-3.3-70b-instruct`      | `agent-profiles.ts:229`     |
| Specializations | `Information Architecture`, `Taxonomy`, `Standards` | `agent-profiles.ts:230`     |

## Topology node (VERIFIED — `src/kernel/state/topology-defaults.ts:397-407`)

- Raw node config: `roleName: 'Documentation Architect'`, `prompt` (the "never invent features" architect prompt, `topology-defaults.ts:402`), `temperature: 0.1`, **`tools: []`** (empty — `topology-defaults.ts:404`), `model: 'auto'` (raw).
- **Effective model is NOT `auto`.** `normalizeAgentIdentity` (`topology-defaults.ts:91-119`) overwrites `config.model` with `profile.model` at `topology-defaults.ts:105`. So the live topology node carries `model: 'openrouter/meta-llama/llama-3.3-70b-instruct'`, `provider: 'openrouter'`, `specializations`, `avatar`, `firstName/lastName/displayName`. (VERIFIED by reading the merge function.)
- Edges: router→agent `e-router-doc-architect` (`topology-defaults.ts:488-492`); agent→aggregator `e-doc-architect-agg` (`topology-defaults.ts:540-544`).

## Cluster context (VERIFIED)

- 25 seeded agents total (`agent-profiles.ts` — 25 `agent-*` keys found).
- Documentation cluster of 5 sibling nodes, all wired identically to the router + aggregator:
  - `agent-doc-architect` (Bianca Conti)
  - `agent-doc-auditor` (Felix Moreau) — `agent-profiles.ts:232`
  - `agent-doc-simplifier` (Maya Lindholm) — `agent-profiles.ts:242`
  - `agent-doc-historian` (Oscar Vilhelm) — `agent-profiles.ts:252`
  - `agent-doc-checker` — `agent-profiles.ts:262`
- The cluster is **5 independent topology nodes**; there is **no coordination subsystem** linking them (VERIFIED — no shared service, no `document:*` events, no group membership assigned at seed time).

## Identity resolution (VERIFIED — `src/kernel/services/agent-identity.ts`)

`resolveAgentIdentity(id)` (`agent-identity.ts:62`) pulls from `agentService.resolveAgent`, the `lens-engine`, and `agentAvatarService`. For `agent-doc-architect`:

- `lensIds` defaults to `[]` (`topology-defaults.ts:106`), so **no lenses** are attached (lens library has 11 lenses, none for documentation/taxonomy — see `10_PROBLEMS_AND_LIMITATIONS.md`).
- Resolved identity = displayName "Bianca Conti", emoji `🏛️`, provider name "OpenRouter", model `openrouter/meta-llama/llama-3.3-70b-instruct`.

## Tags

- **VERIFIED**: profile fields, merged model/provider, empty tools, 25-agent count, cluster membership, identity resolution path.
- **INFERRED**: empty `tools` implies no grounding capability (directly readable from source, but behavioral impact is inference).
