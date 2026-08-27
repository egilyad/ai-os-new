# ROADMAP.md

## Phase 0: Hook Repair

- **Repair**: Audit `BuilderAgentService` (`src/kernel/services/builder/builder-agent-service.ts:40`) to fix incorrect event emission.
- **Repair**: Ensure `WorkflowService` handles abort signals correctly when executed automatically (prevention of resource leaks).

## Phase 1: Event Bridge Establishment

- **Action**: Create `WorkflowSchedulerBridge` in `src/kernel/services/`.
- **Action**: Subscribes to `EVENTS.SCHEDULE_TRIGGERED`.
- **Action**: Validates if the `taskParams` includes `workflowId`.
- **Action**: Triggers `WorkflowService.runWorkflow(workflowId, input)`.

## Phase 2: Configuration & Data Model

- **Update**: Extend `TaskParams` in `src/kernel/services/scheduler-service.ts` to include `workflowId` (Inferred: essential for binding).
- **Update**: Repository updates to link Schedules to Workflows via FK/Reference (Inferred).

## Phase 3: Automated Deployment UI

- **UI**: Extend `SchedulerPanel` to allow selecting a `Workflow` as the task type instead of generic prompt/params.
- **UI**: Visual feedback on scheduled workflow runs in `WorkflowPanel`.
