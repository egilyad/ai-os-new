import type { DataAccessLayer } from '../../dal/types';
import type { IHelixService } from '../../contracts/rivals16';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Helix');
export class HelixService implements IHelixService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('Helix', 'init',{}); } async destroy(){}
    async addOnto(term: string, rel: string){ await this.dal.kv.set(`helix-onto/${term}/${rel}`, { at: Date.now() }); }
    async gaps(){
        const rows=await this.dal.kv.list('helix-onto/');
        if (rows.length<2) return ['gap: sparse ontology — need more terms'];
        return rows.slice(0,5).map(r=>`gap near ${r.id}`);
    }
}
