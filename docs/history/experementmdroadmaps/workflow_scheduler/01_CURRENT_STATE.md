# CURRENT_STATE.md

## Inventory

- **SchedulerService** (`src/kernel/services/scheduler-service.ts`):
  - **Purpose**: Cron-like scheduling.
  - **Verified**: Emits `EVENTS.SCHEDULE_TRIGGERED` on `runSchedule()` (line 300).
- **WorkflowService** (`src/kernel/services/workflow-service.ts`):
  - **Purpose**: DAG-based workflow execution.
  - **Verified**: `runWorkflow()` (line 154) handles execution, but no automated bridge exists for triggering workflows via external events.
- **BuilderAgentService** (`src/kernel/services/builder/builder-agent-service.ts`):
  - **Purpose**: Workflow compilation and deployment.
  - **Verified**: Contains unused or incorrect event emitters (line 40: `debate:start`).

## Analysis of Broken Hooks

- The Scheduler is isolated. It knows _when_ to run, but not _what_ to run beyond a generic task definition.
- The Workflow system is passive. It requires an explicit `runWorkflow` call.
- The Builder Agent is the compiler, but not the orchestrator.
- **Inference**: The current architecture assumes manual or UI-driven initiation of workflows, bypassing the potential for automated execution.
