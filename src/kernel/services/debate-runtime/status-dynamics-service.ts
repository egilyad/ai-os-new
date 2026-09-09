import type { IStatusDynamicsService, StatusLevel } from '../../contracts/debate-status-dynamics';
export class StatusDynamicsService implements IStatusDynamicsService {
    assign(ids: string[]): StatusLevel[] { return ids.map((id,i)=>({ agentId:id, level: (ids.length - i)/ids.length })); }
}
