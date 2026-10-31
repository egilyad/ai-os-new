# ÐšÐ°Ñ€Ñ‚Ð° Ð½Ð°Ð±Ð»ÑŽÐ´Ð°ÐµÐ¼Ð¾ÑÑ‚Ð¸ Ð¸ Ð´Ð¸Ð°Ð³Ð½Ð¾ÑÑ‚Ð¸ÐºÐ¸ â€” Observability & Diagnostics Map
## SuperAgents OS (`egilyad/ai-os-new`)

> **Ð’ÐµÑ€ÑÐ¸Ñ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð°:** commit `e08ab8e` (Oct 31, 2026, Ð²ÐµÑ‚ÐºÐ° `main`)
> **Ð”Ð°Ñ‚Ð° Ð°Ð½Ð°Ð»Ð¸Ð·Ð°:** 2026-10-31
> **ÐœÐµÑ‚Ð¾Ð´:** ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð°Ð½Ð°Ð»Ð¸Ð· observability-Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ (HealthPanel, TracesPanel, LogsPanel, ServiceRegistryPanel, StateInspectorPanel, etc.), bootstrap phase visibility, error events, AgentJournal, cross-nav Ð¸Ð· diagnostic panels, Ð¿Ð¾Ð¸ÑÐº UI exposure Ð´Ð»Ñ MemoryWatchdog/DLQ/CircuitBreaker/EventRegistry
> **ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ñ‹:** 13 Ð¿Ñ€ÐµÐ´Ñ‹Ð´ÑƒÑ‰Ð¸Ñ… ÐºÐ°Ñ€Ñ‚
> **Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚:** **18 observability Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹** (Ð±Ð¾Ð³Ð°Ñ‚Ð°Ñ Ð¸Ð½Ñ„Ñ€Ð°ÑÑ‚Ñ€ÑƒÐºÑ‚ÑƒÑ€Ð°), **ÐÐž 6 ÐºÐ»ÑŽÑ‡ÐµÐ²Ñ‹Ñ… diagnostics Ð±ÐµÐ· UI exposure**, **0 cross-nav Ð¸Ð· diagnostic panels Ðº source**, Ð¸ **Ð½ÐµÑ‚ unified Â«Ð¾Ð±ÑŠÑÑÐ½Ð¸ ÑÐ²Ð¾Ñ‘ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸ÐµÂ» dashboard**.

---

## 1. Ð˜ÑÐ¿Ð¾Ð»Ð½Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾Ðµ Ñ€ÐµÐ·ÑŽÐ¼Ðµ

SuperAgents OS Ð¸Ð¼ÐµÐµÑ‚ **Ð±Ð¾Ð³Ð°Ñ‚ÑƒÑŽ observability-Ð¸Ð½Ñ„Ñ€Ð°ÑÑ‚Ñ€ÑƒÐºÑ‚ÑƒÑ€Ñƒ**: 18+ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð´Ð»Ñ monitoring/tracing/debugging. Bootstrap Ð¸Ð¼ÐµÐµÑ‚ ÑÐ²Ð½Ñ‹Ð¹ state machine (`pending â†’ kernel â†’ services â†’ topology â†’ ready/degraded/failed`), `LifecycleManager.getStatuses()` Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‰Ð°ÐµÑ‚ `InitStatus[]`, `ErrorBoundary` Ð»Ð¾Ð²Ð¸Ñ‚ errors Ð½Ð° 3 ÑƒÑ€Ð¾Ð²Ð½ÑÑ… (panel + app + global), `EVENTS.NOTIFICATION` Ð¸Ð¼ÐµÐµÑ‚ **195 references** â€” Ð³Ð»Ð°Ð²Ð½Ð°Ñ error-notification ÑÐ¸ÑÑ‚ÐµÐ¼Ð°.

**ÐÐž:**
- **0 cross-panel navigation Ð¸Ð· diagnostic panels** (Integration Map Â§3.5) â€” Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð²Ð¸Ð´Ð¸Ñ‚ ÑÐ¸Ð¼Ð¿Ñ‚Ð¾Ð¼Ñ‹, Ð½Ð¾ Ð½Ðµ Ð¼Ð¾Ð¶ÐµÑ‚ Ð¿ÐµÑ€ÐµÐ¹Ñ‚Ð¸ Ðº source
- **6 ÐºÐ»ÑŽÑ‡ÐµÐ²Ñ‹Ñ… diagnostics Ð±ÐµÐ· UI exposure**: MemoryWatchdog (heap Ð² Ð»Ð¾Ð³Ð°Ñ…), DeadLetterQueue (service Ð±ÐµÐ· UI), CircuitBreaker state (no UI), Bootstrap report (no UI), Event registry (198 schemas, no UI), Subscription stats (method exists, no UI)
- **ÐÐµÑ‚ unified Â«Ð¾Ð±ÑŠÑÑÐ½Ð¸ ÑÐ²Ð¾Ñ‘ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸ÐµÂ» dashboard** â€” Ð´Ð°Ð½Ð½Ñ‹Ðµ Ñ€Ð°Ð·Ð±Ñ€Ð¾ÑÐ°Ð½Ñ‹ Ð¿Ð¾ 18 Ð¿Ð°Ð½ÐµÐ»ÑÐ¼
- **HealthSlaPanel = `@deprecated MOCK`** â€” visible Ð² nav, Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ simulated SLA

**Ð¡Ð²Ð¾Ð´Ð½Ñ‹Ðµ Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ observability:**

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | ÐžÑ†ÐµÐ½ÐºÐ° |
|---|---:|---|
| Observability Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ | **18+** | ðŸŸ¢ Ð¼Ð½Ð¾Ð³Ð¾ |
| HealthPanel ÑÐµÐºÑ†Ð¸Ð¹ | 6 (KernelServices, DistributedNodes, ProbeResults, HealthScore, HealthTimeline, RateLimitIntrospection) | ðŸŸ¢ rich |
| TracesPanel sub-components | 6 (CognitiveMicroscope, DecisionGraph, MicroscopeTimeline, StepAnalysis, TopologyTraceView, TraceDebugger) | ðŸŸ¢ rich |
| Bootstrap phases visible | 6 (pending/kernel/services/topology/ready/degraded/failed) | ðŸŸ¢ Ð½Ð¾ **Ð½ÐµÑ‚ UI** |
| LifecycleManager.getStatuses() | âœ… method exists | ðŸŸ¢ Ð½Ð¾ **Ð½ÐµÑ‚ UI** |
| ErrorBoundary ÑƒÑ€Ð¾Ð²Ð½ÐµÐ¹ | 3 (panel + app + global handlers) | ðŸŸ¢ðŸŸ¢ excellent |
| EVENTS.NOTIFICATION references | **195** | ðŸŸ¢ pervasive |
| EVENTS.ERROR_BOUNDARY_CAUGHT | 6 refs | ðŸŸ¢ wired |
| AlertLayer (notification UI) | 341 ÑÑ‚Ñ€Ð¾Ðº | ðŸŸ¢ |
| AgentJournalPanel (execution trail) | âœ… exists | ðŸŸ¢ |
| ServiceRegistryPanel | 421 ÑÑ‚Ñ€Ð¾ÐºÐ° + 5 sub-ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð² | ðŸŸ¢ rich |
| **Cross-nav Ð¸Ð· diagnostic panels** | **0** | ðŸ”´ NONE |
| MemoryWatchdog UI | âŒ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² Ð»Ð¾Ð³Ð°Ñ… | ðŸ”´ |
| DeadLetterQueue UI | âŒ service Ð±ÐµÐ· UI | ðŸ”´ |
| CircuitBreaker state UI | âŒ no UI | ðŸ”´ |
| Bootstrap report UI | âŒ no UI | ðŸ”´ |
| Event registry UI (198 schemas) | âŒ no UI | ðŸ”´ |
| Subscription stats UI | âŒ method Ð±ÐµÐ· UI | ðŸ”´ |
| Unified Â«explain stateÂ» dashboard | âŒ Ð½ÐµÑ‚ | ðŸ”´ |

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ ÑÐ¸Ð»ÑŒÐ½Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹:**
- **18 observability Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹** â€” Ð±Ð¾Ð³Ð°Ñ‚Ñ‹Ð¹ Ð²Ñ‹Ð±Ð¾Ñ€
- **3-ÑƒÑ€Ð¾Ð²Ð½ÐµÐ²Ð°Ñ error recovery** (ErrorBoundary + GlobalErrorBoundary + global handlers)
- **195 EVENTS.NOTIFICATION refs** â€” pervasive error notification
- **ServiceRegistryPanel** (421 ÑÑ‚Ñ€Ð¾ÐºÐ°) â€” rich service browser Ñ statuses + detail panel
- **TracesPanel** â€” 6 sub-components Ð²ÐºÐ»ÑŽÑ‡Ð°Ñ CognitiveMicroscope Ð¸ DecisionGraph
- **Bootstrap state machine** â€” ÑÐ²Ð½Ñ‹Ð¹ phase tracking

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ ÑÐ»Ð°Ð±Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹:**
- **0 cross-nav Ð¸Ð· diagnostic panels Ðº source** â€” Ð³Ð»Ð°Ð²Ð½Ñ‹Ð¹ observability gap
- **6 ÐºÐ»ÑŽÑ‡ÐµÐ²Ñ‹Ñ… diagnostics Ð±ÐµÐ· UI exposure** (MemoryWatchdog, DLQ, CircuitBreaker, Bootstrap report, Event registry, Subscription stats)
- **ÐÐµÑ‚ unified dashboard** â€” Ð´Ð°Ð½Ð½Ñ‹Ðµ Ñ€Ð°Ð·Ð±Ñ€Ð¾ÑÐ°Ð½Ñ‹
- **HealthSlaPanel = MOCK** visible Ð² nav
- **Diagnostic panels Ð¸Ð·Ð¾Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ñ‹** â€” TracesPanel/HealthPanel/LogsPanel Ð½Ðµ ÑÐ²ÑÐ·Ð°Ð½Ñ‹

