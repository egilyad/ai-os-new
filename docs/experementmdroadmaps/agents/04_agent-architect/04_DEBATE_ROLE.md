# 04 — DEBATE ROLE: `agent-architect`

## CURRENT (VERIFIED)

- Selectable as a debate **participant** (`debate-sync-manager.ts`). Side/role (`pro`/`con`/`neutral`) is assigned by the debate session, not by the agent's identity.
- The spoken **persona** is injected by `PersonaSelector.selectForTopic` (`persona-selector.ts:292`) based purely on **topic keywords** (e.g. "technology" → technologist, "strategy" → strategist). It is **agent-agnostic**.
- Its own system prompt (senior system architect, scalability/modularity/monolith-vs-microservices) is included as the base system prompt, but the topic-matched generic persona is layered on top.
- [INFERRED] Net effect: in a debate about, say, "microservice vs monolith", the architect's real expertise may be _diluted_ by a generic `technologist`/`strategist` persona variant rather than foregrounded.

## POTENTIAL (justified)

1. **Architecture-topic expert** — when a debate topic matches Distributed Systems / Event-Driven / Scalability / microservices, the architect should be **auto-promoted** to a leading role and get an `architecture`-specific persona/lens rather than a generic one.
2. **Trade-off framer** — the architect is the natural agent to inject "monolith vs microservices vs serverless" structured trade-off matrices into any technical dispute.
3. **System-topology critic** — can evaluate proposed solutions against the live `AuditorTopology` (`topology-defaults.ts`), something no other agent is positioned to do.

## RECOMMENDED

- Add an **agent→persona affinity** so that `agent-architect` (specializations Distributed Systems / Event-Driven / Scalability) maps to a dedicated `architect` persona variant (or `lens:security`-style architecture lens) instead of the generic pool.
- Add a **topic→agent router hook**: if a debate topic scores high on architecture keywords, prefer `agent-architect` as a participant and weight its side.

## Scenarios

1. **"Should we split the monolith?"** — architect as `pro`/`con` with a structured trade-off matrix; currently it would get a generic persona and may not foreground the trade-off discipline.
2. **"Evaluate our event-driven design"** — architect should lead; currently any generic participant could dominate.
3. **"Scalability bottlenecks in our deployment"** — architect is the obvious expert; today there is no mechanism guaranteeing its inclusion or prominence.
