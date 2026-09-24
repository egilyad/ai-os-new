import type { DataAccessLayer } from '../../dal/types';
import type { IGooseService } from '../../contracts/rivals19';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Goose');
export class GooseService implements IGooseService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('Goose', 'init',{}); } async destroy(){}
    async recipe(name: string, steps: string[]){ await this.dal.kv.set(`goose-recipe/${name.slice(0,80)}`, steps.slice(0,10).map(s=>s.slice(0,200))); try{ this.events?.emit(EVENTS.GOOSE_RECIPE, { name: name.slice(0,80) }); }catch{ /* best-effort */ } return name.slice(0,80); }
    async runRecipe(name: string){ const steps=await this.dal.kv.get<string[]>(`goose-recipe/${name}`); if(!steps) throw new Error('recipe not found'); return `Goose recipe ${name}: ${steps.join(' → ').slice(0,500)}`; }
}
