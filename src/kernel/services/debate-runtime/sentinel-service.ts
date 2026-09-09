import type { ISentinelService, AbandonedClaim } from '../../contracts/debate-sentinel';
export class SentinelService implements ISentinelService {
    findAbandoned(agentId: string, args: Array<{id:string;agentId:string;content:string;round:number}>): AbandonedClaim[] {
        const mine = args.filter(a=>a.agentId===agentId);
        if (mine.length<2) return [];
        const lastRound = Math.max(...args.map(a=>a.round));
        return mine.filter(a=> lastRound - a.round >=2).slice(0,3).map(a=>({ claimId:a.id, text:a.content.slice(0,100), roundsSince: lastRound - a.round }));
    }
}
