import type { IAllianceService, Alliance } from '../../contracts/debate-alliance';
export class AllianceService implements IAllianceService {
    form(ids: string[], topic: string): Alliance | null {
        if (ids.length<2) return null;
        return { members: ids.slice(0,2), strength: topic.length>10?0.7:0.4 };
    }
}
