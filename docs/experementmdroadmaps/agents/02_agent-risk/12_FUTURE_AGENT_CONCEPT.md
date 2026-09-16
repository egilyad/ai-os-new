# 12_FUTURE_AGENT_CONCEPT — "fully realized" `agent-risk`

> Built ONLY from EXISTING capabilities, extrapolated. Not a spec for new infra.

## Mission

Rafael Stone is the system's **quantitative risk & compliance assurance officer**: every
significant decision, deployment, or design passes through his probability×impact lens before
it is trusted. He is adversarial by default and evidence-bound.

## Responsibilities (mapped to existing infra)

- **Risk taxonomy & scoring** — categorize risks (STRIDE/DREAD/FAIR) and score them. Today: static prompt (topology-defaults.ts:162). Realized: prompt + `risk_model` tool (B2) + semantic memory of prior scores (M2).
- **Monte-Carlo simulation** — quantify uncertainty of outcomes. Today: named in profile only. Realized: invoked via analytics/risk tool (B2), output persisted.
- **Compliance auditing** — map actions to controls/regulations. Today: label. Realized: compliance checklist generated per turn, journaled (M3), announced to Forum (B3).
- **Devil's advocate in debates** — default `con`/neutral side (Q4) with `risk_analyst` persona (M1).
- **Assurance overlay** — score any debate/conversation output (B1).

## Capabilities (existing → extended)

- Debate participant (debate-api) → specialization-aware side + risk persona.
- ConversationCore participant (resolveAgent) → memory-augmented turns.
- Invocation (RoomPanel) → risk-context templates + scheduled sweeps.
- Cognitive: emit `cognitive:decision:made` with risk metadata, surfaced (Q5/M5).
- Memory: semantic/episodic agent-scoped recall (M2) + auto-journal (M3).
- Knowledge/Crystal: risk findings crystallized via crystal-debate-bridge; compliance gaps announced to Forum.

## Context & memory

- Long-term semantic memory of frameworks, prior FAIR/DREAD scores, regulatory mappings.
- Episodic memory of each risk review (topic, date, score, mitigations).
- Working memory of the current debate/conversation under assessment.
- All auto-loaded via the `resolveAgent` seam (agent-service.ts:337) — no new store.

## Tools / services reused

- `ANALYTICS_TOOLS` (data_analysis/visualization/web_search) — topology-defaults.ts:8.
- `risk_model` tool (extension of tool contract) for quantification.
- `agentJournalService`, `memoryService`, `crystalVault`, `forumService`, `invocationEngine`, `conversationDirectorService` — all already exist.

## Debate behavior

- Default `con` (challenger) or `neutral` (auditor). Uses `risk_analyst` persona to demand
  evidence, quantify downside, propose mitigations. Whisper-channel ally = other analytical
  agents (agent-critic/agent-data) when present.

## Collaboration

- In Director scenarios: leads "Risk Review" (M4) with architect+security.
- In Forum: authors compliance-announcement posts (existing forum bridge).
- With other analytical agents: forms an "Analytical" cluster (prompt-audit-service.ts group) for consensus risk calls.

## Invocation

- Human: RoomPanel quick-pick (risk templates, Q3).
- Proactive: scheduled sweeps (B3) — the only "autonomous" behavior, gated by human policy (D6).

## Cognitive visibility

- Every assessment emits `cognitive:decision:made` with `{ probability, impact, score, framework }`
  in metadata; rendered as a red/amber/green badge in AgentDetailPanel + DebateRuntimePanel.

## UI

- AgentCard: specialization chips (Q1) + curated avatar (Q2) + risk-score badge.
- AgentDetailPanel: Risk summary widget (M5) — last assessment, open risks, compliance coverage.
- RoomPanel: risk Task hints (Q3) + "Risk Review" scenario quick-launch (M4).
- DebateRuntimePanel/Director: assurance badge per turn (B1).

## Outputs

- Structured risk scorecard (probability×impact matrix), Monte-Carlo distributions, compliance gap list, mitigation plan, crystallized risk knowledge, forum compliance announcements.

## Limitations (honest)

- Still LLM-bounded: quantification quality depends on model + tool sandbox. The `auto` model
  mismatch (P2) must be resolved (pin or explicit) for reproducible risk math.
- No legal authority — compliance output is advisory; human remains authority (D6).
- Memory caps (P2.20) bound how much risk history is retained.
