# 04_DEBATE_ROLE — `agent-risk` in debates

## CURRENT behavior (VERIFIED)

- Selected via `debate-api.ts:299-321`. When a debate is created without explicit `ids`, the first 3 agent nodes are taken (`agentNodes.slice(0,3)`); with explicit ids it uses those.
- **Side assignment is positional:** `roleOrder = ['pro','con','neutral']; role: roleOrder[i % 3]` (debate-api.ts:307-311). So agent-risk's side depends purely on its index in the chosen list — completely independent of its "Risk Analyst" identity.
- **Persona injection** (`dynamic-persona` flag) uses `PersonaSelector.selectForTopic(agentId, participant.role||'neutral', topic, round, ...)` (debate-llm-prompt-context.ts:878). The 10 variants are topic-keyword driven; NONE is risk/compliance-specific. Best matches for a risk topic: `cautious_scientist` (keywords: evidence, data, statistics, methodology), `pragmatic_economist` (cost, regulation, investment), `legal_expert` (liability, regulation, policy). These are generic, not guaranteed.
- Base system prompt (STRIDE/DREAD/FAIR) is always injected (topology-defaults.ts:162) and overrides/competes with the persona injection.

## POTENTIAL roles (justified by specialization — INFERRED/OPINION)

Given specializations **Risk Modeling, Monte Carlo, Compliance**, strong fit:

1. **Devil's advocate / Risk critic** — systematically attack any proposal's failure modes. Maps to `con` side naturally. Justified: "Categorize risks by probability and impact" is literally con-position framing.
2. **Evidence analyst / Fact checker** — demand empirical backing, quantify uncertainty. Maps to `neutral`/`con`. Justified by Monte Carlo (probabilistic reasoning).
3. **Judge-advisor / Risk auditor** — independent risk assessment of both sides. Maps to `neutral`. Justified by Compliance + frameworks (STRIDE/DREAD/FAIR).
4. **Red-team** — adversarial security/economic risk probing. Maps to `con`. Justified by STRIDE (threat modeling).

## RECOMMENDED assignment (OPINION)

- Add a **risk-specific persona variant** `risk_analyst` to `persona-selector.ts` (category-aligned with `lens:security` risk tag) with trigger keywords: `risk, compliance, probability, impact, mitigation, threat, liability, regulation, monte carlo, audit, stride, dread, fair, exposure`.
- Make side assignment **specialization-aware**: a `Risk Analyst` should default to `con`/`neutral` (challenger/critic) unless the topic is itself about risk mitigation (then `pro`). This requires a small change in `debate-api.resolveParticipants` to consult `AGENT_PROFILES.specializations` rather than positional `i % 3`.
- Keep the STRIDE/DREAD/FAIR base prompt; have the risk persona _reinforce_ it, not replace.

## Concrete debate scenarios (OPINION)

1. **"Should we deploy the new payment service to production this quarter?"**
   - agent-risk as `con`/risk-critic: Monte Carlo on incident probability × blast radius; STRIDE on the payment flow; compliance gaps (PCI-DSS). Strong, natural fit.
2. **"Is our AI model training pipeline compliant with the new EU regulation?"**
   - agent-risk as `neutral` risk-auditor: map controls to compliance requirements, flag gaps, quantify penalty exposure.
3. **"Should the company adopt a zero-trust architecture?"**
   - agent-risk as `con`/red-team: threat-model the migration, DREAD-score the transition risk, Monte Carlo the rollout failure probability.

## Risk of current design

Because side is positional, scenario 1 could seat agent-risk as `pro` (defending deployment) — semantically wrong for a Risk Analyst. This is the single highest-value debate fix (VERIFIED mechanic, low effort).
