# DO_NOT_BUILD_YET.md

## Architectural Traps

- **Duplication**: Do not build a new scheduler within `WorkflowService`. The `SchedulerService` is already robust and handles persistence (`src/kernel/services/scheduler-service.ts:74`).
- **Circular Dependencies**: `WorkflowService` and `SchedulerService` should not depend directly on each other. Use the `EventBus` as the mediation layer (`src/kernel/events/event-bus.ts`).
- **Resource Exhaustion**: If a workflow takes longer than the scheduled interval (60s), the `SchedulerService` might trigger it again before completion. The Bridge must manage execution status to prevent parallel, overlapping runs.

## Risks of Premature Automation

- **Unintended Execution**: If a workflow is triggered automatically, it might consume all LLM tokens or hit rate limits, crippling other agents.
- **Hidden Errors**: Workflow failures triggered by CRON might go unnoticed if proper observability (e.g., `WorkflowRun` monitoring) is not implemented first.

## Advice

Establish a robust observability and run-status monitoring system for workflows _before_ enabling CRON-based triggering.
