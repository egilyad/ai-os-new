import type {
    IBestOfNSelector,
    BestOfNResult,
    VariantScore,
    LlmCallFn,
} from '../../contracts/debate-best-of-n';

const TEMPERATURES = [0.3, 0.5, 0.7, 0.4, 0.6];
const NOVELTY_KEYWORDS = [
    /\b(unprecedented|novel|unique|fresh)\b/i,
    /\b(alternative|different|another|instead)\b/i,
    /\b(contrary|opposing|counter.?intuitive)\b/i,
    /\b(surprising|unexpected|rarely|seldom)\b/i,
];

export class BestOfNSelector implements IBestOfNSelector {
    async selectBest(
        generateVariant: LlmCallFn,
        basePrompt: string,
        n: number = 3,
    ): Promise<BestOfNResult> {
        const count = Math.min(n, TEMPERATURES.length);
        const variants: VariantScore[] = [];

        for (let i = 0; i < count; i++) {
            try {
                const content = await generateVariant(basePrompt, TEMPERATURES[i]);
                if (content.length < 10) continue;
                const noveltyScore = this.scoreNovelty(content);
                const rebuttalScore = this.scoreRebuttalStrength(content);
                variants.push({
                    variantIndex: i,
                    temperature: TEMPERATURES[i]!,
                    content,
                    noveltyScore,
                    rebuttalStrength: rebuttalScore,
                    overallScore: noveltyScore * 0.5 + rebuttalScore * 0.5,
                });
            } catch {
                continue;
            }
        }

        if (variants.length === 0) {
            return {
                variants: [],
                selectedIndex: 0,
                selectedContent: '',
                improvementRatio: 0,
            };
        }

        variants.sort((a, b) => b.overallScore - a.overallScore);
        const best = variants[0]!;
        const avgScore = variants.reduce((s, v) => s + v.overallScore, 0) / variants.length;

        return {
            variants,
            selectedIndex: best.variantIndex,
            selectedContent: best.content,
            improvementRatio: avgScore > 0 ? (best.overallScore - avgScore) / avgScore : 0,
        };
    }

    private scoreNovelty(content: string): number {
        let score = 0.3;
        for (const keyword of NOVELTY_KEYWORDS) {
            if (keyword.test(content)) score += 0.1;
        }
        const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
        const totalWords = content.split(/\s+/).length;
        score += (uniqueWords / Math.max(1, totalWords)) * 0.2;
        return Math.min(1, score);
    }

    private scoreRebuttalStrength(content: string): number {
        let score = 0.3;
        if (content.length > 200) score += 0.1;
        if (content.length > 500) score += 0.1;
        if (/\b(because|therefore|thus|hence|consequently)\b/i.test(content)) score += 0.1;
        if (/\b(however|but|although|nevertheless|yet)\b/i.test(content)) score += 0.1;
        if (/\b(evidence|data|study|research|shows)\b/i.test(content)) score += 0.1;
        if (/\b(contradicts|undermines|refutes|invalidates|challenges)\b/i.test(content))
            score += 0.1;
        return Math.min(1, score);
    }
}
