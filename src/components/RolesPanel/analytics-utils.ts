import type { RoleUsageStats } from '../../kernel/instances';

export interface RoleAnalyticsEntry {
    id: string;
    name: string;
    metadata: { category: string };
}

export interface SummaryData {
    totalInvocations: number;
    totalErrors: number;
    avgLatency: number;
    successRate: number;
}

export interface TopRole {
    id: string;
    name: string;
    metadata: { category: string };
    invocations: number;
    eloScore: number;
}

export interface DailyActivity {
    day: string;
    invocations: number;
    errors: number;
}

export interface ToolUsage {
    tool: string;
    count: number;
}

export interface TempCorrelation {
    label: string;
    rate: number;
    total: number;
}

export interface HeatmapRow {
    roleId: string;
    roleName: string;
    hours: number[];
    max: number;
}

export interface FatigueAlert {
    id: string;
    name: string;
    status: string;
    recentRate: number;
    overallRate: number;
}

export interface CategorySegment {
    label: string;
    value: number;
    color: string;
}

export function computeSummary(
    stats: Record<string, RoleUsageStats>,
    roles: RoleAnalyticsEntry[],
): SummaryData {
    const totalInvocations = Object.values(stats).reduce((s, r) => s + (r.invocations || 0), 0);
    const totalErrors = Object.values(stats).reduce((s, r) => s + (r.errors || 0), 0);
    const avgLatency =
        roles.length > 0
            ? Math.round(
                  Object.values(stats).reduce((s, r) => s + (r.avgLatency || 0), 0) /
                      Math.max(1, Object.keys(stats).length),
              )
            : 0;
    const successRate =
        totalInvocations > 0
            ? Math.round(((totalInvocations - totalErrors) / totalInvocations) * 100)
            : 100;
    return { totalInvocations, totalErrors, avgLatency, successRate };
}

export function computeTopRoles(
    stats: Record<string, RoleUsageStats>,
    roles: RoleAnalyticsEntry[],
    limit = 8,
): TopRole[] {
    return roles
        .slice()
        .sort((a, b) => (stats[b.id]?.invocations || 0) - (stats[a.id]?.invocations || 0))
        .slice(0, limit)
        .map((r) => {
            const s = stats[r.id];
            const inv = s?.invocations || 0;
            const errs = s?.errors || 0;
            const eloScore =
                inv > 0
                    ? Math.round(
                          ((inv - errs) / inv) * 400 +
                              Math.max(0, 1 - (s?.avgLatency || 0) / 10000) * 200 +
                              200,
                      )
                    : 0;
            return { ...r, invocations: inv, eloScore };
        });
}

export function computeCategorySegments(roles: RoleAnalyticsEntry[]): CategorySegment[] {
    const counts: Record<string, number> = {};
    roles.forEach((r) => {
        counts[r.metadata.category] = (counts[r.metadata.category] || 0) + 1;
    });
    const colors: Record<string, string> = {
        technical: '#3b82f6',
        creative: '#a855f7',
        analytical: '#10b981',
        management: '#f59e0b',
        custom: '#64748b',
    };
    return Object.entries(counts).map(([label, value]) => ({
        label,
        value,
        color: colors[label] || '#64748b',
    }));
}

export function computeDailyActivity(stats: Record<string, RoleUsageStats>): DailyActivity[] {
    const days: string[] = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        days.push(d.toISOString().slice(0, 10));
    }
    return days.map((day) => {
        let inv = 0,
            errs = 0;
        for (const s of Object.values(stats)) {
            if (s.dailyStats?.[day]) {
                inv += s.dailyStats[day].invocations;
                errs += s.dailyStats[day].errors;
            }
        }
        return { day, invocations: inv, errors: errs };
    });
}

export function computeToolUsage(stats: Record<string, RoleUsageStats>, limit = 10): ToolUsage[] {
    const agg: Record<string, number> = {};
    for (const s of Object.values(stats)) {
        if (s.toolUsage) {
            for (const [tool, count] of Object.entries(s.toolUsage)) {
                agg[tool] = (agg[tool] || 0) + count;
            }
        }
    }
    return Object.entries(agg)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tool, count]) => ({ tool, count }));
}

export function computeTempCorrelation(stats: Record<string, RoleUsageStats>): TempCorrelation[] {
    const buckets: Record<string, { success: number; total: number }> = {};
    for (const s of Object.values(stats)) {
        if (s.temperatureLog) {
            for (const entry of s.temperatureLog) {
                const key = entry.temp < 0.3 ? 'low' : entry.temp < 0.7 ? 'medium' : 'high';
                const b = buckets[key] || { success: 0, total: 0 };
                b.total++;
                if (entry.success) b.success++;
                buckets[key] = b;
            }
        }
    }
    return Object.entries(buckets).map(([label, b]) => ({
        label,
        rate: b.total > 0 ? Math.round((b.success / b.total) * 100) : 0,
        total: b.total,
    }));
}

export function computeHeatmap(
    stats: Record<string, RoleUsageStats>,
    topRoles: TopRole[],
    roles: RoleAnalyticsEntry[],
): HeatmapRow[] {
    const top5Ids = topRoles.slice(0, 5).map((r) => r.id);
    return top5Ids.map((id) => {
        const s = stats[id];
        const hours: number[] = [];
        let maxH = 1;
        for (let h = 0; h < 24; h++) {
            const val = s?.hourlyDistribution?.[h] || 0;
            hours.push(val);
            if (val > maxH) maxH = val;
        }
        return {
            roleId: id,
            roleName: roles.find((r) => r.id === id)?.name || '',
            hours,
            max: maxH,
        };
    });
}

export function computeFatigueAlerts(
    stats: Record<string, RoleUsageStats>,
    roles: RoleAnalyticsEntry[],
): FatigueAlert[] {
    const alerts: FatigueAlert[] = [];
    for (const r of roles) {
        const s = stats[r.id];
        if (!s || s.invocations < 10) continue;
        const overall = s.invocations > 0 ? (s.invocations - s.errors) / s.invocations : 0;
        const recentDays = Object.entries(s.dailyStats || {})
            .filter(([day]) => (Date.now() - new Date(day).getTime()) / 86400000 <= 7)
            .reduce((acc, [, d]) => ({ i: acc.i + d.invocations, e: acc.e + d.errors }), {
                i: 0,
                e: 0,
            });
        const recent = recentDays.i > 0 ? (recentDays.i - recentDays.e) / recentDays.i : overall;
        const decline = overall - recent;
        if (decline > 0.1) {
            alerts.push({
                id: r.id,
                name: r.name,
                status: decline > 0.2 ? 'critical' : 'fatigued',
                recentRate: Math.round(recent * 100),
                overallRate: Math.round(overall * 100),
            });
        }
    }
    return alerts.sort((a, b) => a.recentRate - a.overallRate - (b.recentRate - b.overallRate));
}
