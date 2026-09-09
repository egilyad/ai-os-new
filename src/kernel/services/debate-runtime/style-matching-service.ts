import type { IStyleMatchingService, StyleProfile } from '../../contracts/debate-style-matching';
export class StyleMatchingService implements IStyleMatchingService {
    match(t: string): StyleProfile {
        const formal=(t.match(/\b(therefore|however|moreover|consequently|furthermore)\b/gi)||[]).length;
        const emotive=(t.match(/!|\b(amazing|terrible|love|hate)\b/gi)||[]).length;
        const total=Math.max(1,formal+emotive);
        return { formal: formal/total, emotive: emotive/total };
    }
}
