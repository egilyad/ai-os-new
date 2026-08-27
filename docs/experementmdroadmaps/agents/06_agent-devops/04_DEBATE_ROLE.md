# 04_DEBATE_ROLE — `agent-devops` in debates

> VERIFIED from `persona-selector.ts` + `topology-defaults.ts`; INFERRED for devops specifics.

## CURRENT behavior (VERIFIED)

- Tomas Berg is selectable as a debate participant via the topology node (`topology-defaults.ts:206-217`) and the debate runtime's persona/participant machinery.
- `PersonaSelector.selectForTopic(agentId, agentRole, topic, round, usedVariants, language)` (`persona-selector.ts:251-308`):
  - Filters variants by `minRound` and `suitableRoles` (only `pro`/`con`/`neutral`).
  - Scores by **topic keyword** match (e.g. `technologist` variant triggers on `tech, kubernetes`? → actually `kubernetes` is NOT in `technologist` keywords; `technology, automation, devops`? — `devops` is NOT a keyword either).
  - **Crucially, the agent's own specialization (`CI/CD`, `Kubernetes`, `Observability`) is never consulted.** Persona is purely topic × side.
- Net: when devops joins a debate, it receives a _generic_ persona variant (e.g., `technologist` if the topic hits tech keywords, otherwise a deterministic fallback). Its DevOps expertise is latent — it lives only in the node `prompt` (`topology-defaults.ts:212`), not in the persona injection.

## Finding (OPINION, high confidence)

The single most important debate gap: **`agent-devops` is a DevOps _name_ over a generic _voice_.** A debate on "Should we migrate to Kubernetes?" will not automatically grant Tomas Berg a Kubernetes-operator persona; it gets whatever the topic-keyword lottery yields.

## POTENTIAL (justified)

1. **Specialization-aware persona** — extend `PersonaSelector` to bias toward variants whose keywords overlap the agent's `specializations` (Kubernetes→`technologist`/`strategist`; Observability→`cautious_scientist`). Justified: specializations already exist on the node (`agent-profiles.ts:80`) and are passed to `AgentResolverDirectory` (`phase21-invocation.ts:54`) but never used for persona.
2. **DevOps debate side** — when a debate topic matches infra/CI/deploy/observability keywords, preferentially seat `agent-devops` (and `agent-security`, `agent-architect`) on the relevant side. Justified: these are the domain experts; current selection is topology/round-robin, not expertise-matched.
3. **DevOps-specific lens during debate** — attach the (currently missing) ops lens to devops turns. See `02_CAPABILITIES.md` (no ops lens exists).

## RECOMMENDED

- Short term: add `kubernetes`, `ci/cd`, `observability`, `deployment`, `incident` to the `technologist` (and a new `operations`?) variant keywords, **and** pass `agentRole` as the _base role_ so `suitableRoles` can match domain experts, OR add a specialization-override path in `selectForTopic`.
- Medium term: expertise-matched participant seating for infra topics.

## 3 scenario sketches (INFERRED)

1. **"Blue/green vs canary deployment"** — Tomas Berg (pro-canary, observability-driven rollback) vs `agent-risk` (pro-blue/green, lower blast radius) vs `agent-security` (supply-chain attestation). Devops should carry the `technologist`+`strategist` voice.
2. **"Self-healing Kubernetes vs manual ops"** — devops + `agent-architect` (scalability) vs `agent-critic` (fallacy/dependent-failure critique).
3. **"SLOs and error budgets as deployment gates"** — devops + `agent-perf` (load testing) + `agent-quality` (test automation) building a consensus on CI gating.

## Risk of doing nothing (OPINION)

Debates that _should_ be anchored by a DevOps perspective will surface it only incidentally, weakening the system's credibility on infra topics — a core advertised strength ("25 specialized agents").
