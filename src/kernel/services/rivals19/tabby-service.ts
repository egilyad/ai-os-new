import type { DataAccessLayer } from '../../dal/types';
import type { ITabbyService } from '../../contracts/rivals19';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Tabby');
export class TabbyService implements ITabbyService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async registerModel(name: string){ await this.dal.kv.set(`tabby-model/${name.slice(0,80)}`, { at: Date.now() }); }
    async complete(prefix: string){
        const rows=await this.dal.kv.list('tabby-model/');
        const model=rows[0]?.id.replace('tabby-model/','') ?? 'local';
        return `${prefix} /* Tabby ${model} */`;
    }
}
