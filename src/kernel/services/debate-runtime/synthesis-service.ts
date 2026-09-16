import type { ISynthesisService, SynthesisResult } from '../../contracts/debate-synthesis';

export class SynthesisService implements ISynthesisService {
    synthesize(topic: string, proArguments: string[], conArguments: string[]): SynthesisResult | null {
        if (proArguments.length === 0 || conArguments.length === 0) return null;
        const thesisPoints = proArguments.slice(0, 2).map((s) => s.slice(0, 100));
        const antithesisPoints = conArguments.slice(0, 2).map((s) => s.slice(0, 100));
        return {
            thesisPoints,
            antithesisPoints,
            synthesis: `On "${topic.slice(0, 80)}", a synthesis preserves ${thesisPoints[0]?.slice(0, 40)} while incorporating ${antithesisPoints[0]?.slice(0, 40)}, rising to a higher framework.`,
            coherence: 0.72,
        };
    }
}
