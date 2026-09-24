import type { DataAccessLayer } from '../../dal/types';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IProjectService } from '../../contracts/rivals14';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Project');
export class ProjectService implements IProjectService {
    constructor(
        private dal: DataAccessLayer,
        private llm?: ILLMClientService,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('Project', 'init',{}); } async destroy(){}
    async createProject(name: string, instructions=''){ const id=genId('proj'); await this.dal.kv.set(`projects/${id}`, { id, name: name.slice(0,120), instructions: instructions.slice(0,2000), files: [] as string[] }); try{ this.events?.emit(EVENTS.PROJECT_CREATED_RIVALS, { projectId: id, name: name.slice(0,120) }); }catch{ /* best-effort */ } return id; }
    async addFile(projectId: string, name: string, content: string){ const p=await this.dal.kv.get<Record<string,unknown>>(`projects/${projectId}`); if(!p) throw new Error('project not found'); const files=(p as Record<string,unknown>).files as string[]; files.push(`${name}:${content.slice(0,500)}`); await this.dal.kv.set(`projects/${projectId}`, p); try{ this.events?.emit(EVENTS.PROJECT_FILE_ADDED, { projectId, name: name.slice(0,120) }); }catch{ /* best-effort */ } }
    async renderArtifact(projectId: string, prompt: string){
        const p=await this.dal.kv.get<Record<string,unknown>>(`projects/${projectId}`); if(!p) throw new Error('project not found');
        if (this.llm) { try { const r=await this.llm.chat([{role:'system',content:`Project ${(p as Record<string,string>).name}: ${(p as Record<string,string>).instructions}`},{role:'user',content:prompt.slice(0,2000)}],{temperature:0.4,maxTokens:800}); if(!r.error) return `<artifact>${r.content.slice(0,2000)}</artifact>`; } catch { /* best-effort */ } }
        return `<artifact>Project ${(p as Record<string,string>).name}: ${prompt.slice(0,200)}</artifact>`;
    }
}