**Observability Score: 6.0/10** â€” Ð±Ð¾Ð³Ð°Ñ‚Ð°Ñ Ð¸Ð½Ñ„Ñ€Ð°ÑÑ‚Ñ€ÑƒÐºÑ‚ÑƒÑ€Ð°, Ð½Ð¾ fragmented Ð¸ Ð±ÐµÐ· unified Â«explain stateÂ».

---

## 2. ÐœÐµÑ‚Ð¾Ð´Ð¾Ð»Ð¾Ð³Ð¸Ñ: 6 Ð²Ð¾Ð¿Ñ€Ð¾ÑÐ¾Ð²

| # | Ð’Ð¾Ð¿Ñ€Ð¾Ñ | Ð§Ñ‚Ð¾ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÑÐµÐ¼ |
|---|---|---|
| 1 | ÐœÐ¾Ð¶Ð½Ð¾ Ð»Ð¸ ÑƒÐ²Ð¸Ð´ÐµÑ‚ÑŒ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ ÑÐµÑ€Ð²Ð¸ÑÐ°? | ServiceRegistryPanel, HealthPanel, KernelServicesSection |
| 2 | ÐŸÐ¾Ð½ÑÑ‚Ð½Ð¾ Ð»Ð¸, Ð¿Ð¾Ñ‡ÐµÐ¼Ñƒ Ð¿Ð°Ð½ÐµÐ»ÑŒ Ð½Ðµ Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÐµÑ‚? | ErrorBoundary, error events, UI feedback |
| 3 | Ð’Ð¸Ð´Ð½Ñ‹ Ð»Ð¸ Ð¾ÑˆÐ¸Ð±ÐºÐ¸ Ð¸Ð½Ð¸Ñ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¸? | Bootstrap phase, LifecycleManager.getStatuses(), UI exposure |
| 4 | ÐœÐ¾Ð¶Ð½Ð¾ Ð»Ð¸ Ð¾Ñ‚ÑÐ»ÐµÐ´Ð¸Ñ‚ÑŒ Ñ†ÐµÐ¿Ð¾Ñ‡ÐºÑƒ Ð²Ñ‹Ð¿Ð¾Ð»Ð½ÐµÐ½Ð¸Ñ? | TracesPanel, AgentJournalPanel, RouterTraceView |
| 5 | Ð’Ð¸Ð´Ð½Ñ‹ Ð»Ð¸ Ð°ÐºÑ‚Ð¸Ð²Ð½Ñ‹Ðµ Ð°Ð³ÐµÐ½Ñ‚Ñ‹ Ð¸ Ð·Ð°Ð´Ð°Ñ‡Ð¸? | AgentsPanel, TasksPanel, MissionControl |
| 6 | ÐœÐ¾Ð¶Ð½Ð¾ Ð»Ð¸ Ð¾Ð¿Ñ€ÐµÐ´ÐµÐ»Ð¸Ñ‚ÑŒ Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ñ‹? | Cross-nav Ð¸Ð· diagnostics, source identification |

**ÐŸÑ€Ð¸Ð½Ñ†Ð¸Ð¿:** Â«ÐÐ°ÑÐºÐ¾Ð»ÑŒÐºÐ¾ ÑÐ°Ð¼Ð° ÐžÐ¡ ÑÐ¿Ð¾ÑÐ¾Ð±Ð½Ð° Ð¾Ð±ÑŠÑÑÐ½Ð¸Ñ‚ÑŒ ÑÐ²Ð¾Ñ‘ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸ÐµÂ» â€” focus Ð½Ð° **self-explanation capability**.

---

## 3. 18 Observability Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ â€” inventory

### 3.1. Health-Ð´Ð¾Ð¼ÐµÐ½ (4 Ð¿Ð°Ð½ÐµÐ»Ð¸)

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð¡Ñ‚Ñ€Ð¾Ðº | Ð§Ñ‚Ð¾ Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ |
|---|---:|---|
| `HealthPanel` | 530 | Vitals (CPU/memory/throughput), KernelServices, DistributedNodes, ProbeResults, HealthScore, HealthTimeline, RateLimitIntrospection |
| `SystemHealthPanel` | 219 | Ð¡Ð¸ÑÑ‚ÐµÐ¼Ð½Ð¾Ðµ Ð·Ð´Ð¾Ñ€Ð¾Ð²ÑŒÐµ (overlap Ñ HealthPanel) |
| `DocsHealthPanel` | 218 | Documentation health (links, sources, completeness) |
| `HealthSlaPanel` | 441 | ðŸ”´ **`@deprecated MOCK`** â€” simulated SLA |

**HealthPanel ÑÐµÐºÑ†Ð¸Ð¸ (6):**
1. `KernelServicesSection` â€” ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ kernel ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²
2. `DistributedNodesSection` â€” distributed nodes (keys + bees)
3. `ProbeResultsSection` â€” active probe results
4. `HealthScoreSection` â€” composite health score
5. `HealthTimelineSection` â€” timeline of health events
6. `RateLimitIntrospection` â€” rate limit status

### 3.2. Traces-Ð´Ð¾Ð¼ÐµÐ½ (Ð±Ð¾Ð³Ð°Ñ‚Ñ‹Ð¹)

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð¡Ñ‚Ñ€Ð¾Ðº | Ð§Ñ‚Ð¾ Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ |
|---|---:|---|
| `TracesPanel` | 743 | 6 sub-components: CognitiveMicroscope, DecisionGraph, MicroscopeTimeline, StepAnalysisPanel, TopologyTraceView, TraceDebugger |
| `RouterTraceView` | â€” | Routing decisions trace |
| `AgentJournalPanel` | 383 (3 sub) | Execution trail Â«Ð¶ÑƒÑ€Ð½Ð°Ð» ÑÑƒÐ¿ÐµÑ€Ð²Ð°Ð¹Ð·ÐµÑ€Ð¾Ð²Â» |
| `DecisionLogPanel` | 312 | Decision history + export (JSON) |
| `AuditLogView` | 376 | Audit log + export (JSON + CSV) |

