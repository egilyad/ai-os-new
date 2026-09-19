---
title: Profile — agent-doc-simplifier (Maya Lindholm)
status: VERIFIED
agent_id: agent-doc-simplifier
---

# 00 — PROFILE: `agent-doc-simplifier`

## Canonical identity (VERIFIED)

Source of truth: `src/kernel/state/agent-profiles.ts:242-251`.

| Field           | Value                                | Source                  |
| --------------- | ------------------------------------ | ----------------------- |
| node id         | `agent-doc-simplifier`               | `agent-profiles.ts:242` |
| firstName       | Maya                                 | `agent-profiles.ts:243` |
| lastName        | Lindholm                             | `agent-profiles.ts:244` |
| displayName     | Maya Lindholm                        | `agent-profiles.ts:245` |
| baseRole        | Documentation Simplifier             | `agent-profiles.ts:246` |
| avatar.emoji    | 💡                                   | `agent-profiles.ts:247` |
| avatar.color    | #10b981                              | `agent-profiles.ts:247` |
| provider        | groq                                 | `agent-profiles.ts:248` |
| model           | llama-3.1-8b-instant                 | `agent-profiles.ts:249` |
| specializations | Plain Language, Clarity, Restructure | `agent-profiles.ts:250` |

This record is one of **25** curated `AGENT_PROFILES` (`agent-profiles.ts:21`, the `CuratedAgentIdentity` map). It is authored (not derived), per the file header (`agent-profiles.ts:1-8`).

## Topology node (VERIFIED)

The profile is merged onto a topology node in `topology-defaults.ts:421-430`:

- `id: 'agent-doc-simplifier'`, `type: 'agent'`, `label: 'Simplifier Agent'`
- `config.roleName: 'Documentation Simplifier'`
- `config.prompt`: "You are a documentation simplifier. You take complex technical
  descriptions and make them accessible without changing their meaning. You never
  add new concepts — you only clarify existing ones. You remove jargon, shorten
  sentences, and restructure for readability." (`topology-defaults.ts:426-427`)
- `config.temperature: 0.3`, `config.tools: []`, `config.model: 'auto'`
  (overridden to `groq`/`llama-3.1-8b-instant` by the profile during
  `normalizeAgentIdentity`, `topology-defaults.ts:104-105`).

## Topology wiring (VERIFIED)

It is a **leaf worker** in the `AuditorTopology` (`topology-defaults.ts:459`):

- Edge `e-router-doc-simplifier` router → agent (`topology-defaults.ts:500-504`)
- Edge `e-doc-simplifier-agg` agent → aggregator (`topology-defaults.ts:552-556`)

It is one of 5 "Documentation" sibling nodes (`agent-doc-architect`, `-auditor`,
`-simplifier`, `-historian`, `-checker`), see `09_DOC_CLUSTER.md`.

## Classification cross-reference (VERIFIED)

`src/kernel/services/prompt-audit-service.ts:46` hardcodes
`if (node.id.startsWith('agent-doc-')) return 'Documentation';` — so this agent is
auto-classified into the **Documentation** audit domain.

## What is NOT present (VERIFIED, negative findings)

A repo-wide grep for `agent-doc-simplifier` returns matches **only** in
`topology-defaults.ts` (node + 2 edges) and `agent-profiles.ts`. No service,
no debate persona, no lens, no cognitive-module, no UI component references it by
id. It behaves **purely through shared infra** (see 01–14).
