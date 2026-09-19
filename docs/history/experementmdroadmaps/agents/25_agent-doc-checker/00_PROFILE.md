# 00_PROFILE — `agent-doc-checker` Canonical Profile

**Status:** VERIFIED from source. **Mode:** Research-only (no source changes).

## Identity (source of truth)

Defined in `src/kernel/state/agent-profiles.ts:262-271` as part of `AGENT_PROFILES` (25 curated workforce identities):

| Field                           | Value                                              | Source                |
| ------------------------------- | -------------------------------------------------- | --------------------- |
| `id` (node id)                  | `agent-doc-checker`                                | agent-profiles.ts:262 |
| `firstName` / `lastName`        | `Iris` / `Tanaka`                                  | :263-264              |
| `displayName`                   | `Iris Tanaka`                                      | :265                  |
| `baseRole`                      | `Consistency Checker`                              | :266                  |
| `avatar.emoji` / `avatar.color` | `🎯` / `#ef4444`                                   | :267                  |
| `provider`                      | `nvidia`                                           | :268                  |
| `model`                         | `meta/llama-3.3-70b-instruct`                      | :269                  |
| `specializations`               | `['Consistency', 'Cross-Reference', 'Validation']` | :270                  |

## Interpretation

- This node id IS a system agent. Agents are topology NODES; behavior is shared infrastructure (AGENTS.md — "Agents are topology NODES; behavior is SHARED infra").
- The profile is purely a **curated identity** (name, avatar, provider, model, specializations). It carries **no behavioral logic** of its own — there is no `agent-doc-checker` source file, service, or contract.
- `provider: 'nvidia'` + `model: 'meta/llama-3.3-70b-instruct'` is the _preferred_ model pin, applied to the topology node config at build time (see 02_TOPOLOGY). It is NOT used for routing directly inside `ChatExecutor` (provider is always `'auto'`; see 05_CONVERSATION_CORE).

## Verification notes

- Confirmed 25 seeded agents; `agent-doc-checker` is one of five in the **Documentation** group (architect/auditor/simplifier/historian/checker). See 10_DOC_CLUSTER.
- `AGENT_PROFILES` is consumed in exactly two production places: `topology-defaults.ts:96` (node normalization) and `topology-defaults.test.ts` (test). It is **not** read at runtime by `AgentService` or `agent-identity.ts` directly — identity at runtime is rebuilt from the topology node (see 01_IDENTITY).

## Confidence

- Profile block: VERIFIED (read directly).
- "No dedicated source/logic file": VERIFIED via Grep (`agent-doc-checker` appears only in `agent-profiles.ts` and `topology-defaults.ts`).
