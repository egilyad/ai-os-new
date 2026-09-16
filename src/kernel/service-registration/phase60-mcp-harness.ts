/**
 * Phase 60 — MCP Harness (GAP G7, STATIC GAP CLOSURE).
 *
 * Registers (additive, no migration):
 *   - mcpHarnessService (reconnect + proxy + health over MCPService)
 *
 * Real servers = BLOCKED-RUNTIME if none connected.
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { MCPService } from '../services/mcp-service';
import { McpHarnessService } from '../services/interop/mcp-harness-service';

export const registerPhase60: Phase = ({ register }) => {
    register('mcpHarnessService', (c: IContainer) => {
        return new McpHarnessService({
            mcpService: c.get<MCPService>('mcpService'),
            events: c.get<IEventBus>('eventBus'),
        });
    });
};
