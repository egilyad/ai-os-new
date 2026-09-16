import type { DataAccessLayer } from '../../dal/types';
import type { INeuroSymbolicService } from '../../contracts/rivals12';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('NeuroSym');
export class NeuroSymbolicService implements INeuroSymbolicService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('NeuroSym', 'init',{}); } async destroy(){}
    async setPredicate(name: string, score: Record<string,number>){
        const clean: Record<string,number> = {};
        for (const [k,v] of Object.entries(score)) clean[k.slice(0,80)] = Math.max(0,Math.min(1,v));
        await this.dal.kv.set(`neuro-pred/${name.slice(0,80)}`, clean);
    }
    async addAxiom(rule: string){
        const list = (await this.dal.kv.get<string[]>('neuro-axioms')) ?? [];
        list.push(rule.slice(0,300));
        if (list.length>50) list.splice(0, list.length-50);
        await this.dal.kv.set('neuro-axioms', list);
    }
    async query(predicate: string, entity: string){
        const base = (await this.dal.kv.get<Record<string,number>>(`neuro-pred/${predicate.slice(0,80)}`)) ?? {};
        let s = base[entity] ?? 0;
        const axioms = (await this.dal.kv.get<string[]>('neuro-axioms')) ?? [];
        for (const ax of axioms) {
            // very small fuzzy: "P->Q" means if P high then Q high
            const m = ax.match(/(\w+)\s*->\s*(\w+)/);
            if (!m) continue;
            const [, from, to] = m as [string,string,string];
            if (to===predicate) {
                const fromScore = (await this.dal.kv.get<Record<string,number>>(`neuro-pred/${from}`))?.[entity] ?? 0;
                s = Math.max(s, fromScore * 0.9);
            }
        }
        return Math.round(s*100)/100;
    }
}
