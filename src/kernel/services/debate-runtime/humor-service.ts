import type { IHumorService, HumorInsert } from '../../contracts/debate-humor';
export class HumorService implements IHumorService {
    inject(topic: string): HumorInsert | null {
        if (!topic||topic.length<5) return null;
        return { text: `As the saying goes about "${topic.slice(0,30)}" — even a broken clock is right twice a day`, type: 'wit' };
    }
}
