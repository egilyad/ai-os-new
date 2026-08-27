# 14_ALTERNATIVE_ROADMAP — Second philosophy: "Lightweight Prompt-Specialist, not Tool-Bound"

Whereas `13_ROADMAP` invests in real SQL execution + memory + routing, this philosophy argues the agent should **stay a pure prompt-specialist** and win through **cheaper, faster, broader** coverage rather than deep tooling.

## Philosophy

The 25 agents are a _workforce persona layer_. Making one agent tool-heavy breaks symmetry and raises maintenance cost. Instead, maximize the **prompt + routing + synthesis** leverage already in the system: better personas, better routing, better cross-agent synthesis — no new runtime.

## Phases (opposite emphasis)

- **A0 — Persona + routing only.** Add `data_engineer` persona (QW-3) and specialization-aware router scoring (B-2) — but **no** `sql_executor`. Rely on the LLM's inherent SQL knowledge. _Effort S/M, Risk low._
- **A1 — Synthesis magnification.** When Priya + architect + devops disagree on a data architecture, let the **Synthesis Engine** (Module 4) + **Crystal Vault** (Module 2) fuse their outputs into a single recommended design, rather than giving Priya execution. _Reuse existing modules._
- **A2 — Template library.** Ship curated "DB review" / "migration plan" prompt templates (reuse `AgentWizard`/templates) so invocations are high-quality by construction, no sandbox needed.
- **A3 — Cross-agent memory, not agent memory.** Improve the _shared_ mesh retrieval for DB topics rather than a per-agent partition.

## Trade-offs vs Roadmap A (13_ROADMAP)

| Axis             | Roadmap A (13)               | Alt (14)          |
| ---------------- | ---------------------------- | ----------------- |
| Depth of DB help | Verifiable (runs SQL)        | Advisory only     |
| New runtime      | sql.js sandbox + memory tags | none              |
| Maintenance      | higher (tool/sandbox upkeep) | low (prompt-only) |
| Differentiation  | unique, defensible           | generic LLM SQL   |
| Risk             | medium (security/sandbox)    | low               |
| Time-to-value    | longer                       | faster            |

## Recommendation (OPINION)

Hybrid: adopt Alt's **A0/A1/A2 immediately** (cheap, high ROI) and pursue Roadmap A's **Phase 1 (real tool)** only if telemetry shows users repeatedly hit the "can't run it" wall. The tool is the differentiator but also the heaviest bet — sequence it after the free wins.
