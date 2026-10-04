/**
 * Phase 58 — Code Sandbox (GAP G5, STATIC GAP CLOSURE).
 *
 * Registers (additive, no migration):
 *   - codeSandboxService (policy + timeout + artifact over CodeExecService)
 *
 * Real E2B execution = BLOCKED-RUNTIME (stub executor).
 *
 * P-CRIT-3, documented, not wired: the real worker executor lives in
 * SandboxService (src/kernel/services/sandbox-service.ts, NOT
 * services/sandbox/) behind the intentional VITE_SANDBOX_ENABLED prod gate,
 * and nothing resolves codeSandboxService from the container today.
 * Wiring setExecutor() to it (or deleting the service) is a product call:
 * enabling agent code execution in production expands the threat model.
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal/types';
import type { ICodeExecService } from '../contracts/rivals5';
import { CodeSandboxService } from '../services/sandbox/code-sandbox-service';

export const registerPhase58: Phase = ({ register }) => {
    register('codeSandboxService', (c: IContainer) => {
        return new CodeSandboxService({
            dal: c.get<DataAccessLayer>('dal'),
            codeExec: c.get<ICodeExecService>('codeExecService'),
            events: c.get<IEventBus>('eventBus'),
        });
    });
};
