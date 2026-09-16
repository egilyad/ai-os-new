import type { DataAccessLayer } from '../../dal/types';
import type { IResearchOsService } from '../../contracts/rivals18';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('ResearchOS');
export class ResearchOsService implements IResearchOsService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async createFolder(name: string){ const id=genId('ros'); await this.dal.kv.set(`research-os/${id}`, { id, name: name.slice(0,80), files: [] as string[] }); try{ this.events?.emit(EVENTS.RESEARCHOS_FOLDER, { folder: name.slice(0,80) }); }catch{} return id; }
    async addFile(folderId: string, name: string, content: string){ const f=await this.dal.kv.get<Record<string,unknown>>(`research-os/${folderId}`); if(!f) throw new Error('folder not found'); const files=(f as Record<string,unknown>).files as string[]; files.push(`${name}:${content.slice(0,500)}`); await this.dal.kv.set(`research-os/${folderId}`, f); await this.dal.kv.set(`research-os-file/${folderId}/${name}`, content.slice(0,5000)); }
    async list(folderId: string){ const f=await this.dal.kv.get<Record<string,unknown>>(`research-os/${folderId}`); if(!f) throw new Error('folder not found'); return (f as Record<string,unknown>).files as string[]; }
}
