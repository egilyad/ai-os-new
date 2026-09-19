# 04_DEBATE_ROLE — `agent-network` in debates

> All roles below reuse the existing `PersonaSelector` + debate runtime. No new debate code.

## CURRENT role (VERIFIED)

- `agent-network` is a **generic debate participant**. When added to a debate it receives a side (pro/con/neutral) chosen by the debate configuration (`debate-prompt-builder.ts:674`, `debate-session-bridge.ts:84`). The invocation delegate hard-codes `neutral` for debate mode (`phase21-invocation.ts:81`).
- Within a turn, the `PersonaSelector` (`persona-selector.ts:251-309`) picks a **PersonaVariant** from 10 generic variants by matching the _topic_ keywords and the assigned role. Its specializations (TCP/IP, SDN, Latency) are **not** inputs. So Nadia may be assigned `technologist` / `cautious_scientist` / `pragmatic_economist` etc. purely by topic, identical to any other agent.
- Its actual voice = node system prompt (`topology-defaults.ts:150`) + the injected persona variant text. There is no networking-specific stance logic.

## POTENTIAL debate roles (INFERRED from specialization)

Justified by `TCP/IP`, `SDN`, `Latency Optimization` + the network-engineer prompt:

1. **Evidence analyst / Fact checker** — can ground arguments in protocol facts, latency budgets, throughput ceilings. Fits `cautious_scientist` variant.
2. **Architect (technical)** — can evaluate system/topology trade-offs (latency vs fault tolerance vs cost). Fits `technologist` variant.
3. **Devil's advocate / Red-team** — can probe a proposal's failure modes (single point of failure, congestion, partition). Fits `critic` variant.
4. **Security reviewer (adjacent)** — network security overlaps `agent-security`; can flag transport/SDN attack surface. Partial fit.
5. **Synthesizer** — when the topic is infrastructure/connectivity, can reconcile pro/con via engineering trade-offs. Fits `diplomat` variant.

Roles NOT justified: Neutral judge-advisor (no mandate), Passionate Advocate (conflicts with low temp 0.2 analytical persona), Legal Expert (no law specialization), Historian (no history specialization).

## RECOMMENDED default (OPINION)

- **Primary: Evidence analyst / Architect (technical)** on infrastructure, distributed-systems, and latency-sensitive topics.
- **Secondary: Red-team / Devil's advocate** for resilience/failure-mode critiques.
- Auto-assign side by **topic**, not fixed: pro when arguing "build X", con when arguing "X is risky", neutral for architecture reviews.

## Concrete debate scenarios where it shines (INFERRED)

1. **"Should we migrate from monolith to service mesh?"** — Nadia weighs SDN/sidecar latency, mTLS overhead, fault domains. Pairs with `agent-architect` (scalability) + `agent-security` (Zero Trust).
2. **"Is edge computing worth the cost for our latency SLA?"** — brings TCP/IP RTT, CDN, anycast; pairs with `agent-risk` (Monte Carlo) + `agent-devops` (observability).
3. **"Evaluate a proposed zero-trust network redesign"** — flags east-west traffic, micro-segmentation; pairs with `agent-security` + `agent-architect`.
4. **"Will our protocol handle 10x traffic?"** — throughput/fault-tolerance analysis; pairs with `agent-devops` + `agent-risk`.

## What is missing to realize this (VERIFIED gap)

- Persona selection ignores `specializations` (`persona-selector.ts:251`). To make Nadia a networking Evidence Analyst, either (a) add networking keywords to a variant, or (b) prefer the agent's `specializations` when choosing a variant. Both are small changes to `persona-selector.ts` + `debate-llm-prompt-context.ts:878`.
- Side assignment (`debate-prompt-builder.ts:674`) could consult `specializations` to bias pro/con for infrastructure topics.
- The node system prompt already covers latency/throughput/fault-tolerance, so the _voice_ is fine; only the _stance/variant_ selection is specialization-blind.
