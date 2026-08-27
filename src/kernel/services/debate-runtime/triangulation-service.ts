import type { ITriangulationService, TriangulationCheck } from '../../contracts/debate-triangulation';
export class TriangulationService implements ITriangulationService {
    check(sources: string[]): TriangulationCheck {
        const types = new Set(sources.map(s => s.includes('nature')||s.includes('arxiv')?'academic':s.includes('reuters')?'news':'other'));
        return { sourceCount: sources.length, isTriangulated: sources.length>=2 && types.size>=2, confidence: Math.min(1, types.size/3) };
    }
}
