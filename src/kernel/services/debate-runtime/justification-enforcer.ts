// ── JustificationEnforcer (P1.23) ──────────────────────────────────────────
// Heuristic multi-hop reasoning validator. Detects claim→warrant→evidence
// chains in argument text using structural markers.

import type {
    IJustificationEnforcer,
    JustificationChain,
    JustificationHop,
} from '../../contracts/debate-justification';

const CLAIM_MARKERS = [
    /i (argue|contend|maintain|assert|believe|think|submit|hold|claim)/i,
    /the (point|argument|claim|position) (is|that)/i,
    /my (position|argument|view|stance) (is|that)/i,
    /what i'm saying is/i,
    /the truth is/i,
    /it is (clear|evident|apparent) that/i,
    /я (утверждаю|считаю|полагаю|думаю|настаиваю|заявляю)/i,
    /(мой|моя|моё)\s+(аргумент|позиция|тезис|мнение|точка\s+зрения)/i,
    /суть (в том|моего аргумента)/i,
];

const WARRANT_MARKERS = [
    /because|since|as|for|given that|insofar as|потому что|так как|поскольку|ибо/i,
];

const EVIDENCE_MARKERS = [
    /(stud|research|data|survey|experiment|analysis|report|study|investigation)/i,
    /according to|as shown by|as demonstrated by|as evidenced by/i,
    /согласно|как показыва|как свидетельств|исследовани|данные|статистик/i,
    /\d{4}/, // year reference (potential citation)
    /\d+\.?\d*\s*%/, // percentage
    /figure[s]?\s+show|table\s+\d+|fig/i,
];

const BACKING_MARKERS = [
    /furthermore|moreover|in addition|additionally|besides|also|similarly|however|nevertheless|on the other hand|in contrast|more importantly/i,
    /кроме того|более того|помимо этого|с другой стороны|однако|тем не менее/i,
];

export const DEFAULT_MIN_HOPS = 2;

export class JustificationEnforcer implements IJustificationEnforcer {
    private chains = new Map<string, JustificationChain>();

    analyzeArgument(
        agentId: string,
        round: number,
        content: string,
        minHops = DEFAULT_MIN_HOPS,
    ): JustificationChain {
        const sentences = content
            .split(/[.!?\n]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 15);

        const hops: Array<{ type: JustificationHop; text: string }> = [];
        const foundTypes = new Set<JustificationHop>();

        for (const s of sentences) {
            if (!foundTypes.has('claim') && this.matchesAny(s, CLAIM_MARKERS)) {
                hops.push({ type: 'claim', text: s.slice(0, 200) });
                foundTypes.add('claim');
            } else if (!foundTypes.has('warrant') && this.matchesAny(s, WARRANT_MARKERS)) {
                hops.push({ type: 'warrant', text: s.slice(0, 200) });
                foundTypes.add('warrant');
            } else if (!foundTypes.has('evidence') && this.matchesAny(s, EVIDENCE_MARKERS)) {
                hops.push({ type: 'evidence', text: s.slice(0, 200) });
                foundTypes.add('evidence');
            } else if (!foundTypes.has('backing') && this.matchesAny(s, BACKING_MARKERS)) {
                hops.push({ type: 'backing', text: s.slice(0, 200) });
                foundTypes.add('backing');
            }
        }

        const allTypes: JustificationHop[] = ['claim', 'warrant', 'evidence', 'backing'];
        const missingTypes = allTypes.filter((t) => !foundTypes.has(t));

        const chain: JustificationChain = {
            agentId,
            round,
            hopCount: hops.length,
            hops,
            isValid: hops.length >= minHops,
            missingTypes,
        };

        this.chains.set(`${agentId}:${round}`, chain);
        return chain;
    }

    getChain(agentId: string, round: number): JustificationChain | undefined {
        return this.chains.get(`${agentId}:${round}`);
    }

    clearSession(): void {
        this.chains.clear();
    }

    private matchesAny(text: string, patterns: RegExp[]): boolean {
        return patterns.some((p) => p.test(text));
    }
}