### 3.3. Logs & State

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð¡Ñ‚Ñ€Ð¾Ðº | Ð§Ñ‚Ð¾ Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ |
|---|---:|---|
| `LogsPanel` | 520 | Log browser Ñ filters |
| `StateInspectorPanel` | 301 (3 sub) | Tree view state + StatBox |
| `DiagnosticPanel` | 565 | General diagnostics |
| `PerformanceProfilerPanel` | 265 | Performance profiling |
| `PressureMapPanel` | 384 (5 sub) | Pressure map + alerts + gauge + trend |
| `CustomMetricsPanel` | â€” | Custom metrics |
| `TopologyGalleryPanel` | â€” | Topology visualization |

### 3.4. Service Registry

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð¡Ñ‚Ñ€Ð¾Ðº | Ð§Ñ‚Ð¾ Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ |
|---|---:|---|
| `ServiceRegistryPanel` | 421 (5 sub) | Service list + statuses (phase/uptime/servicesReady/servicesTotal) + detail panel + unmapped panel + status bar |
| `AlertLayer` | 341 | Notification display (overlay) |

**ServiceRegistryPanel Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚Ð¸:**
- Search services
- Filter by tab
- Status: `phase`, `uptime`, `servicesReady`, `servicesTotal`
- Detail panel per service
- Unmapped services panel
- Export decisions

---

## 4. ÐÐ½Ð°Ð»Ð¸Ð· Ð¿Ð¾ 6 Ð²Ð¾Ð¿Ñ€Ð¾ÑÐ°Ð¼

### 4.1. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 1: ÐœÐ¾Ð¶Ð½Ð¾ Ð»Ð¸ ÑƒÐ²Ð¸Ð´ÐµÑ‚ÑŒ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ ÑÐµÑ€Ð²Ð¸ÑÐ°?

**âœ… Ð”Ð â€” Ñ‡Ð°ÑÑ‚Ð¸Ñ‡Ð½Ð¾.**

**ServiceRegistryPanel** (421 ÑÑ‚Ñ€Ð¾ÐºÐ°):
- `status: { phase, uptime, servicesReady, servicesTotal }` â€” visible
- Service list Ñ search + filter
- Detail panel per service
- Unmapped services panel

**HealthPanel.KernelServicesSection:**
- Ð¡Ð¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ kernel ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²
- Vitals (CPU/memory/throughput/tokens)

**ÐÐž:**
- **15+ background timers** (Resource Map Â§4) â€” **Ð½ÐµÑ‚ UI** Ð´Ð»Ñ Â«Ð²ÑÐµ Ð°ÐºÑ‚Ð¸Ð²Ð½Ñ‹Ðµ timersÂ»
- **CircuitBreaker state** â€” Ð½ÐµÑ‚ UI
- **MemoryWatchdog** â€” heap Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² Ð»Ð¾Ð³Ð°Ñ…
- **Subscription stats** â€” `eventBus.getSubscriptionStats()` ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚, Ð½Ð¾ Ð½ÐµÑ‚ UI

**Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚:** ðŸŸ¡ **6/10** â€” service state Ð²Ð¸Ð´ÐµÐ½ Ð² ServiceRegistryPanel, Ð½Ð¾ 4 ÐºÐ»ÑŽÑ‡ÐµÐ²Ñ‹Ñ… runtime states Ð±ÐµÐ· UI.

### 4.2. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 2: ÐŸÐ¾Ð½ÑÑ‚Ð½Ð¾ Ð»Ð¸, Ð¿Ð¾Ñ‡ÐµÐ¼Ñƒ Ð¿Ð°Ð½ÐµÐ»ÑŒ Ð½Ðµ Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÐµÑ‚?

**âœ… Ð”Ð â€” Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾.**

**3-ÑƒÑ€Ð¾Ð²Ð½ÐµÐ²Ð°Ñ error recovery** (ÑÐ¼. Lifecycle Map Â§13):
1. **Panel-level ErrorBoundary** â€” Ð»Ð¾Ð²Ð¸Ñ‚ React render errors, Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ error UI + Reload button, emits `EVENTS.ERROR_BOUNDARY_CAUGHT` + `EVENTS.NOTIFICATION`
2. **App-level GlobalErrorBoundary** â€” fallback Ð½Ð° `window.location.reload()`
3. **Global handlers** (main.tsx) â€” `unhandledrejection` + `error` (EH6-04)

**EVIDENCE:**
- `EVENTS.NOTIFICATION` â€” **195 references** â€” pervasive notification mechanism
- `EVENTS.ERROR_BOUNDARY_CAUGHT` â€” 6 refs â€” wired
- AlertLayer (341 ÑÑ‚Ñ€Ð¾ÐºÐ°) â€” notification display overlay
- ErrorBoundary Ð¸Ð¼ÐµÐµÑ‚ `variant: 'panel' | 'page'` + Reset button

**Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚:** ðŸŸ¢ **8/10** â€” Ð¾ÑˆÐ¸Ð±ÐºÐ¸ Ð²Ð¸Ð´Ð½Ñ‹, ÐµÑÑ‚ÑŒ reload, notifications pervasive.

### 4.3. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 3: Ð’Ð¸Ð´Ð½Ñ‹ Ð»Ð¸ Ð¾ÑˆÐ¸Ð±ÐºÐ¸ Ð¸Ð½Ð¸Ñ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¸?

**ðŸŸ¡ Ð§ÐÐ¡Ð¢Ð˜Ð§ÐÐž.**

**Backend (ÐµÑÑ‚ÑŒ):**
- `Bootstrap.phase` state machine: `pending â†’ kernel â†’ services â†’ topology â†’ ready/degraded/failed`
- `Bootstrap.getPhase(): InitPhase` â€” method exists
- `LifecycleManager.getStatuses(): InitStatus[]` â€” returns `{name, status: 'ok'|'error'|'skipped', error?}[]`
- `LifecycleManager.tryInit` â€” 3 retries Ñ exponential backoff, log on failure
- `CRITICAL_SERVICES` check â€” aborts if critical fails
- `phase = 'degraded'` â€” app continues on partial failure

**UI (ÐÐ•Ð¢):**
- **Bootstrap report UI** â€” Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾
- **LifecycleManager.getStatuses() Ð² UI** â€” Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾
- **Phase visibility Ð´Ð»Ñ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»Ñ** â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ `runtimeStatus: 'online'|'degraded'|'offline'` Ð² Sidebar (3-state)

**Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚:** ðŸŸ¡ **5/10** â€” backend tracking Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ñ‹Ð¹, Ð½Ð¾ UI Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 3-state summary, Ð½Ðµ Ð´ÐµÑ‚Ð°Ð»ÑŒÐ½Ñ‹Ð¹ init report.

### 4.4. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 4: ÐœÐ¾Ð¶Ð½Ð¾ Ð»Ð¸ Ð¾Ñ‚ÑÐ»ÐµÐ´Ð¸Ñ‚ÑŒ Ñ†ÐµÐ¿Ð¾Ñ‡ÐºÑƒ Ð²Ñ‹Ð¿Ð¾Ð»Ð½ÐµÐ½Ð¸Ñ?

**âœ… Ð”Ð â€” Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ð¾.**

**TracesPanel** (743 ÑÑ‚Ñ€Ð¾ÐºÐ¸) â€” 6 sub-components:
1. `CognitiveMicroscope` â€” cognitive trace inspection
2. `DecisionGraph` â€” decision graph visualization
3. `MicroscopeTimeline` â€” timeline view
4. `StepAnalysisPanel` â€” per-step analysis
5. `TopologyTraceView` â€” topology trace
6. `TraceDebugger` â€” interactive debugging

