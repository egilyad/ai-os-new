/**
 * Tool availability probe.
 *
 * Ported from the Hermes Agent `check_fn`: a tool may be temporarily
 * unreachable (a dead MCP server, a missing binary). The probe result is
 * cached for a TTL and a failed probe keeps the last known good answer for a
 * grace window, so a flaky dependency never silently strips a whole toolset
 * mid-turn.
 */

export interface ToolAvailabilityOptions {
    /** How long a probe result stays fresh (default 30s). */
    ttlMs?: number;
    /** How long a failing probe keeps the last known good answer (default 60s). */
    graceMs?: number;
}

interface ProbeState {
    lastCheckedAt: number;
    lastGoodAt: number;
    available: boolean;
}

export class ToolAvailabilityRegistry {
    private probes = new Map<
        string,
        { check: () => Promise<boolean>; options: Required<ToolAvailabilityOptions> }
    >();
    private states = new Map<string, ProbeState>();

    register(
        toolId: string,
        check: () => Promise<boolean>,
        options: ToolAvailabilityOptions = {},
    ): void {
        this.probes.set(toolId, {
            check,
            options: {
                ttlMs: options.ttlMs ?? 30_000,
                graceMs: options.graceMs ?? 60_000,
            },
        });
    }

    unregister(toolId: string): void {
        this.probes.delete(toolId);
        this.states.delete(toolId);
    }

    list(): string[] {
        return [...this.probes.keys()];
    }

    /**
     * Resolve whether a tool is currently reachable.
     *
     * A fresh cached answer is returned directly. When the probe fails and the
     * last good answer is still inside the grace window, the tool stays
     * available — a transient outage must not disarm the agent.
     */
    async isAvailable(toolId: string): Promise<boolean> {
        const probe = this.probes.get(toolId);
        if (!probe) return true;
        const now = Date.now();
        const state = this.states.get(toolId);

        if (state && now - state.lastCheckedAt < probe.options.ttlMs) {
            return state.available;
        }

        try {
            const available = await probe.check();
            this.states.set(toolId, { lastCheckedAt: now, lastGoodAt: now, available });
            return available;
        } catch {
            const lastGood = state?.lastGoodAt ?? 0;
            const withinGrace = state !== undefined && now - lastGood <= probe.options.graceMs;
            const available = withinGrace ? (state?.available ?? false) : false;
            this.states.set(toolId, {
                lastCheckedAt: now,
                lastGoodAt: state?.lastGoodAt ?? 0,
                available,
            });
            return available;
        }
    }

    /** Resolve availability for many tools at once. */
    async filterAvailable(toolIds: string[]): Promise<string[]> {
        const checks = await Promise.all(
            toolIds.map(async (id) => ((await this.isAvailable(id)) ? id : null)),
        );
        return checks.filter((id): id is string => id !== null);
    }
}
