# 03_PROTOTYPE_DESIGN.md

## Proposed UI for Cost Transparency

### 1. Inline Cost Display (RoomPanel/Director)

In the invocation list, display an estimated cost badge immediately upon execution start.

- **Visuals:**
  - `[ $0.02 ]` (Pending/Estimated)
  - `[ $0.05 ]` (Finalized)
- **Interaction:** Hovering reveals a breakdown (Input Tokens, Output Tokens, Provider Name).

### 2. Agent-Activity Cost Breakdown

In the `KnowledgeGenPanel` or `DirectorPanel`, provide a view that aggregates costs by Agent.

- **Mockup Concept:**
  - `Agent Name` | `Total Spend` | `InvCount` | `Avg Cost/Inv`
  - `System Architect` | `$12.40` | `45` | `$0.27`
  - `Skeptic Agent` | `$2.10` | `12` | `$0.17`

### 3. Per-Invocation Audit Log

A detailed view accessible from the `Invocation` details pane.

- **Fields:**
  - `Start Time` / `Duration`
  - `Model Used` / `Provider`
  - `Total Tokens` (Breakdown: Input vs Output)
  - `Cost Calculation` (e.g., `(in * cost) + (out * cost)`)
  - `Total Final Cost`
