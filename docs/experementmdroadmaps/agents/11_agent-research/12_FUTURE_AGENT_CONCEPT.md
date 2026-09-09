# 12 — FUTURE AGENT CONCEPT (realized from EXISTING capabilities)

**Premise:** This is NOT a new agent or new service. It is the _concept_ of what `agent-research` becomes when its already-existing capabilities are connected.

## Concept: "The Cited Synthesis Analyst"

A topology node that, by configuration alone, behaves as the system's evidence-and-citation authority — without any new runtime framework.

### Capabilities it already has (verified)

- Curated research identity + pinned model (`agent-profiles.ts:122-131`, applied at `topology-defaults.ts:104-105`).
- `SEARCH_TOOLS` declared (`topology-defaults.ts:10,276`).
- Debate/conversation/invocation participation (03/04/05/06).
- Generic journal + stats (08).
- Resolvable `specializations` + `lensIds` slots (agent-identity, agent-service:386).

### Capabilities added by _wiring_ (no new framework)

1. **Lens-augmented turns** — bind `lens:critical` + `lens:meta-uncertainty` (Q1). The node now reasons with explicit critical/uncertainty framing.
2. **Structured research objectives** — `LITERATURE_REVIEW` / `CITED_SYNTHESIS` objective types (M1) make its outputs parseable (citation list, evidence table).
3. **Continuity** — auto-loaded journal (Q4) + crystallized past syntheses (B3) give it memory.
4. **Knowledge loop** — post-debate synthesis → Crystal Vault (M2); generator integration (B1).
5. **Discovery** — expertise-match suggestion (M3) surfaces it to humans at the right moment.

### What it is NOT

- Not an autonomous crawler. Not a new RAG service. Not a separate "research subsystem." It remains a topology node whose behavior is assembled from `AgentService` + `LensEngine` + `CrystalVault` + `Director` + `Invocation` — all existing.

### Success metric

When invoked on "summarize the evidence on X with citations," the node returns a structured, lens-augmented, citation-bearing synthesis that is (a) journaled, (b) crystallized to Crystal Vault, and (c) re-loadable in its next invocation. Every piece of that pipeline exists today; only the connections are missing.