**AgentJournalPanel** â€” Â«Ð¶ÑƒÑ€Ð½Ð°Ð» ÑÑƒÐ¿ÐµÑ€Ð²Ð°Ð¹Ð·ÐµÑ€Ð¾Ð²Â» execution trail Ñ JournalEntryCard + StatMini + filter by agent.

**RouterTraceView** â€” routing decisions trace.

**DecisionLogPanel** (312) â€” decision history + export.

**AuditLogView** (376) â€” audit log + export (JSON + CSV).

**EVIDENCE:** `cognitiveService.getTraces()` Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ Ð² TracesPanel âœ…

**Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚:** ðŸŸ¢ðŸŸ¢ **9/10** â€” Ð±Ð¾Ð³Ð°Ñ‚Ð°Ñ trace infrastructure, 6 sub-components Ð² TracesPanel.

### 4.5. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 5: Ð’Ð¸Ð´Ð½Ñ‹ Ð»Ð¸ Ð°ÐºÑ‚Ð¸Ð²Ð½Ñ‹Ðµ Ð°Ð³ÐµÐ½Ñ‚Ñ‹ Ð¸ Ð·Ð°Ð´Ð°Ñ‡Ð¸?

**âœ… Ð”Ð â€” Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾.**

**TasksPanel** (903 ÑÑ‚Ñ€Ð¾ÐºÐ¸):
- Kanban (5 ÐºÐ¾Ð»Ð¾Ð½Ð¾Ðº: pending/running/completed/failed + AGEMS)
- Stats (active/queued/completed/exceptions)
- Filter (all/running/completed/failed)
- AGEMS tasks separate
- Pipeline execution view

**AgentsPanel** (30 ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð²):
- AgentStatsDashboard, LiveActivityStream, EloLeaderboard
- AgentHistoryTab, AgentIdentityEditor, AgentCapabilitiesTab, AgentConfigTab
- AgentDetailPanel, AgentGroupsSection, AgentHandoffsTab, AgentInfraTab
- AgentObservabilityTab, AgentPolicySection, AgentProfileTab
- AgentsTable, AgentsPanelContainer, AgentsPanelView, AgentsPanelContext
- QuickCreateAgentModal, agent-templates, sidebar-tabs

**MissionControl** (LiveCognition) â€” live workspace Ñ ControlActions, EventLog, LiveStatCard.

**ÐÐž:**
- **ÐÐµÑ‚ unified Â«all agents current stateÂ» overview** (Capability Gap Map Â§6.1)
- 30 ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð² Ð² AgentsPanel â€” fragmented

**Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚:** ðŸŸ¢ **7/10** â€” Ð°ÐºÑ‚Ð¸Ð²Ð½Ñ‹Ðµ tasks Ð¸ agents Ð²Ð¸Ð´Ð½Ñ‹, Ð½Ð¾ Ð½ÐµÑ‚ unified single view.

### 4.6. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 6: ÐœÐ¾Ð¶Ð½Ð¾ Ð»Ð¸ Ð¾Ð¿Ñ€ÐµÐ´ÐµÐ»Ð¸Ñ‚ÑŒ Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ñ‹?

**ðŸ”´ ÐÐ•Ð¢ â€” Ð³Ð»Ð°Ð²Ð½Ñ‹Ð¹ observability gap.**

**0 cross-panel navigate() Ð² diagnostic panels** (Integration Map Â§3.5):

| Diagnostic panel | Cross-nav calls |
|---|---:|
| LogsPanel | **0** |
| TracesPanel | **0** |
| HealthPanel | **0** |
| StateInspectorPanel | **0** |
| DiagnosticPanel | (probably 0) |

**ÐŸÑ€Ð¸Ð¼ÐµÑ€ missing links:**
- HealthPanel (red provider) â†’ ProviderManager â€” **ÐÐ•Ð¢**
- TracesPanel (trace agent X) â†’ AgentsPanel â€” **ÐÐ•Ð¢**
- LogsPanel (error from service Y) â†’ ServiceRegistryPanel â€” **ÐÐ•Ð¢**
- StateInspectorPanel (state issue) â†’ relevant panel â€” **ÐÐ•Ð¢**
- DecisionLogPanel (decision based on crystal Y) â†’ CrystalVaultPanel â€” **ÐÐ•Ð¢**
- AuditLogView (audit event) â†’ source â€” **ÐÐ•Ð¢**

**Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚:** ðŸ”´ **2/10** â€” diagnostic panels Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÑŽÑ‚ ÑÐ¸Ð¼Ð¿Ñ‚Ð¾Ð¼Ñ‹, Ð½Ð¾ **Ð½Ðµ Ð²ÐµÐ´ÑƒÑ‚ Ðº source**. ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð´Ð¾Ð»Ð¶ÐµÐ½ ÑÐ°Ð¼ Ð¿ÐµÑ€ÐµÐºÐ»ÑŽÑ‡Ð¸Ñ‚ÑŒÑÑ.

---

## 5. ðŸ”´ 6 ÐºÐ»ÑŽÑ‡ÐµÐ²Ñ‹Ñ… diagnostics Ð±ÐµÐ· UI exposure

### 5.1. MemoryWatchdog â€” heap Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² Ð»Ð¾Ð³Ð°Ñ…

**Backend:** `src/kernel/utils/memory-watchdog.ts` â€” Ð»Ð¾Ð³Ð¸Ñ€ÑƒÐµÑ‚ heap ÐºÐ°Ð¶Ð´Ñ‹Ðµ 5s, warns Ð¿Ñ€Ð¸ growth > 100 MB Ð¸Ð»Ð¸ absolute > 200 MB.

**UI:** âŒ **ÐÐ•Ð¢** â€” Ð´Ð°Ð½Ð½Ñ‹Ðµ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² logger.

**Gap:** Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ Ð²Ð¸Ð´Ð¸Ñ‚ heap pressure Ð² UI.

### 5.2. DeadLetterQueue â€” service Ð±ÐµÐ· UI

**Backend:** `event-bus-deadletter.test.ts` ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚ (DLQ Ð´Ð»Ñ failed events).

**UI:** âŒ **ÐÐ•Ð¢** â€” DLQ Ð½Ðµ visible.

**Gap:** failed events ÐºÐ¾Ð¿ÑÑ‚ÑÑ Ð² DLQ Ð±ÐµÐ· UI warning.

### 5.3. CircuitBreaker state â€” no UI

**Backend:** `circuit-breaker.test.ts` Ð² stable gate, decorators Ð½Ð° LLM adapters.

**UI:** âŒ **ÐÐ•Ð¢** â€” circuit breaker state Ð½Ðµ visible.

**Gap:** ÐµÑÐ»Ð¸ circuit breaker open Ð´Ð»Ñ Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð° â€” Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ Ð·Ð½Ð°ÐµÑ‚.

### 5.4. Bootstrap report â€” no UI

**Backend:** `Bootstrap.getPhase()`, `LifecycleManager.getStatuses()`, `InitStatus[]`.

**UI:** âŒ **ÐÐ•Ð¢** â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ `runtimeStatus: online/degraded/offline` Ð² Sidebar.

**Gap:** ÐµÑÐ»Ð¸ init ÑƒÐ¿Ð°Ð» Ð½Ð° service X â€” user Ð½Ðµ Ð·Ð½Ð°ÐµÑ‚ ÐºÐ°ÐºÐ¾Ð¹.

### 5.5. Event registry â€” 198 schemas, no UI

**Backend:** `event-registry.ts` (2 772 ÑÑ‚Ñ€Ð¾ÐºÐ¸, 198 event schemas).

**UI:** âŒ **ÐÐ•Ð¢** â€” Ð½ÐµÑ‚ panel Â«all eventsÂ».

**Gap:** Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ ÑƒÐ²Ð¸Ð´ÐµÑ‚ÑŒ Ð²ÑÐµ events Ð¸ ÐºÑ‚Ð¾ subscribe.

### 5.6. Subscription stats â€” method Ð±ÐµÐ· UI

