/**
 * Phase 27 — Ops / governance / mobile (Roadmap Wave 5).
 *
 * Registers:
 *   - `opsRepository` (DAL over 9 v27 tables)
 *   - `auditService` (hash-chained log — shared by all ops services)
 *   - `hierarchyService` (CEO → subordinates + budgets)
 *   - `toolGovernanceService` (MCP registry + grants)
 *   - `sandboxBrokerService` (browser/computer tickets)
 *   - `skillMarketService` (marketplace + manifests)
 *   - `fleetMonitorService` (mission projection over crew/council/graph events)
 *   - `mobileAccessService` (pairing + notifications + quick HITL on
 *     the real Graph/Council services)
 *
 * Additive — Budget/Timeline/Skills/MCP/Sandbox runtimes untouched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { IGraphService } from '../contracts/graph';
import type { ICouncilService } from '../contracts/council';
import { OpsRepository } from '../dal/ops-repository';
import { AuditService } from '../services/ops/audit-service';
import { HierarchyService } from '../services/ops/hierarchy-service';
import { ToolGovernanceService } from '../services/ops/tool-governance-service';
import { SandboxBrokerService } from '../services/ops/sandbox-broker-service';
import { SkillMarketService } from '../services/ops/skill-market-service';
import { FleetMonitorService } from '../services/ops/fleet-monitor-service';
import { MobileAccessService } from '../services/ops/mobile-access-service';
import type { IAuditService } from '../contracts/ops';

export const registerPhase27: Phase = ({ register }) => {
    register('opsRepository', (c: IContainer) => {
        return new OpsRepository(c.get<DatabaseService>('database'));
    });

    register('auditService', (c: IContainer) => {
        return new AuditService(
            c.get<OpsRepository>('opsRepository'),
            c.get<IEventBus>('eventBus'),
        );
    });

    const withAudit = (c: IContainer) => ({
        repo: c.get<OpsRepository>('opsRepository'),
        events: c.get<IEventBus>('eventBus'),
        audit: c.get<IAuditService>('auditService'),
    });

    register('hierarchyService', (c: IContainer) => {
        const { repo, events, audit } = withAudit(c);
        return new HierarchyService(repo, events, audit);
    });

    register('toolGovernanceService', (c: IContainer) => {
        const { repo, events, audit } = withAudit(c);
        return new ToolGovernanceService(repo, events, audit);
    });

    register('sandboxBrokerService', (c: IContainer) => {
        const { repo, events, audit } = withAudit(c);
        return new SandboxBrokerService(repo, events, audit);
    });

    register('skillMarketService', (c: IContainer) => {
        const { repo, audit } = withAudit(c);
        return new SkillMarketService(repo, audit);
    });

    register('fleetMonitorService', (c: IContainer) => {
        return new FleetMonitorService(
            c.get<OpsRepository>('opsRepository'),
            c.get<IEventBus>('eventBus'),
        );
    });

    register('mobileAccessService', (c: IContainer) => {
        const { repo, events, audit } = withAudit(c);
        return new MobileAccessService({
            repo,
            events,
            audit,
            graphs: c.get<IGraphService>('graphService'),
            councils: c.get<ICouncilService>('councilService'),
        });
    });
};
