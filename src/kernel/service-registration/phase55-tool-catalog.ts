/**
 * Phase 55 — Tool Catalog (GAP G2, STATIC GAP CLOSURE).
 *
 * Registers (additive, no migration):
 *   - toolCatalogService (catalog over ToolRunner + SkillMarket + MCP)
 *
 * ToolRunnerService stays the executor; catalog is discovery/search.
 * MCP tools appear as group=mcp when mcpService present (PROVIDER-PENDING if none).
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { IToolRunnerService } from '../contracts/parity';
import type { ISkillMarketService } from '../contracts/ops';
import { ToolCatalogService } from '../services/catalog/tool-catalog-service';

export const registerPhase55: Phase = ({ register }) => {
    register('toolCatalogService', (c: IContainer) => {
        const runner = c.get<IToolRunnerService>('toolRunnerService');
        const skillMarket = c.has('skillMarketService') ? c.get<ISkillMarketService>('skillMarketService') : undefined;
        const mcp = c.has('mcpService') ? c.get<unknown>('mcpService') as { listServers?: () => Promise<Array<{ id: string; tools: string[] }>> } : undefined;
        return new ToolCatalogService({
            toolRunner: runner,
            skillMarket,
            mcp,
            events: c.get<IEventBus>('eventBus'),
        });
    });
};
