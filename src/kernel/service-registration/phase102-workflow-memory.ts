/** Phase 102 — reusable workflow decomposition memory. */
import type { Phase } from './helpers';
import { WorkflowMemoryService } from '../services/orchestrator/workflow-memory-service';

export const registerPhase102: Phase = ({ register }) => {
    register('workflowMemoryService', () => new WorkflowMemoryService());
};
