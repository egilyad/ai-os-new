# 04_DEBATE_ROLE — `agent-security` in debates

> VERIFIED current behavior + POTENTIAL + RECOMMENDED + scenarios.

## CURRENT (VERIFIED)

- Selectable as a debate participant from `AgentService.getAgents()` in `DebatePanel`.
- `DebatePanel.tsx:232-252` builds the participant config from the topology node:
  - `provider: node.config.provider` → `nvidia`
  - `modelId: node.config.model` (if ≠ `auto`) → `meta/llama-3.3-70b-instruct`
  - `systemPrompt`: composed from **archetypesForRole** (role-based persona pool), NOT from the node's own `prompt` or `specializations` (`DebatePanel.tsx:241-250`).
  - `role`: assigned pro/con/neutral by the debate builder (default `neutral` in Invocation debate mode — `phase21-invocation.ts:81`).
- Execution: `debate-agent-executor.ts` → `debate-llm-caller.ts` (providerResolver, retries, failover, budget).
- Persona injection: `persona-selector.ts` (10 variants) is **keyword-driven** and contains **no security/red-team variant** (VERIFIED, `persona-selector.ts:3-241`). So despite being "Security Engineer", `agent-security` is given a generic `legal_expert`/`pragmatic_economist`/`critic` persona when topic keywords match, or a deterministic fallback otherwise. Its security identity is invisible to the persona layer.
- Multi-agent duplicate detection (`debate-llm-caller.ts:401` `isCrossAgentDuplicate`) treats it like any other agent.

## POTENTIAL (INFERRED/OPINION)

1. **Security reviewer / auditor side** — a `con`/neutral participant that stress-tests proposals for vulnerabilities, compliance gaps, and attack surface. Strong fit given `specializations: Threat Modeling, AppSec, Zero Trust`.
2. **Red-team attacker side** — adversarial persona that actively probes defenses (pair with `agent-ethics` as blue-team). Requires a `red_team` persona variant.
3. **Compliance gatekeeper** — emits a structured "security verdict" (pass/fail + findings) that the debate verdict can incorporate.

## RECOMMENDED (OPINION)

- Add a `security_reviewer` and `red_team` persona variant to `persona-selector.ts` (or a role-aware injector) so that when `agent-security` (or any `domain:security` agent) is a participant, it receives a security-native persona (STRIDE/OWASP/Zero-Trust framing) instead of a generic one.
- Persist the agent's `specializations` into its debate system prompt (see 11 quick win QW-1). This makes the security voice actually _specialized_ rather than generic.

## Scenarios

**S1 — Architecture debate (pro/con security review).** Topic: "Should we adopt a microservices boundary at the payments edge?" Route `agent-security` as `con` with a `security_reviewer` persona. Expected: surfaces STRIDE threats, token-exposure, blast-radius. Today: receives generic `legal_expert`/`critic` persona → weaker.

**S2 — Red/blue wargame.** `agent-security` (red_team) vs `agent-architect` (blue). Topic: "Penetration assumptions of our auth gateway." Today: no red-team persona exists; the agent would speak generically. After QW-1 + persona: realistic adversarial simulation.

**S3 — Policy compliance gate.** A debate on a new data-retention policy where `agent-security` is the neutral gatekeeper producing a structured security verdict consumed by `debate:verdict:generated` → Forum announcement. Today: verdict is free-text only.
