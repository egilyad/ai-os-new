# SCHEDULER_WORKFLOW_MASTER.md

## Vision

To enable autonomous, time-based triggering of complex agent workflows. Bridging the `SchedulerService` (CRON tasks) with `BuilderAgentService` (Workflow execution) would allow for automated maintenance, reporting, and proactive agentic behaviors.

## Current State & Breakage

- **Scheduler**: Emits `EVENTS.SCHEDULE_TRIGGERED` (`src/kernel/services/scheduler-service.ts:300`).
- **Builder/Workflow**: `WorkflowService` lacks a dispatch hook to start workflows from scheduled events (`src/kernel/services/workflow-service.ts:154-250`).
- **Builder Agent**: Currently emits `debate:start` (`src/kernel/services/builder/builder-agent-service.ts:40`), indicating incomplete event integration for workflow-specific triggers.

## Potential for Automation

Scheduled workflows allow for "maintenance" workflows (e.g., daily synthesis of forum topics) to run without human interaction, significantly increasing agentic autonomy in SuperAgents OS.

## Recommended Roadmap

1. **Hook Repair**: Implement event listeners in `WorkflowService`.
2. **Event Bridge**: Map `SCHEDULE_TRIGGERED` to `runWorkflow`.
3. **UI Integration**: Expose workflow selection in the Scheduler UI.