**Backend:** `eventBus.getSubscriptionStats()` â€” Ð¼ÐµÑ‚Ð¾Ð´ ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚ (1 ref Ð² ÐºÐ¾Ð´Ðµ).

**UI:** âŒ **ÐÐ•Ð¢** â€” Ð½Ðµ Ð²Ñ‹Ð·Ñ‹Ð²Ð°ÐµÑ‚ÑÑ Ð¸Ð· UI.

**Gap:** Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ ÑƒÐ²Ð¸Ð´ÐµÑ‚ÑŒ active subscription count.

---

## 6. Cross-nav audit â€” Ð³Ð´Ðµ Ð½ÐµÑ‚ Â«Open in XÂ» links

| Ð˜Ð· diagnostic panel | Ðš source panel | Link? |
|---|---|---|
| HealthPanel (red provider) | ProviderManager | ðŸ”´ **ÐÐ•Ð¢** |
| HealthPanel (kernel service error) | ServiceRegistryPanel | ðŸ”´ **ÐÐ•Ð¢** |
| TracesPanel (trace agent X) | AgentsPanel | ðŸ”´ **ÐÐ•Ð¢** |
| TracesPanel (trace debate Y) | DebatePanel | ðŸ”´ **ÐÐ•Ð¢** |
| LogsPanel (error from service Y) | ServiceRegistryPanel | ðŸ”´ **ÐÐ•Ð¢** |
| StateInspectorPanel (state issue) | relevant panel | ðŸ”´ **ÐÐ•Ð¢** |
| DecisionLogPanel (decision based on crystal) | CrystalVaultPanel | ðŸ”´ **ÐÐ•Ð¢** |
| AuditLogView (audit event from panel X) | panel X | ðŸ”´ **ÐÐ•Ð¢** |
| PressureMapPanel (pressure on provider) | ProviderManager | ðŸ”´ **ÐÐ•Ð¢** |
| PerformanceProfilerPanel (slow service) | ServiceRegistryPanel | ðŸ”´ **ÐÐ•Ð¢** |
| AgentJournalPanel (entry from agent X) | AgentsPanel | ðŸ”´ **ÐÐ•Ð¢** |
| DiagnosticPanel (issue detected) | source panel | ðŸ”´ **ÐÐ•Ð¢** |

**12 missing cross-nav links** â€” ÑÑ‚Ð¾ **Ð³Ð»Ð°Ð²Ð½Ñ‹Ð¹ observability gap**.

---

## 7. Ð¡Ð²Ð¾Ð´Ð½Ð°Ñ Ð¼Ð°Ñ‚Ñ€Ð¸Ñ†Ð° observability Ð¿Ð¾ 6 Ð²Ð¾Ð¿Ñ€Ð¾ÑÐ°Ð¼

| Ð’Ð¾Ð¿Ñ€Ð¾Ñ | ÐžÑ†ÐµÐ½ÐºÐ° | ÐšÐ¾Ð¼Ð¼ÐµÐ½Ñ‚Ð°Ñ€Ð¸Ð¹ |
|---|:---:|---|
| 1. Ð¡Ð¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ ÑÐµÑ€Ð²Ð¸ÑÐ°? | ðŸŸ¡ 6/10 | ServiceRegistryPanel rich, Ð½Ð¾ 4 runtime states Ð±ÐµÐ· UI |
| 2. ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ Ð¿Ð°Ð½ÐµÐ»ÑŒ Ð½Ðµ Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÐµÑ‚? | ðŸŸ¢ 8/10 | 3-ÑƒÑ€Ð¾Ð²Ð½ÐµÐ²Ð°Ñ error recovery, 195 NOTIFICATION refs |
| 3. ÐžÑˆÐ¸Ð±ÐºÐ¸ Ð¸Ð½Ð¸Ñ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¸? | ðŸŸ¡ 5/10 | Backend Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ñ‹Ð¹, UI Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 3-state |
| 4. Ð¦ÐµÐ¿Ð¾Ñ‡ÐºÐ° Ð²Ñ‹Ð¿Ð¾Ð»Ð½ÐµÐ½Ð¸Ñ? | ðŸŸ¢ðŸŸ¢ 9/10 | TracesPanel 6 sub-components + AgentJournal |
| 5. ÐÐºÑ‚Ð¸Ð²Ð½Ñ‹Ðµ Ð°Ð³ÐµÐ½Ñ‚Ñ‹/Ð·Ð°Ð´Ð°Ñ‡Ð¸? | ðŸŸ¢ 7/10 | TasksPanel + AgentsPanel + MissionControl, Ð½Ð¾ fragmented |
| 6. Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ñ‹? | ðŸ”´ 2/10 | 0 cross-nav Ð¸Ð· diagnostics |
| **Overall Observability Score** | **6.0/10** | Ð‘Ð¾Ð³Ð°Ñ‚Ð°Ñ Ð¸Ð½Ñ„Ñ€Ð°ÑÑ‚Ñ€ÑƒÐºÑ‚ÑƒÑ€Ð°, fragmented, Ð±ÐµÐ· unified dashboard |

---

## 8. Â«ÐžÐ±ÑŠÑÑÐ½Ð¸ ÑÐ²Ð¾Ñ‘ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸ÐµÂ» â€” self-explanation capability audit

### 8.1. Ð§Ñ‚Ð¾ ÐžÐ¡ Ð¼Ð¾Ð¶ÐµÑ‚ Ð¾Ð±ÑŠÑÑÐ½Ð¸Ñ‚ÑŒ Ð¾ ÑÐµÐ±Ðµ

| Ð§Ñ‚Ð¾ | Backend | UI | Self-explanation? |
|---|---|---|---|
| Ð¢ÐµÐºÑƒÑ‰Ð°Ñ phase bootstrap | âœ… getPhase() | ðŸŸ¡ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ online/degraded/offline Ð² sidebar | ðŸŸ¡ partial |
| Service init status | âœ… getStatuses() | ðŸŸ¡ ServiceRegistryPanel Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚, Ð½Ð¾ Ð½Ðµ init errors | ðŸŸ¡ partial |
| Service dependencies | âœ… DI graph | âœ… ServiceRegistryPanel.DetailPanel | ðŸŸ¢ yes |
| Active traces | âœ… cognitiveService.getTraces() | âœ… TracesPanel 6 sub-components | ðŸŸ¢ yes |
| Active agents | âœ… agentService.getAgents() | âœ… AgentsPanel (30 components) | ðŸŸ¢ yes |
| Active tasks | âœ… cognitiveService + agemsTaskService | âœ… TasksPanel kanban | ðŸŸ¢ yes |
| Active debates | âœ… debateEngine.getAllSessions() | âœ… DebateArena + DebatesManagerPanel | ðŸŸ¢ yes |
| Health vitals | âœ… adminService.getSystemHealth() | âœ… HealthPanel 6 sections | ðŸŸ¢ yes |
| Probe results | âœ… probeService | âœ… ProbeResultsSection | ðŸŸ¢ yes |
| Rate limits | âœ… keyStateStore | âœ… RateLimitIntrospection | ðŸŸ¢ yes |
| Errors (React) | âœ… ErrorBoundary | âœ… error UI + reload | ðŸŸ¢ yes |
| Errors (async) | âœ… unhandledrejection handler | âœ… EVENTS.NOTIFICATION â†’ AlertLayer | ðŸŸ¢ yes |
| Errors (sync outside React) | âœ… global error handler (EH6-04) | âœ… EVENTS.NOTIFICATION | ðŸŸ¢ yes |
| Decisions made | âœ… decisionLogService | âœ… DecisionLogPanel | ðŸŸ¢ yes |
| Audit trail | âœ… auditLogService | âœ… AuditLogView | ðŸŸ¢ yes |
| Heap usage | âœ… MemoryWatchdog | ðŸ”´ **Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² Ð»Ð¾Ð³Ð°Ñ…** | ðŸ”´ NO |
| Failed events (DLQ) | âœ… deadLetterQueue | ðŸ”´ **Ð½ÐµÑ‚ UI** | ðŸ”´ NO |
| Circuit breaker state | âœ… circuitBreakerDecorator | ðŸ”´ **Ð½ÐµÑ‚ UI** | ðŸ”´ NO |
| Event registry | âœ… 198 schemas | ðŸ”´ **Ð½ÐµÑ‚ UI** | ðŸ”´ NO |
| Active subscriptions | âœ… getSubscriptionStats() | ðŸ”´ **Ð½ÐµÑ‚ UI** | ðŸ”´ NO |
| Background timers | âœ… 15+ setInterval | ðŸ”´ **Ð½ÐµÑ‚ UI** | ðŸ”´ NO |
| Bootstrap report | âœ… BootstrapReport type | ðŸ”´ **Ð½ÐµÑ‚ UI** | ðŸ”´ NO |

