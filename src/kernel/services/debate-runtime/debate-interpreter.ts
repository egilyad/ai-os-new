import type {
    DebateSession,
    DebateArgument,
    DisagreementPoint,
    TrajectoryChanger,
    ConstraintCorrelation,
    DebateInterpretation,
} from '../../contracts/debate-types';

export class DebateInterpreter {
    interpret(session: DebateSession): DebateInterpretation {
        const timeline = this.buildDisagreementTimeline(session);
        const peak = this.findDisagreementPeak(timeline, session);
        const changers = this.findTrajectoryChangers(session, timeline);
        const correlation =
            session.strategy === 'constrained'
                ? this.analyzeConstraintCorrelation(session)
                : undefined;
        const insights = this.generateInsights(session);

        return {
            summary: this.generateSummary(session),
            disagreementPeak: peak,
            disagreementTimeline: timeline,
            trajectoryChangers: changers,
            constraintCorrelation: correlation,
            insights,
        };
    }

    private buildDisagreementTimeline(
        session: DebateSession,
    ): Array<{ round: number; intensity: number }> {
        const maxR = Math.max(...session.arguments.map((a) => a.round), 1);
        const rv: Array<{ round: number; intensity: number }> = [];

        for (let r = 1; r <= maxR; r++) {
            const roundArgs = session.arguments.filter((a) => a.round === r);
            const pros = roundArgs.filter((a) => a.position === 'pro').length;
            const cons = roundArgs.filter((a) => a.position === 'con').length;
            const total = pros + cons;

            let intensity = 0;
            if (total > 0) {
                const ratio = pros / total;
                intensity = Math.round((1 - 2 * Math.abs(0.5 - ratio)) * 100) / 100;
            }
            rv.push({ round: r, intensity });
        }
        return rv;
    }

    private findDisagreementPeak(
        timeline: Array<{ round: number; intensity: number }>,
        session: DebateSession,
    ): DisagreementPoint | null {
        if (timeline.length === 0) return null;
        const peak = timeline.reduce((a, b) => (a.intensity > b.intensity ? a : b));
        if (peak.intensity < 0.3) return null;

        const peakArgs = session.arguments.filter((a) => a.round === peak.round);
        const trigger = peakArgs.length > 0 ? peakArgs[0]!.content.slice(0, 120) : 'no trigger';
        const participants = [...new Set(peakArgs.map((a) => a.agentName))];

        return { round: peak.round, intensity: peak.intensity, trigger, participants };
    }

    private findTrajectoryChangers(
        session: DebateSession,
        timeline: Array<{ round: number; intensity: number }>,
    ): TrajectoryChanger[] {
        const changers: TrajectoryChanger[] = [];

        // 1. Arguments that preceded a sharp intensity shift
        for (let i = 1; i < timeline.length; i++) {
            const prev = timeline[i - 1]!.intensity;
            const curr = timeline[i]!.intensity;
            const shift = Math.abs(curr - prev);
            if (shift >= 0.4) {
                const roundArgs = session.arguments.filter((a) => a.round === timeline[i]!.round);
                for (const a of roundArgs) {
                    const rising = curr > prev;
                    changers.push({
                        argumentId: a.id,
                        agentName: a.agentName,
                        round: a.round,
                        impact: rising ? 'shifted_focus' : 'consensus_shift',
                        description: rising
                            ? `Intensity rose ${Math.round(shift * 100)}% — ${a.agentName} introduced a polarizing position`
                            : `Intensity dropped ${Math.round(shift * 100)}% — ${a.agentName}'s argument reduced tension`,
                    });
                }
            }
        }

        // 2. In tree mode: most-linked argument (highest child count) = trajectory shaper
        if (session.strategy === 'argument_tree') {
            const childCount = new Map<string, number>();
            for (const a of session.arguments) {
                if (a.parentId) childCount.set(a.parentId, (childCount.get(a.parentId) || 0) + 1);
            }
            const sorted = [...childCount.entries()].sort((a, b) => b[1] - a[1]);
            for (const [argId, count] of sorted.slice(0, 3)) {
                const arg = session.arguments.find((a) => a.id === argId);
                if (arg) {
                    changers.push({
                        argumentId: argId,
                        agentName: arg.agentName,
                        round: arg.round,
                        impact: 'deepened',
                        description: `Sparked ${count} child arguments — became a structural hub in the argument tree`,
                    });
                }
            }
        }

        // 3. Arguments that triggered significant responses (trajectory changers)
        const childCountMap = new Map<string, number>();
        for (const a of session.arguments) {
            if (a.parentId) {
                childCountMap.set(a.parentId, (childCountMap.get(a.parentId) || 0) + 1);
            }
        }
        for (const a of session.arguments) {
            const children = childCountMap.get(a.id) || 0;
            if (
                children >= 2 &&
                a.round <= Math.max(1, Math.floor((session.currentRound || 1) * 0.6))
            ) {
                changers.push({
                    argumentId: a.id,
                    agentName: a.agentName,
                    round: a.round,
                    impact: children >= 3 ? 'shifted_focus' : 'deepened',
                    description: `${a.agentName}'s argument in round ${a.round} triggered ${children} direct responses`,
                });
            }
        }

        // Dedup by argumentId, keep first occurrence
        const seen = new Set<string>();
        return changers
            .filter((c) => {
                if (seen.has(c.argumentId)) return false;
                seen.add(c.argumentId);
                return true;
            })
            .slice(0, 5);
    }

