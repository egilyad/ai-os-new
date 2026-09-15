/**
 * DebateBreakpointService — human-in-the-loop breakpoints for debates.
 *
 * Allows humans to set breakpoints at specific rounds or conditions.
 * When a breakpoint is hit, the debate pauses and the human can:
 * - Review arguments so far
 * - Provide feedback/instructions for the next round
 * - Steer the debate direction
 * - Skip to a specific round
 *
 * Works with the existing DebateSyncManager pause/resume infrastructure.
 */
import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('DebateBreakpoint');

export type BreakpointTrigger = 'round_end' | 'argument_count' | 'consensus_change' | 'quality_drop';

export interface DebateBreakpoint {
    readonly id: string;
    readonly sessionId: string;
    readonly trigger: BreakpointTrigger;
    readonly condition: {
        readonly round?: number;
        readonly argumentCount?: number;
        readonly consensusDelta?: number;
        readonly qualityThreshold?: number;
    };
    readonly instruction?: string;
    readonly enabled: boolean;
    readonly createdAt: number;
}

export interface BreakpointHit {
    readonly breakpointId: string;
    readonly sessionId: string;
    readonly trigger: BreakpointTrigger;
    readonly round: number;
    readonly argumentCount: number;
    readonly hitAt: number;
}

export interface HumanFeedback {
    readonly breakpointId: string;
    readonly sessionId: string;
    readonly instruction: string;
    readonly steerTo?: string;
    readonly skipToRound?: number;
    readonly suppressAgents?: string[];
    readonly boostAgents?: string[];
    readonly appliedAt: number;
}

interface BreakpointServiceDeps {
    eventBus: IEventBus;
}

export class DebateBreakpointService {
    private breakpoints = new Map<string, DebateBreakpoint>();
    private hits: BreakpointHit[] = [];
    private feedback: HumanFeedback[] = [];
    private _idCounter = 0;

    constructor(_deps: BreakpointServiceDeps) {
    }

    setBreakpoint(
        sessionId: string,
        trigger: BreakpointTrigger,
        condition: DebateBreakpoint['condition'],
        instruction?: string,
    ): DebateBreakpoint {
        const id = `bp-${sessionId}-${++this._idCounter}`;
        const bp: DebateBreakpoint = {
            id,
            sessionId,
            trigger,
            condition,
            instruction,
            enabled: true,
            createdAt: Date.now(),
        };
        this.breakpoints.set(id, bp);
        LOGGER.info('Breakpoint set', { id, sessionId, trigger, condition });
        return bp;
    }

    removeBreakpoint(id: string): boolean {
        return this.breakpoints.delete(id);
    }

    getSessionBreakpoints(sessionId: string): DebateBreakpoint[] {
        return [...this.breakpoints.values()].filter((bp) => bp.sessionId === sessionId);
    }

    checkBreakpoints(
        sessionId: string,
        trigger: BreakpointTrigger,
        round: number,
        argumentCount: number,
        consensusScore?: number,
        qualityScore?: number,
    ): DebateBreakpoint | null {
        const candidates = [...this.breakpoints.values()].filter(
            (bp) => bp.sessionId === sessionId && bp.trigger === trigger && bp.enabled,
        );

        for (const bp of candidates) {
            if (this.matchesCondition(bp, round, argumentCount, consensusScore, qualityScore)) {
                const hit: BreakpointHit = {
                    breakpointId: bp.id,
                    sessionId,
                    trigger,
                    round,
                    argumentCount,
                    hitAt: Date.now(),
                };
                this.hits.push(hit);
                LOGGER.info('Breakpoint hit', { id: bp.id, trigger, round });
                return bp;
            }
        }
        return null;
    }

    private matchesCondition(
        bp: DebateBreakpoint,
        round: number,
        argumentCount: number,
        consensusScore?: number,
        qualityScore?: number,
    ): boolean {
        const c = bp.condition;
        if (c.round !== undefined && round < c.round) return false;
        if (c.argumentCount !== undefined && argumentCount < c.argumentCount) return false;
        if (c.consensusDelta !== undefined && consensusScore !== undefined) {
            if (Math.abs(consensusScore) < c.consensusDelta) return false;
        }
        if (c.qualityThreshold !== undefined && qualityScore !== undefined) {
            if (qualityScore > c.qualityThreshold) return false;
        }
        return true;
    }

    applyFeedback(feedback: Omit<HumanFeedback, 'appliedAt'>): HumanFeedback {
        const full: HumanFeedback = { ...feedback, appliedAt: Date.now() };
        this.feedback.push(full);
        LOGGER.info('Human feedback applied', {
            breakpointId: feedback.breakpointId,
            sessionId: feedback.sessionId,
            hasSteer: !!feedback.steerTo,
            hasSkip: feedback.skipToRound !== undefined,
        });
        return full;
    }

    getLatestFeedback(sessionId: string): HumanFeedback | undefined {
        const sessionFeedback = this.feedback.filter((f) => f.sessionId === sessionId);
        return sessionFeedback[sessionFeedback.length - 1];
    }

    getFeedbackHistory(sessionId: string): HumanFeedback[] {
        return this.feedback.filter((f) => f.sessionId === sessionId);
    }

    formatBreakpointContext(sessionId: string): string {
        const feedback = this.getLatestFeedback(sessionId);
        if (!feedback) return '';
        const lines = ['## Human Instruction (breakpoint)'];
        lines.push(feedback.instruction);
        if (feedback.steerTo) lines.push(`Focus on: ${feedback.steerTo}`);
        if (feedback.suppressAgents?.length) {
            lines.push(`Reduce input from: ${feedback.suppressAgents.join(', ')}`);
        }
        if (feedback.boostAgents?.length) {
            lines.push(`Amplify input from: ${feedback.boostAgents.join(', ')}`);
        }
        return lines.join('\n');
    }

    cleanup(sessionId: string): void {
        for (const [id, bp] of this.breakpoints) {
            if (bp.sessionId === sessionId) this.breakpoints.delete(id);
        }
        this.hits = this.hits.filter((h) => h.sessionId !== sessionId);
        this.feedback = this.feedback.filter((f) => f.sessionId !== sessionId);
    }
}