### 8.2. Self-explanation scorecard

| Capability | Score |
|---|:---:|
| Ð§Ñ‚Ð¾ Ð¿Ñ€Ð¾Ð¸ÑÑ…Ð¾Ð´Ð¸Ñ‚ ÑÐµÐ¹Ñ‡Ð°Ñ (state) | ðŸŸ¢ 8/10 |
| Ð§Ñ‚Ð¾ Ð´ÐµÐ»Ð°Ð»Ð¾ÑÑŒ (history/traces) | ðŸŸ¢ 9/10 |
| ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ ÑÐ»Ð¾Ð¼Ð°Ð»Ð¾ÑÑŒ (errors) | ðŸŸ¢ 8/10 |
| Ð“Ð´Ðµ Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ñ‹ (source ID) | ðŸ”´ 2/10 |
| Ð§Ñ‚Ð¾ Ð¿Ð¾Ð´ ÐºÐ°Ð¿Ð¾Ñ‚Ð¾Ð¼ (internals) | ðŸŸ¡ 5/10 (6 diagnostics Ð±ÐµÐ· UI) |
| **Overall self-explanation** | **6.0/10** |

---

## 9. Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ observability gaps

### 9.1. ðŸ”´ Cross-nav Ð¸Ð· diagnostic panels (critical)

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** 0 cross-panel navigation Ð¸Ð· 4 diagnostic panels. 12 missing links identified.

**Ð’Ð»Ð¸ÑÐ½Ð¸Ðµ:** Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð²Ð¸Ð´Ð¸Ñ‚ ÑÐ¸Ð¼Ð¿Ñ‚Ð¾Ð¼ (red provider, error log, failed trace), Ð½Ð¾ Ð´Ð¾Ð»Ð¶ÐµÐ½ **Ð²Ñ€ÑƒÑ‡Ð½ÑƒÑŽ** Ð½Ð°Ð¹Ñ‚Ð¸ source panel.

**Fix:** Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Â«Open in XÂ» buttons (ÑÐ¼. Opportunity Map 3.2, 3.6).

### 9.2. ðŸ”´ 6 diagnostics Ð±ÐµÐ· UI exposure

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** MemoryWatchdog, DLQ, CircuitBreaker, Bootstrap report, Event registry, Subscription stats â€” Ð²ÑÐµ backend ÐµÑÑ‚ÑŒ, UI Ð½ÐµÑ‚.

**Ð’Ð»Ð¸ÑÐ½Ð¸Ðµ:** Â«invisibleÂ» runtime states. ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ Ð·Ð½Ð°ÐµÑ‚ Ð¾ heap pressure, failed events Ð² DLQ, open circuit breakers.

**Fix:** wire to UI (HealthPanel extensions Ð¸Ð»Ð¸ Ð½Ð¾Ð²Ñ‹Ðµ panels).

### 9.3. ðŸŸ¡ Fragmented observability â€” Ð½ÐµÑ‚ unified dashboard

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** 18 observability Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹, Ð½ÐµÑ‚ single Â«system stateÂ» view.

**Ð’Ð»Ð¸ÑÐ½Ð¸Ðµ:** Ð´Ð»Ñ Ð¿Ð¾Ð½Ð¸Ð¼Ð°Ð½Ð¸Ñ Â«Ñ‡Ñ‚Ð¾ Ð¿Ñ€Ð¾Ð¸ÑÑ…Ð¾Ð´Ð¸Ñ‚Â» Ð½ÑƒÐ¶Ð½Ð¾ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚ÑŒ 3â€“5 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹.

**Fix:** unified SystemDashboard (Ð¸Ð»Ð¸ Ñ€Ð°ÑÑˆÐ¸Ñ€Ð¸Ñ‚ÑŒ DashboardPanel).

### 9.4. ðŸŸ¡ HealthSlaPanel = MOCK visible

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** `@deprecated MOCK` HealthSlaPanel visible Ð² nav, Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ simulated SLA.

**Ð’Ð»Ð¸ÑÐ½Ð¸Ðµ:** Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð²Ð¸Ð´Ð¸Ñ‚ mock data Ð±ÐµÐ· Ð¿Ñ€ÐµÐ´ÑƒÐ¿Ñ€ÐµÐ¶Ð´ÐµÐ½Ð¸Ñ.

**Fix:** hide Ð¸Ð»Ð¸ remove (ÑÐ¼. Dead Code Map Â§3.2, Opportunity Map 3.7).

### 9.5. ðŸŸ¡ Bootstrap report Ð½Ðµ exposed

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** `Bootstrap.getPhase()` + `LifecycleManager.getStatuses()` â€” backend Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ñ‹Ð¹, UI Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 3-state sidebar.

**Ð’Ð»Ð¸ÑÐ½Ð¸Ðµ:** ÐµÑÐ»Ð¸ init ÑƒÐ¿Ð°Ð» Ð½Ð° service X â€” user Ð²Ð¸Ð´Ð¸Ñ‚ Â«degradedÂ» Ð½Ð¾ Ð½Ðµ Ð·Ð½Ð°ÐµÑ‚ ÐºÐ°ÐºÐ¾Ð¹ service.

**Fix:** Bootstrap Report panel (Ð¸Ð»Ð¸ Ñ€Ð°Ð·Ð´ÐµÐ» Ð² ServiceRegistryPanel).

---

## 10. Ð¡Ð¸Ð»ÑŒÐ½Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹ observability (Ñ‡Ñ‚Ð¾ Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÐµÑ‚ Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾)

### 10.1. TracesPanel â€” Ð±Ð¾Ð³Ð°Ñ‚Ð°Ñ trace infrastructure

**6 sub-components:**
- `CognitiveMicroscope` â€” inspect cognitive trace
- `DecisionGraph` â€” decision graph viz
- `MicroscopeTimeline` â€” timeline view
- `StepAnalysisPanel` â€” per-step analysis
- `TopologyTraceView` â€” topology trace
- `TraceDebugger` â€” interactive debug

### 10.2. 3-ÑƒÑ€Ð¾Ð²Ð½ÐµÐ²Ð°Ñ error recovery

- Panel-level ErrorBoundary (Ñ Reset)
- App-level GlobalErrorBoundary (Ñ reload)
- Global handlers (unhandledrejection + error)
- `EVENTS.NOTIFICATION` pervasive (195 refs)
- `EVENTS.ERROR_BOUNDARY_CAUGHT` wired (6 refs)
- AlertLayer notification overlay

### 10.3. ServiceRegistryPanel â€” rich service browser

- Service list Ñ search + filter
- Status: phase, uptime, servicesReady, servicesTotal
- Detail panel per service
- Unmapped services panel
- Export decisions

### 10.4. AgentJournalPanel â€” execution trail

- Â«Ð–ÑƒÑ€Ð½Ð°Ð» ÑÑƒÐ¿ÐµÑ€Ð²Ð°Ð¹Ð·ÐµÑ€Ð¾Ð²Â» framing
- JournalEntryCard + StatMini
- Filter by agent
- resolveAgentIdentity for avatar

### 10.5. Bootstrap state machine

