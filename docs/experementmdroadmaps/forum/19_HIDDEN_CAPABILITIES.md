# 19_HIDDEN_CAPABILITIES.md

## Hidden Forum Capabilities

The Forum backend contains robust features that are largely unused or inaccessible in the current UI implementation.

| ID    | Capability                | Evidence (File:Line)   | Current Exposure          | Why Hidden                | Potential UX              | Effort | Risk |
| ----- | ------------------------- | ---------------------- | ------------------------- | ------------------------- | ------------------------- | ------ | ---- |
| FC-01 | Threading (parentId)      | `forum-service.ts:363` | None (UI shows flat list) | UI lacks recursion logic  | Nested reply view         | Medium | Low  |
| FC-02 | Agent Provenance Tracking | `forum-service.ts:121` | None                      | UI lacks author metadata  | Provenance badge/tooltips | Low    | Low  |
| FC-03 | Topic Tags                | `forum-service.ts:71`  | Minimal (input)           | UI lacks tag filter/view  | Tag filtering UI          | Medium | Low  |
| FC-04 | Pinning                   | `forum-service.ts:241` | None                      | UI missing action         | Pinned topic indicator    | Low    | Low  |
| FC-05 | Moderation Action Audit   | `forum-service.ts:255` | Static UI                 | Backend stores reason     | Moderation log            | Medium | Low  |
| FC-06 | Flood Control             | `forum-service.ts:108` | Error on failure          | UI fails silently/obscure | Post rate limiter UI      | Medium | Low  |
| FC-07 | Topic Status Management   | `forum-service.ts:73`  | None (all 'open')         | UI lacks status controls  | Close/Archive toggle      | Low    | Low  |
| FC-08 | Consensus Heuristic       | `forum-service.ts:262` | Computed, not rendered    | UI computed but hidden    | Consensus status badge    | Low    | Low  |
| FC-09 | Token/Cost Tracking       | `forum-service.ts:127` | None                      | No UI for cost reporting  | Cost reporting dashboard  | Medium | Low  |
| FC-10 | Subscription Records      | `forum-service.ts:201` | None                      | No subscription UI        | Subscription management   | Medium | Low  |
| FC-11 | Markdown Rendering        | `forum-service.ts:325` | Minimal support           | UI lacks parser preview   | Full MD toolbar           | Low    | Low  |
