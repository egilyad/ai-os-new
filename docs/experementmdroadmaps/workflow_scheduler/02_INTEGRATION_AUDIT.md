# INTEGRATION_AUDIT.md

## Mapping Audit

To bridge these systems, the following mapping is required:

| Scheduled Task (Scheduler) | Workflow Execution (WorkflowService)     |
| :------------------------- | :--------------------------------------- |
| `taskParams`               | `input` (Workflow Input)                 |
| `schedule.id`              | Workflow context reference               |
| `SCHEDULE_TRIGGERED` event | Trigger `runWorkflow(workflowId, input)` |

## Missing Components

1. **Event Bridge**: There is no service currently responsible for listening to `SCHEDULE_TRIGGERED` and resolving it to a `WorkflowId`.
2. **Context Resolution**: The Scheduler `TaskParams` (`src/kernel/services/scheduler-service.ts:30`) are not typed to accept a `WorkflowId`.
3. **Execution Delegate**: `WorkflowService` must expose a public listener or the Orchestrator needs to handle the event.

## Opinion

The integration should not modify the `SchedulerService` heavily. Instead, create a `WorkflowSchedulerBridge` service that listens for `SCHEDULE_TRIGGERED` and, if the task is a workflow trigger, calls `WorkflowService.runWorkflow()`.