- 6 phases (pending/kernel/services/topology/ready/degraded/failed)
- CRITICAL_SERVICES check
- Degraded mode (continue on partial failure)
- 3 retries Ñ exponential backoff

### 10.6. HealthPanel â€” 6 sections

- KernelServicesSection
- DistributedNodesSection
- ProbeResultsSection
- HealthScoreSection
- HealthTimelineSection
- RateLimitIntrospection

---

## 11. Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ð¸

### ðŸ”´ P0 â€” Ð·Ð°ÐºÑ€Ñ‹Ñ‚ÑŒ critical observability gaps

1. **Add cross-nav links Ð¸Ð· diagnostic panels** (12 missing links, ÑÐ¼. Â§6). HealthPanelâ†’ProviderManager, TracesPanelâ†’AgentsPanel, LogsPanelâ†’ServiceRegistry, etc. (ÑÐ¼. Opportunity Map 3.2, 3.6).

2. **Wire MemoryWatchdog to UI** â€” Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ heap gauge Ð² HealthPanel (Ð¸Ð»Ð¸ Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ð°Ñ `ResourceMonitorPanel`). Ð¡ÐµÐ¹Ñ‡Ð°Ñ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² Ð»Ð¾Ð³Ð°Ñ….

3. **Wire DeadLetterQueue to UI** â€” Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ failed events count + list. DLQ panel Ð¸Ð»Ð¸ Ñ€Ð°Ð·Ð´ÐµÐ» Ð² HealthPanel.

4. **Wire CircuitBreaker state to UI** â€” Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ open/half-open/closed per provider Ð² ProviderManager Ð¸Ð»Ð¸ HealthPanel.

5. **Add Bootstrap Report panel** â€” Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ `getPhase()` + `getStatuses()` (549 services init status). Ð¡ÐµÐ¹Ñ‡Ð°Ñ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 3-state sidebar.

6. **Add Event Registry panel** â€” Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ 198 event schemas, ÐºÑ‚Ð¾ emit, ÐºÑ‚Ð¾ subscribe. Ð¡ÐµÐ¹Ñ‡Ð°Ñ 2 772 ÑÑ‚Ñ€Ð¾ÐºÐ¸ event-registry.ts Ð±ÐµÐ· UI.

### ðŸŸ¡ P1 â€” ÑƒÐ»ÑƒÑ‡ÑˆÐ¸Ñ‚ÑŒ existing observability

7. **Add Subscription stats UI** â€” `eventBus.getSubscriptionStats()` Ð¼ÐµÑ‚Ð¾Ð´ ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚, Ð²Ñ‹Ð·Ð²Ð°Ñ‚ÑŒ Ð¸Ð· UI (HealthPanel Ð¸Ð»Ð¸ Event Registry panel).

8. **Add Background Services overview** â€” Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ 15+ `setInterval` timers (name, interval, last tick, next tick, error count).

9. **Remove HealthSlaPanel** (MOCK) â€” Ð»Ð¸Ð±Ð¾ merge Ð² HealthPanel, Ð»Ð¸Ð±Ð¾ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ (ÑÐ¼. Dead Code Map Â§3.2).

10. **Merge SystemHealthPanel Ð² HealthPanel** â€” ÑƒÐ±Ñ€Ð°Ñ‚ÑŒ overlap (ÑÐ¼. Duplication Map Â§3.2).

11. **Add unified SystemDashboard** â€” single view: phase + services + traces + errors + heap + DLQ + circuit breakers.

### ðŸŸ¢ P2 â€” strategic observability

12. **Add OpenTelemetry-style tracing** â€” distributed tracing across services (Ð½Ðµ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ React traces).

13. **Add observability for cognitive chain** â€” trace debate â†’ synthesis â†’ crystal â†’ forum pipeline end-to-end.

14. **Add Â«explain this errorÂ» AI feature** â€” LLM-powered error explanation Ð´Ð»Ñ non-technical users.

15. **Add observability dashboard export** â€” export diagnostics bundle Ð´Ð»Ñ bug reports (logs + traces + state + heap).

---

## 12. Ð˜Ñ‚Ð¾Ð³Ð¾Ð²Ñ‹Ð¹ Ð²ÐµÑ€Ð´Ð¸ÐºÑ‚ Ð¿Ð¾ observability

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | ÐžÑ†ÐµÐ½ÐºÐ° | ÐšÐ¾Ð¼Ð¼ÐµÐ½Ñ‚Ð°Ñ€Ð¸Ð¹ |
|---|:---:|---|
| Observability Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ | ðŸŸ¢ 8/10 | 18+ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹, rich |
| HealthPanel sections | ðŸŸ¢ 9/10 | 6 sections |
| TracesPanel sub-components | ðŸŸ¢ðŸŸ¢ 10/10 | 6 sub-components |
| Error recovery | ðŸŸ¢ðŸŸ¢ 9/10 | 3-ÑƒÑ€Ð¾Ð²Ð½ÐµÐ²Ð°Ñ + 195 NOTIFICATION refs |
| Bootstrap tracking | ðŸŸ¢ 8/10 | 6 phases + retries + degraded |
| Service Registry | ðŸŸ¢ 8/10 | Rich browser Ñ statuses |
| Cross-nav Ð¸Ð· diagnostics | ðŸ”´ 2/10 | **0 links** â€” critical gap |
| 6 diagnostics UI exposure | ðŸ”´ 2/10 | Ð’ÑÐµ Ð±ÐµÐ· UI |
| Unified dashboard | ðŸ”´ 3/10 | Fragmented |
| Self-explanation capability | ðŸŸ¡ 6/10 | Backend excellent, UI partial |
| **Overall Observability Score** | **6.0/10** | Ð‘Ð¾Ð³Ð°Ñ‚Ð°Ñ Ð¸Ð½Ñ„Ñ€Ð°ÑÑ‚Ñ€ÑƒÐºÑ‚ÑƒÑ€Ð°, fragmented |

**Ð¡Ð¸Ð»ÑŒÐ½Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹:**
- **18 observability Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹** â€” Ð±Ð¾Ð³Ð°Ñ‚Ñ‹Ð¹ Ð²Ñ‹Ð±Ð¾Ñ€
- **TracesPanel** â€” 6 sub-components, Ð»ÑƒÑ‡ÑˆÐ°Ñ trace infrastructure
- **3-ÑƒÑ€Ð¾Ð²Ð½ÐµÐ²Ð°Ñ error recovery** â€” panel + app + global
- **195 EVENTS.NOTIFICATION refs** â€” pervasive error notification
- **ServiceRegistryPanel** â€” rich service browser
- **Bootstrap state machine** â€” 6 phases, retries, degraded mode
- **AgentJournalPanel** â€” execution trail Ñ filter

