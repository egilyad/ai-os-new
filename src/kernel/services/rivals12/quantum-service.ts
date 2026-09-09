import type { DataAccessLayer } from '../../dal/types';
import type { IQuantumDeepService } from '../../contracts/rivals12';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Quantum');
export class QuantumDeepService implements IQuantumDeepService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async defineQubo(vars: string[], couplings: Array<[string,string,number]>){
        const id = genId('qubo');
        await this.dal.kv.set(`qubo/${id}`, { vars: vars.map(v=>v.slice(0,40)).slice(0,12), couplings: couplings.slice(0,30), id });
        return id;
    }
    async anneal(quboId: string, samples = 20){
        const doc = await this.dal.kv.get<{vars:string[];couplings:Array<[string,string,number]>}>(`qubo/${quboId}`);
        if (!doc) throw new Error(`QUBO not found: ${quboId}`);
        const vars = doc.vars;
        const n = vars.length;
        let best: Record<string,0|1> = {}; let bestE=Infinity;
        for (let s=0;s<Math.max(1,Math.min(100,samples));s++){
            const assign: Record<string,0|1> = {};
            for (let i=0;i<n;i++) assign[vars[i] as string] = Math.random()<0.5?0:1;
            // simple SA: 20 flips
            let energy = this.energy(assign, doc.couplings);
            for (let f=0;f<20;f++){
                const v = vars[Math.floor(Math.random()*n)] as string;
                assign[v] = assign[v]===1?0:1;
                const e2 = this.energy(assign, doc.couplings);
                if (e2 < energy || Math.random()<0.1){ energy=e2; } else { assign[v]=assign[v]===1?0:1; }
            }
            if (energy < bestE){ bestE=energy; best={...assign}; }
        }
        return { best, energy: Math.round(bestE*100)/100 };
    }
    private energy(assign: Record<string,0|1>, couplings: Array<[string,string,number]>){
        let e=0; for (const [a,b,w] of couplings) e+= (assign[a]??0)*(assign[b]??0)*w;
        return e;
    }
}
