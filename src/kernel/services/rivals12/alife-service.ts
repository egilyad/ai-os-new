import type { DataAccessLayer } from '../../dal/types';
import type { IALifeService } from '../../contracts/rivals12';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('ALife');
export class ALifeService implements IALifeService {
    constructor(private dal: DataAccessLayer) {}
    async init(){ LOGGER.info('ALife', 'init',{}); } async destroy(){}
    async seed(genome: string){
        const id = genId('life');
        await this.dal.kv.set(`alife/${id}`, { id, genome: genome.slice(0,500), fitness: genome.length % 10 });
        return id;
    }
    async tick(steps = 1){
        const rows = await this.dal.kv.list('alife/');
        let pop = rows.map(r=>r.value as {id:string;genome:string;fitness:number});
        for (let s=0;s<Math.max(1,Math.min(20,steps));s++){
            const next: typeof pop = [];
            for (const org of pop){
                // replicate with 10% mutation
                if (Math.random()<0.6) {
                    let g = org.genome;
                    if (Math.random()<0.1) g = g.slice(0, Math.floor(Math.random()*g.length)) + String.fromCharCode(97+Math.floor(Math.random()*26)) + g.slice(Math.floor(Math.random()*g.length));
                    const fitness = g.length % 13;
                    const id = genId('life');
                    next.push({ id, genome: g.slice(0,500), fitness });
                    await this.dal.kv.set(`alife/${id}`, next[next.length-1]);
                }
            }
            pop = [...pop, ...next];
            // selection: keep top 50
            pop.sort((a,b)=>b.fitness-a.fitness);
            if (pop.length>50){
                for (const loser of pop.slice(50)) await this.dal.kv.delete(`alife/${loser.id}`);
                pop = pop.slice(0,50);
            }
        }
        return pop.map(p=>({ id:p.id, genome:p.genome, fitness:p.fitness })).slice(0,20);
    }
}
