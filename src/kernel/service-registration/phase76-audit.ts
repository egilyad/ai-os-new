/**
 * Phase 76 — Audit Service (AGEMS port, Phase 9).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IDatabaseService } from '../types/interfaces';
import { AuditService } from '../services/audit-service';

export const registerPhase76: Phase = ({ register }) => {
    register('auditService', (c: IContainer) => {
        const db = c.get<IDatabaseService>('database');
        return new AuditService({
            auditLogs: db.auditLogs,
            accessRules: db.accessRules,
        });
    });
};
