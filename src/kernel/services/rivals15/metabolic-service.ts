import type { DataAccessLayer } from '../../dal/types';
import type { IEventBus } from '../../types/interfaces';
import type { IMetabolicService } from '../../contracts/rivals15';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
const LOGGER = rootLogger.child('Metabolic');
// Сеченов → Павлов → Ухтомский → Бернштейн → Лурия → Бехтерева — без обучения, чистая динамика
export class MetabolicService implements IMetabolicService {
    constructor(private dal: DataAccessLayer, private events: IEventBus) {}
    async init(){ LOGGER.info('Metabolic', 'init',{}); } async destroy(){}
    async setDominant(goal: string){ await this.dal.kv.set('metabolic/dominant', goal.slice(0,200)); }
    async dominantFocus(){ return (await this.dal.kv.get<string>('metabolic/dominant')) ?? 'explore'; }
    async tick(signal: string, intensity=0.5){
        const dominant=await this.dominantFocus();
        // Ухтомский: доминанта усиливает свой сигнал, тормозит остальные
        const isDominant=signal.toLowerCase().includes(dominant.toLowerCase());
        const excitation=isDominant ? intensity*1.5 : intensity*0.5;
        // Бернштейн уровни A-E: выбираем уровень по интенсивности
        const level=excitation>0.8?'E:символический':excitation>0.6?'D:предметный':excitation>0.4?'C:пространственный':excitation>0.2?'B:синергии':'A:тонус';
        // Лурия блоки: 1-тонус, 2-приём, 3-программирование — маппим на линзы
        const block=level.startsWith('A')?'блок1-тонус':level.startsWith('B')?'блок2-приём':'блок3-программирование';
        const action=isDominant?`доминанта ${dominant}: усилить ${signal.slice(0,80)} (${level}, ${block})`:`торможение ${signal.slice(0,80)} — доминанта ${dominant} сильнее`;
        const key=`metabolic/ticks/${Date.now()}`; await this.dal.kv.set(key, { signal, intensity, excitation, level, action, at: Date.now() });
        this.events.emit(EVENTS.METABOLIC_TICK, { dominant, level } as never);
        return { action, dominant };
    }
}
