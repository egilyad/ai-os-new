import type {} from '../../contracts/debate-strategist';
export class StrategistService {
    advise(topic: string, round: number): string {
        if (round<2) return `Probe: ask clarifying about ${topic.slice(0,30)}`;
        if (round<4) return `Attack: target weakest claim on ${topic.slice(0,30)}`;
        return `Synthesize: combine best points`;
    }
}
