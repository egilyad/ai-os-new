import type {
    IEvidenceTriangulationService,
    TriangulationResult,
} from '../../contracts/debate-evidence-triangulation';

/**
 * EvidenceTriangulationService — P0
 * Scores triangulation by source type diversity.
 */
export class EvidenceTriangulationService implements IEvidenceTriangulationService {
    private classify(source: string): string {
        const s = source.toLowerCase();
        if (/\.edu|\.gov|doi\.org|pubmed|arxiv|nature|science/.test(s)) return 'academic';
        if (/reuters|bbc|nytimes|economist|bloomberg|guardian/.test(s)) return 'news';
        if (/study|research|report|survey|data\.gov|census/.test(s)) return 'data';
        if (/expert|official|statement|interview/.test(s)) return 'expert';
        return 'other';
    }

    checkTriangulation(claimText: string, sources: string[]): TriangulationResult {
        const types = new Set(sources.map((s) => this.classify(s)));
        const diverseTypes = types.size;
        const score = Math.min(1, diverseTypes / 3);
        return {
            claimText: claimText.slice(0, 200),
            sourceCount: sources.length,
            diverseTypes,
            isTriangulated: diverseTypes >= 2 && sources.length >= 2,
            score,
        };
    }

    isSufficientlySupported(sources: string[]): boolean {
        return this.checkTriangulation('', sources).isTriangulated;
    }
}
