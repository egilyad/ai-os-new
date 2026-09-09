import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { RoleUsageStats } from '../../kernel/instances';
import {
    computeSummary,
    computeTopRoles,
    computeCategorySegments,
    computeDailyActivity,
    computeToolUsage,
    computeTempCorrelation,
    computeHeatmap,
    computeFatigueAlerts,
} from './analytics-utils';
import AnalyticsOverview from './AnalyticsOverview';
import AnalyticsTimeSeries from './AnalyticsTimeSeries';
import AnalyticsAdvanced from './AnalyticsAdvanced';

interface RoleAnalyticsProps {
    stats: Record<string, RoleUsageStats>;
    roles: Array<{ id: string; name: string; metadata: { category: string } }>;
}

export const RoleAnalytics: React.FC<RoleAnalyticsProps> = ({ stats, roles }) => {
    const summary = computeSummary(stats, roles);
    const topRoles = computeTopRoles(stats, roles);
    const categorySegments = computeCategorySegments(roles);
    const timeSeriesData = computeDailyActivity(stats);
    const toolUsage = computeToolUsage(stats);
    const tempCorrelation = computeTempCorrelation(stats);
    const heatmapData = computeHeatmap(stats, topRoles, roles);
    const fatigueAlerts = computeFatigueAlerts(stats, roles);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={18} color="#3b82f6" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-200)' }}>
                    Role Usage Analytics
                </span>
            </div>

            <AnalyticsOverview
                summary={summary}
                topRoles={topRoles}
                categorySegments={categorySegments}
            />

            <AnalyticsTimeSeries data={timeSeriesData} />

            <AnalyticsAdvanced
                toolUsage={toolUsage}
                tempCorrelation={tempCorrelation}
                heatmapData={heatmapData}
                topRoles={topRoles}
                fatigueAlerts={fatigueAlerts}
            />
        </div>
    );
};

export default RoleAnalytics;
