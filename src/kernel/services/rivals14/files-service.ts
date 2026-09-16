import type { DataAccessLayer } from '../../dal/types';
import type { IFilesApiService } from '../../contracts/rivals14';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('FilesApi');
export class FilesApiService implements IFilesApiService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async upload(name: string, content: string){ const id=genId('file'); await this.dal.kv.set(`files/${id}`, { id, name: name.slice(0,120), content: content.slice(0,200000) }); try{ this.events?.emit(EVENTS.FILES_UPLOADED, { fileId: id, name: name.slice(0,120) }); }catch{} return id; }
    async get(fileId: string){ const f=await this.dal.kv.get<Record<string,string>>(`files/${fileId}`); if(!f) throw new Error('file not found'); return (f as Record<string,string>).content; }
    async list(){ const rows=await this.dal.kv.list('files/'); return rows.map(r=>r.id); }
}