    private analyzeConstraintCorrelation(session: DebateSession): ConstraintCorrelation {
        const byConstraint: Record<
            string,
            {
                depths: number[];
                confidences: number[];
                challenges: number;
                compliance: number[];
                count: number;
            }
        > = {};

        for (const a of session.arguments) {
            const p = session.participants.find((pp) => pp.id === a.agentId);
            if (!p?.constraint || p.constraint === 'none') continue;
            const key = p.constraint;
            if (!byConstraint[key])
                byConstraint[key] = {
                    depths: [],
                    confidences: [],
                    challenges: 0,
                    compliance: [],
                    count: 0,
                };
            byConstraint[key].count++;

            // Depth: walk parent chain
            if (session.strategy === 'argument_tree' && a.parentId) {
                let depth = 1;
                let current: DebateArgument | undefined = a;
                const visited = new Set<string>();
                while (current?.parentId && session.strategy === 'argument_tree') {
                    if (visited.has(current.id)) break;
                    visited.add(current.id);
                    current = session.arguments.find((pa) => pa.id === current!.parentId);
                    if (current) depth++;
                }
                byConstraint[key].depths.push(depth);
            }

            byConstraint[key].confidences.push(a.confidence);

            // Challenge: position differs from parent
            if (a.parentId) {
                const parent = session.arguments.find((pa) => pa.id === a.parentId);
                if (parent && parent.position !== a.position) byConstraint[key].challenges++;
            }

            // Rough compliance heuristic: penalty for speculation markers
            const lower = a.content.toLowerCase();
            const speculation = ['maybe', 'perhaps', 'likely', 'probably', 'possibly'].filter((w) =>
                lower.includes(w),
            ).length;
            byConstraint[key].compliance.push(Math.max(0, 1 - speculation * 0.2));
        }

        const result: Record<
            string,
            {
                avgDepth: number;
                avgConfidence: number;
                challengeRate: number;
                compliance: number;
                count: number;
            }
        > = {};
        for (const [key, data] of Object.entries(byConstraint)) {
            result[key] = {
                avgDepth:
                    data.depths.length > 0
                        ? Math.round(
                              (data.depths.reduce((a, b) => a + b, 0) / data.depths.length) * 10,
                          ) / 10
                        : 0,
                avgConfidence:
                    Math.round(
                        (data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length) *
                            100,
                    ) / 100,
                challengeRate:
                    data.count > 0 ? Math.round((data.challenges / data.count) * 100) / 100 : 0,
                compliance:
                    data.compliance.length > 0
                        ? Math.round(
                              (data.compliance.reduce((a, b) => a + b, 0) /
                                  data.compliance.length) *
                                  100,
                          ) / 100
                        : 0,
                count: data.count,
            };
        }
        return { byConstraint: result };
    }

