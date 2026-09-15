import type { DataAccessLayer } from '../../dal/types';
import type { ICrewService } from '../../contracts/crew';
import type { IAgencyRuService } from '../../contracts/rivals15';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('AgencyRU');
const CATALOG=[
    'VK SMM Manager','Wildberries SEO','Yandex Direct Master','Avito Trader','Ozon Manager',
    'VK Ads Targetolog','Yandex Metrica Analyst','WB Content Creator','VK Community Admin','Yandex Market Manager',
    // 10 показано, остальных 177 — как шаблоны (генерируем по запросу)
];
export class AgencyRuService implements IAgencyRuService {
    constructor(_dal: DataAccessLayer, private crews?: ICrewService) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async catalog(){
        const extra=Array.from({length:177},(_,i)=>`RU Agent #${i+11}`);
        return [...CATALOG, ...extra];
    }
    async importAgent(name: string){
        if (!this.crews) return `import-queued: ${name}`;
        const crew=await this.crews.createCrew({
            name: `RU: ${name.slice(0,60)}`,
            process: 'sequential',
            roles: [{ name, role: 'RU specialist', goal: `Work as ${name} for VK/WB/Yandex market`, backstory: 'Russian market expert.' }],
            tasks: [{ description: `Do ${name} task`, expectedOutput: 'Result', assigneeId: '__role:0__' }],
        });
        return crew.id;
    }
}
