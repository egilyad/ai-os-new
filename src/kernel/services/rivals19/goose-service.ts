import type { DataAccessLayer } from '../../dal/types';
import type { IGooseService } from '../../contracts/rivals19';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Goose');
export class GooseService implements IGooseService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('Goose', 'init',{}); } async destroy(){}
    async recipe(name: string, steps: string[]){ await this.dal.kv.set(`goose-recipe/${name.slice(0,80)}`, steps.slice(0,10).map(s=>s.slice(0,200))); return name.slice(0,80); }
    async runRecipe(name: string){ const steps=await this.dal.kv.get<string[]>(`goose-recipe/${name}`); if(!steps) throw new Error('recipe not found'); return `Goose recipe ${name}: ${steps.join(' → ').slice(0,500)}`; }
}
