/**
 * Cognitive-aux / research panel (Experimental).
 * Shadow router projection — research-grade, not production surface (P1.21).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch } from 'lucide-react';
import { routerProjection, routerService } from '../../kernel/instances';
import { eventBus } from '../../kernel/instances';
import { EVENTS } from '../../kernel/events/event-names';
import { compareRouterDecisions } from '../../kernel/services/projections/router-shadow-diff';
import RouterDiffView from './RouterDiffView';
import type { RouterDiffReport } from '../../kernel/services/projections/router-shadow-diff';

const ShadowPanel: React.FC = () => {
    const [routerReport, setRouterReport] = useState<RouterDiffReport | null>(null);
    const [loading, setLoading] = useState(true);

    const runDiff = useCallback(() => {
        setLoading(true);
        try {
            const liveDecisions = routerService.getDecisionHistory(200);
            const projRouterMap = routerProjection.getState();
            const rReport = compareRouterDecisions(liveDecisions, projRouterMap);
            setRouterReport(rReport);

            if (rReport.driftScore > 0)
                console.info('[ShadowPanel] Router drift', {
                    driftScore: rReport.driftScore,
                    criticalCount: rReport.criticalCount,
                    mismatchCount: rReport.mismatches.length,
                    type: 'router',
                });
        } catch (e) {
            console.error('[ShadowPanel] Diff failed:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        runDiff();
        const unsubs = [
            eventBus.onSafe(EVENTS.DECISION, runDiff),
            eventBus.onSafe(EVENTS.KERNEL_UPDATED, runDiff),
        ];
        return () => unsubs.forEach((u) => u());
    }, [runDiff]);

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', color: 'var(--slate-200)' }}>
            <div
                style={{
                    fontSize: '0.85rem',
                    color: 'var(--slate-500)',
                    marginBottom: 16,
                    padding: 12,
                    background: 'rgba(59,130,246,0.08)',
                    borderRadius: 8,
                    border: '1px solid rgba(59,130,246,0.2)',
                }}
            >
                KeyStateProjection merged into KeyStateStore &mdash; key-state drift monitoring is
                no longer needed.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <GitBranch size={24} color="#8b5cf6" />
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                    Router Projection Diff
                </h1>
            </div>

            {loading && !routerReport && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--slate-500)' }}>
                    Computing diff&hellip;
                </div>
            )}

            {routerReport ? (
                <RouterDiffView report={routerReport} />
            ) : (
                !loading && (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--slate-500)' }}>
                        No data
                    </div>
                )
            )}

            <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button
                    onClick={runDiff}
                    style={{
                        background: 'rgba(139,92,246,0.15)',
                        color: 'var(--purple-muted)',
                        border: '1px solid rgba(139,92,246,0.3)',
                        borderRadius: 8,
                        padding: '0.5rem 1.25rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                    }}
                >
                    Re-run Diff
                </button>
            </div>
        </div>
    );
};

export default ShadowPanel;