    private generateInsights(session: DebateSession): string[] {
        const insights: string[] = [];
        const args = session.arguments;
        if (args.length === 0) return ['No arguments recorded.'];

        // Convergence insight
        if (session.convergenceScore > 80) {
            insights.push(
                `High convergence (${Math.round(session.convergenceScore)}%) — agents largely agreed by the end`,
            );
        } else if (session.convergenceScore < 40) {
            insights.push(
                `Low convergence (${Math.round(session.convergenceScore)}%) — deep disagreement persisted throughout`,
            );
        } else {
            insights.push(
                `Moderate convergence (${Math.round(session.convergenceScore)}%) — partial agreement reached`,
            );
        }

        // Participation balance
        const agentRoundCounts = new Map<string, number>();
        for (const a of args) {
            agentRoundCounts.set(a.agentName, (agentRoundCounts.get(a.agentName) || 0) + 1);
        }
        const counts = [...agentRoundCounts.values()];
        const maxC = Math.max(...counts);
        const minC = Math.min(...counts);
        if (maxC - minC <= 1 && counts.length > 1) {
            insights.push('Perfectly balanced participation across all agents');
        } else if (maxC - minC > 2) {
            const mostActive = [...agentRoundCounts.entries()].find(([, c]) => c === maxC)?.[0];
            const leastActive = [...agentRoundCounts.entries()].find(([, c]) => c === minC)?.[0];
            if (mostActive && leastActive) {
                insights.push(
                    `Imbalanced participation: "${mostActive}" dominated (${maxC} arguments) vs "${leastActive}" (${minC})`,
                );
            }
        }

        // Role balance
        const pros = args.filter((a) => a.position === 'pro').length;
        const cons = args.filter((a) => a.position === 'con').length;
        const total = pros + cons;
        if (total > 0) {
            const ratio = pros / total;
            if (ratio > 0.7) insights.push('Heavily pro-leaning — con arguments were sparse');
            else if (ratio < 0.3) insights.push('Heavily con-leaning — pro arguments were sparse');
            else insights.push('Well-balanced pro/con distribution');
        }

        // Graph insights
        const gm = session.graphMetrics;
        if (gm) {
            if (gm.branchingFactor > 2)
                insights.push(
                    `High branching factor (${gm.branchingFactor.toFixed(1)}) — arguments generated diverse sub-debates`,
                );
            if (gm.orphanRate > 0.3)
                insights.push(
                    `High orphan rate (${(gm.orphanRate * 100).toFixed(0)}%) — many arguments failed to attach to the tree; parser or agent discipline issue`,
                );
            if (gm.challengeDensity > 0.5)
                insights.push(
                    `Challenge-dominant debate (${(gm.challengeDensity * 100).toFixed(0)}% cross-position) — agents primarily contradicted each other`,
                );
            if (gm.refinementDensity > 0.5)
                insights.push(
                    `Refinement-dominant debate (${(gm.refinementDensity * 100).toFixed(0)}% same-position) — agents built on each other's ideas`,
                );
            if (gm.maxDepth >= 4)
                insights.push(
                    `Deep reasoning chains (max depth ${gm.maxDepth}) — some arguments were explored ${gm.maxDepth} levels deep`,
                );
        }

        // Constraint insights
        if (session.strategy === 'constrained') {
            const withConstraint = session.participants.filter(
                (p) => p.constraint && p.constraint !== 'none',
            );
            if (withConstraint.length > 0) {
                insights.push(
                    `Constrained debate with ${withConstraint.length} unique constraints — agents operated under different reasoning restrictions`,
                );
            }
        }

        return insights;
    }

    private generateSummary(session: DebateSession): string {
        const args = session.arguments;
        const pros = args.filter((a) => a.position === 'pro').length;
        const cons = args.filter((a) => a.position === 'con').length;
        const totalRounds = Math.max(...args.map((a) => a.round), 1);
        const gm = session.graphMetrics;

        let summary = `${session.participants.length} agents debated "${session.topic}" over ${totalRounds} rounds (${args.length} total arguments). `;
        summary += `Pro: ${pros}, Con: ${cons}. `;
        summary += `Convergence: ${Math.round(session.convergenceScore)}%. `;

        if (session.strategy === 'socratic')
            summary += 'Socratic method — questioners rotated each round. ';
        if (session.strategy === 'argument_tree')
            summary += 'Argument tree — hierarchical structure. ';
        if (session.strategy === 'constrained') {
            const constraints = [
                ...new Set(
                    session.participants
                        .filter((p) => p.constraint && p.constraint !== 'none')
                        .map((p) => p.constraint),
                ),
            ];
            summary += `Constrained by: ${constraints.join(', ')}. `;
        }
        if (gm)
            summary += `Max reasoning depth: ${gm.maxDepth}, branching: ${gm.branchingFactor.toFixed(1)}. `;

        return summary.trim();
    }
}
export type DebateInsight = string;
export type { DebateInterpretation } from '../../contracts/debate-types';
