/**
 * Workflow memory (CAMEL-inspired, H3).
 *
 * Stores successful task decompositions and reuses them for similar goals via
 * token-overlap matching. Reusing a plan avoids a fresh LLM decomposition call.
 */
import type { IWorkflowMemoryService, WorkflowTemplate } from '../../contracts/workflow-memory';

let seq = 0;

function tokens(s: string): Set<string> {
    return new Set(
        s
            .toLowerCase()
            .split(/[^\p{L}\p{N}]+/u)
            .filter((t) => t.length > 2),
    );
}

export class WorkflowMemoryService implements IWorkflowMemoryService {
    private templates: WorkflowTemplate[] = [];

    remember(goal: string, steps: string[]): WorkflowTemplate {
        const t: WorkflowTemplate = {
            id: `wf-${Date.now()}-${++seq}`,
            goalPattern: goal.slice(0, 200),
            steps: [...steps],
            uses: 0,
            createdAt: Date.now(),
        };
        this.templates.push(t);
        return t;
    }

    recall(goal: string): WorkflowTemplate | null {
        const q = tokens(goal);
        if (q.size === 0) return null;
        let best: WorkflowTemplate | null = null;
        let bestScore = 0;
        for (const t of this.templates) {
            const tt = tokens(t.goalPattern);
            let hits = 0;
            for (const word of q) if (tt.has(word)) hits++;
            const score = hits / Math.max(1, Math.min(q.size, tt.size));
            if (score > bestScore) {
                bestScore = score;
                best = t;
            }
        }
        if (best && bestScore >= 0.6) {
            best.uses += 1;
            return best;
        }
        return null;
    }

    list(): WorkflowTemplate[] {
        return [...this.templates];
    }
}
