/**
 * AssistantExamService — the self-check gate.
 *
 * An assistant that says "it works" must have watched it work. The exam
 * answers one question: may the assistant claim this capability?
 *
 * The rules are strict on purpose:
 *   - `verified`   — it was executed and observed: the claim is allowed.
 *   - `discovered` — the implementation exists, but nobody ran it here: the
 *     assistant may describe it, but must say it was not executed.
 *   - `declared`   — only the documentation mentions it: the claim is not
 *     allowed at all, the assistant must check it first.
 *
 * Read-only capabilities are examined by running them — that is what raises
 * them to `verified`. Write capabilities are never run by the exam: they go
 * through the normal permission flow, where the human decides.
 */
import type { AssistantExamVerdict } from '../../contracts/assistant';
import type { CapabilityTrustService } from '../capability-trust/capability-trust-service';
import type { AssistantActionRegistry } from './assistant-action-registry';
import type { AssistantAction } from '../../contracts/assistant';

export interface AssistantExamDeps {
    trust: CapabilityTrustService;
    actions: AssistantActionRegistry;
}

export class AssistantExamService {
    constructor(private readonly deps: AssistantExamDeps) {}

    /**
     * Examine a capability.
     *
     * @param capabilityId `action:ui.openPanel`, `panel:memory` or a plain
     *                     action id (`ui.openPanel`).
     * @param probeArgs   arguments for the read-only probe, when the
     *                     capability is an action that can be run safely.
     */
    async examine(
        capabilityId: string,
        probeArgs: Record<string, unknown> = {},
    ): Promise<AssistantExamVerdict> {
        const actionId = this.resolveActionId(capabilityId);
        const action = actionId ? this.deps.actions.get(actionId) : null;

        if (!action) {
            const record = this.deps.trust.get(capabilityId);
            if (!record) {
                return {
                    capabilityId,
                    passed: false,
                    level: 'declared',
                    evidence: [],
                    reason: `Unknown capability: ${capabilityId}`,
                    nextStep: 'find the capability with system.find or system.capabilities',
                };
            }
            return this.verdictForRecord(record.id, record.trust, record.evidence, record.stale);
        }

        const record = this.deps.trust.get(`action:${action.id}`);
        const level = record?.trust ?? 'discovered';
        const evidence = record?.evidence ?? [];

        // A safe capability is examined by running it: that is the proof.
        if (level !== 'verified' && this.isSafeToProbe(action)) {
            const result = await this.deps.actions.run(action.id, probeArgs);
            if (result.ok) {
                const updated = this.deps.trust.get(`action:${action.id}`);
                return {
                    capabilityId: `action:${action.id}`,
                    passed: true,
                    level: updated?.trust ?? 'verified',
                    evidence: updated?.evidence ?? [result.detail],
                    reason: 'Exam passed: the capability was executed and the result observed.',
                    nextStep: '',
                };
            }
            return {
                capabilityId: `action:${action.id}`,
                passed: false,
                level,
                evidence: [...evidence, `probe failed: ${result.detail}`],
                reason: `The exam failed: ${result.detail}`,
                nextStep: 'fix the failure or answer that this capability does not work',
            };
        }

        return this.verdictForRecord(
            `action:${action.id}`,
            level,
            evidence,
            record?.stale ?? false,
            action,
        );
    }

    /**
     * Examine every read-only action that can run without arguments.
     *
     * This is the checkup an operator asks for: "is the system actually
     * working right now?" Each action runs once, so a pass is observed
     * behaviour, not a guess. Actions that need input and all writes are
     * skipped — the sweep never triggers a permission prompt or a change.
     */
    async sweep(): Promise<{
        checked: number;
        passed: number;
        failed: number;
        skipped: number;
        verdicts: AssistantExamVerdict[];
    }> {
        const verdicts: AssistantExamVerdict[] = [];
        let skipped = 0;
        for (const action of this.deps.actions.list()) {
            if (action.id === 'system.checkup' || !this.isSafeToProbe(action)) {
                skipped += 1;
                continue;
            }
            const required = action.parameters['required'];
            if (Array.isArray(required) && required.length > 0) {
                skipped += 1;
                continue;
            }
            verdicts.push(await this.examine(action.id));
        }
        const passed = verdicts.filter((v) => v.passed).length;
        return {
            checked: verdicts.length,
            passed,
            failed: verdicts.length - passed,
            skipped,
            verdicts,
        };
    }

    /** A short instruction for the assistant prompt. */
    rule(): string {
        return (
            'Before claiming that something works, examine it (system.exam). ' +
            'A capability is only claimable when the exam passes; ' +
            'otherwise say what is known and what is not.'
        );
    }

    private verdictForRecord(
        capabilityId: string,
        level: 'declared' | 'discovered' | 'verified',
        evidence: string[],
        stale: boolean,
        action?: AssistantAction,
    ): AssistantExamVerdict {
        if (stale) {
            return {
                capabilityId,
                passed: false,
                level,
                evidence,
                reason: 'The capability was verified before, but it is stale now.',
                nextStep: 'run it again to confirm it still works',
            };
        }
        if (level === 'verified') {
            return {
                capabilityId,
                passed: true,
                level,
                evidence,
                reason: 'Exam passed: the capability was executed and the result observed.',
                nextStep: '',
            };
        }
        if (level === 'discovered') {
            return {
                capabilityId,
                passed: false,
                level,
                evidence,
                reason: 'The implementation exists, but it was not executed in this session.',
                nextStep: action
                    ? `execute ${action.id} to verify it, or describe it as implemented but untested`
                    : 'execute it to verify, or describe it as implemented but untested',
            };
        }
        return {
            capabilityId,
            passed: false,
            level,
            evidence,
            reason: 'Only the documentation mentions this capability.',
            nextStep: 'find the implementation first (system.find), then run it',
        };
    }

    private isSafeToProbe(action: AssistantAction): boolean {
        return action.action === 'tool:read' || action.action === 'tool:memory';
    }

    private resolveActionId(capabilityId: string): string | null {
        if (capabilityId.startsWith('action:')) {
            const id = capabilityId.slice('action:'.length);
            return this.deps.actions.get(id) ? id : null;
        }
        return this.deps.actions.get(capabilityId) ? capabilityId : null;
    }
}
