import type { ICriticService, CriticFeedback } from '../../contracts/debate-critic';

export class CriticService implements ICriticService {
    critique(text: string): CriticFeedback[] {
        const issues: CriticFeedback[] = [];
        if (text.length < 30) issues.push({ issue: 'too short', severity: 'medium', suggestion: 'Expand argument' });
        if (!/\d/.test(text)) issues.push({ issue: 'no evidence', severity: 'low', suggestion: 'Add data' });
        if (/always|never|everyone|nobody/i.test(text) && !/source/i.test(text)) issues.push({ issue: 'absolute without source', severity: 'high', suggestion: 'Cite source' });
        return issues;
    }
    passes(text: string): boolean {
        return !this.critique(text).some((c) => c.severity === 'high');
    }
}