**Ð¡Ð»Ð°Ð±Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹:**
- **0 cross-nav Ð¸Ð· diagnostic panels** â€” Ð³Ð»Ð°Ð²Ð½Ñ‹Ð¹ gap, Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ Ð¼Ð¾Ð¶ÐµÑ‚ Ð½Ð°Ð¹Ñ‚Ð¸ source
- **6 ÐºÐ»ÑŽÑ‡ÐµÐ²Ñ‹Ñ… diagnostics Ð±ÐµÐ· UI** (MemoryWatchdog, DLQ, CircuitBreaker, Bootstrap report, Event registry, Subscription stats)
- **ÐÐµÑ‚ unified Â«explain stateÂ» dashboard** â€” Ð´Ð°Ð½Ð½Ñ‹Ðµ fragmented
- **HealthSlaPanel = MOCK** visible Ð² nav
- **Diagnostic panels Ð¸Ð·Ð¾Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ñ‹** â€” TracesPanel/HealthPanel/LogsPanel Ð½Ðµ ÑÐ²ÑÐ·Ð°Ð½Ñ‹

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ð²Ñ‹Ð²Ð¾Ð´ (ÐºÐ°Ðº Ð¿Ñ€ÐµÐ´ÑÐºÐ°Ð·Ñ‹Ð²Ð°Ð»Ð¾ Ð·Ð°Ð´Ð°Ð½Ð¸Ðµ):** Â«ÐÐ°ÑÐºÐ¾Ð»ÑŒÐºÐ¾ ÑÐ°Ð¼Ð° ÐžÐ¡ ÑÐ¿Ð¾ÑÐ¾Ð±Ð½Ð° Ð¾Ð±ÑŠÑÑÐ½Ð¸Ñ‚ÑŒ ÑÐ²Ð¾Ñ‘ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸ÐµÂ» â€” **6.0/10**. Backend observability Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ñ‹Ð¹ (state machine, statuses, traces, error recovery), Ð½Ð¾ **UI fragmented** Ð¸ **6 ÐºÐ»ÑŽÑ‡ÐµÐ²Ñ‹Ñ… diagnostics invisible**. ÐžÐ¡ **Ð¼Ð¾Ð¶ÐµÑ‚** Ð¾Ð±ÑŠÑÑÐ½Ð¸Ñ‚ÑŒ state Ñ‡ÐµÑ€ÐµÐ· 18 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹, Ð½Ð¾ **Ð½Ðµ Ð²ÐµÐ´Ñ‘Ñ‚** Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»Ñ Ð¾Ñ‚ ÑÐ¸Ð¼Ð¿Ñ‚Ð¾Ð¼Ð° Ðº source.

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ñ€Ñ‹Ñ‡Ð°Ð³:** Ð·Ð°ÐºÑ€Ñ‹Ñ‚ÑŒ 12 cross-nav links + wire 6 diagnostics to UI + create unified dashboard. Ð­Ñ‚Ð¾ Ð¿Ð¾Ð´Ð½Ð¸Ð¼ÐµÑ‚ observability score Ñ 6.0 Ð´Ð¾ ~8.0/10.

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ A. Ð’ÑÐµ observability-Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ Ð² Ñ†Ð¸Ñ„Ñ€Ð°Ñ…

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº |
|---|---:|---|
| Observability Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ | 18+ | ls + grep |
| HealthPanel ÑÐµÐºÑ†Ð¸Ð¹ | 6 | Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| TracesPanel sub-components | 6 | ls |
| ServiceRegistryPanel ÑÑ‚Ñ€Ð¾Ðº | 421 + 5 sub (1 021 total) | wc -l |
| StateInspectorPanel ÑÑ‚Ñ€Ð¾Ðº | 301 + 3 sub (468 total) | wc -l |
| Bootstrap phases | 6 (pending/kernel/services/topology/ready/degraded/failed) | bootstrap.ts |
| CRITICAL_SERVICES | 4 (kernel, configService, keyService, pricingService) | bootstrap-phases.ts |
| LifecycleManager.getStatuses() | âœ… method exists | lifecycle-manager.ts |
| InitStatus type | {name, status: 'ok'\|'error'\|'skipped', error?} | lifecycle-manager.ts |
| tryInit retries | 3 + exponential backoff | lifecycle-manager.ts |
| ErrorBoundary ÑƒÑ€Ð¾Ð²Ð½ÐµÐ¹ | 3 (panel + app + global) | ErrorBoundary + GlobalErrorBoundary + main.tsx |
| EVENTS.NOTIFICATION references | **195** | grep |
| EVENTS.ERROR_BOUNDARY_CAUGHT refs | 6 | grep |
| AlertLayer ÑÑ‚Ñ€Ð¾Ðº | 341 | wc -l |
| AgentJournalPanel sub-components | 3 (JournalEntryCard, JournalAddForm, StatMini) | ls |
| DecisionLogPanel ÑÑ‚Ñ€Ð¾Ðº | 312 | wc -l |
| AuditLogView ÑÑ‚Ñ€Ð¾Ðº | 376 | wc -l |
| MemoryWatchdog UI | âŒ Ð½ÐµÑ‚ | grep |
| DeadLetterQueue UI | âŒ Ð½ÐµÑ‚ | grep |
| CircuitBreaker state UI | âŒ Ð½ÐµÑ‚ | grep |
| Bootstrap report UI | âŒ Ð½ÐµÑ‚ | grep |
| Event registry UI (198 schemas) | âŒ Ð½ÐµÑ‚ | grep |
| Subscription stats UI | âŒ Ð½ÐµÑ‚ (method exists, 1 ref) | grep |
| Cross-nav Ð¸Ð· diagnostic panels | **0** | grep per panel |
| Missing cross-nav links | 12 | this report |
| runtimeStatus Ð² Sidebar | 3-state (online/degraded/offline) | Sidebar.tsx |
| Background timers Ð±ÐµÐ· UI | 15+ | Resource Map |

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ B. Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¸ Ð¸ Ð¼ÐµÑ‚Ð¾Ð´

| Ð§Ñ‚Ð¾ | Ð“Ð´Ðµ | ÐšÐ°Ðº Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð¾ |
|---|---|---|
| Observability panels | `src/components/` | ls + grep health\|trace\|log\|debug\|diagnostic |
| HealthPanel sections | `src/components/HealthPanel/` | ls + Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ imports |
| TracesPanel sub-components | `src/components/TracesPanel/` | ls |
| ServiceRegistryPanel | `src/components/ServiceRegistryPanel/` (5 files) | wc -l + head |
| Bootstrap phases | `src/kernel/bootstrap.ts` | grep phase |
| LifecycleManager | `src/kernel/services/lifecycle-manager.ts` | grep statuses |
| Error events | `src/kernel/events/event-names.ts` | grep ERROR\|NOTIFICATION |
| EVENTS.NOTIFICATION usage | `src/` | grep -rE |
| ErrorBoundary | `src/components/Common/ErrorBoundary.tsx` | Ð¿Ð¾Ð»Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ (ÑÐ¼. Lifecycle Map) |
| Cross-nav audit | `src/components/{Logs,Traces,Health,StateInspector}*/` | grep navigate() per dir |
| MemoryWatchdog UI | `src/components/` | grep memoryWatchdog |
| DLQ UI | `src/components/` | grep deadLetter |
| CircuitBreaker UI | `src/components/` | grep circuitBreaker |
| Event registry UI | `src/components/` | grep event-registry\|EventRegistry |
| Subscription stats | `src/` | grep getSubscriptionStats |
| runtimeStatus Ð² Sidebar | `src/components/Sidebar.tsx` | grep runtimeStatus |

---

*ÐžÑ‚Ñ‡Ñ‘Ñ‚ ÑÐ³ÐµÐ½ÐµÑ€Ð¸Ñ€Ð¾Ð²Ð°Ð½ 2026-10-31 Ð½Ð° Ð¾ÑÐ½Ð¾Ð²Ðµ ÐºÐ¾Ð¼Ð¼Ð¸Ñ‚Ð° `e08ab8e*. ÐÐ½Ð°Ð»Ð¸Ð· ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹; runtime observability (actual dashboard screenshots) Ð½Ðµ Ð¿Ñ€Ð¾Ð²Ð¾Ð´Ð¸Ð»ÑÑ. ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð¾Ñ‚Ñ‡Ñ‘Ñ‚Ñ‹: 13 Ð¿Ñ€ÐµÐ´Ñ‹Ð´ÑƒÑ‰Ð¸Ñ… ÐºÐ°Ñ€Ñ‚ (Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚ÑŒ, Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚ÑŒ, Ñ‚ÐµÑ…ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ, Ñ€ÐµÑÑƒÑ€ÑÑ‹, Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ, Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸, lifecycle, Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð¾ÑÑ‚ÑŒ, Ð¿Ñ€Ð¾Ð±ÐµÐ»Ñ‹, Ð¸Ð½Ñ‚ÐµÐ³Ñ€Ð°Ñ†Ð¸Ñ, user journeys, Ð¿Ð¾Ñ‚ÐµÐ½Ñ†Ð¸Ð°Ð», Ð¼Ñ‘Ñ€Ñ‚Ð²Ñ‹Ð¹ ÐºÐ¾Ð´).*
