import type { ISwarmService } from '../../contracts/rivals12';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Swarm');
function hash(s:string){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h; }
export class SwarmService implements ISwarmService {
    async init(){ LOGGER.info('Swarm', 'init',{}); } async destroy(){}
    async aco(nodes: string[], edges: Array<[string,string,number]>){
        if (nodes.length===0) return [];
        const pheromones = new Map<string,number>();
        for (const [a,b,c] of edges) pheromones.set(`${a}->${b}`, 1/(c||1));
        let best: string[] = []; let bestCost=Infinity;
        for (let iter=0; iter<30; iter++) {
            const path: string[] = [nodes[0] as string];
            const visited = new Set(path);
            while (path.length < nodes.length) {
                const cur = path[path.length-1] as string;
                const candidates = edges.filter(([a,b])=>a===cur && !visited.has(b));
                if (candidates.length===0) break;
                const total = candidates.reduce((s,[, ,c])=>s+(pheromones.get(`${cur}->${c}`) ?? 0.1),0);
                let r = (hash(`${iter}:${cur}`)%1000)/1000 * total;
                let pick = candidates[0] as [string,string,number];
                for (const e of candidates){ const w=pheromones.get(`${e[0]}->${e[1]}`)??0.1; if (r<w){ pick=e; break; } r-=w; }
                path.push(pick[1]); visited.add(pick[1]);
            }
            const cost = path.reduce((s,_,i)=>{ if(i===0) return 0; const e=edges.find(([a,b])=>a===path[i-1]&&b===path[i]); return s+(e?e[2]:10); },0);
            if (cost<bestCost){ bestCost=cost; best=[...path]; }
            for (let i=1;i<path.length;i++){ const k=`${path[i-1]}->${path[i]}`; pheromones.set(k, (pheromones.get(k)??0)+1/(cost||1)); }
        }
        return best.length?best:nodes.slice(0,1);
    }
    async pso(objective: string, dims = 2){
        const d = Math.max(1, Math.min(6, dims));
        // minimize sum of squares shifted by hash of objective
        const shift = (hash(objective)%100)/50 -1;
        let best = new Array(d).fill(0).map((_,i)=> shift + (i*0.3));
        let bestScore = best.reduce((s,v)=>s+v*v,0);
        const particles = Array.from({length:12}, (_,i)=>({ pos: new Array(d).fill(0).map(()=> (hash(`${i}:${objective}`)%200)/100 -1), vel: new Array(d).fill(0), pbest: new Array(d).fill(0).map(()=>0), pscore: Infinity }));
        for (let iter=0; iter<30; iter++) {
            for (const p of particles){
                const score = p.pos.reduce((s,v)=>s+(v-shift)*(v-shift),0);
                if (score < p.pscore){ p.pscore=score; p.pbest=[...p.pos]; }
                if (score < bestScore){ bestScore=score; best=[...p.pos]; }
                for (let i=0;i<d;i++){ p.vel[i] = 0.5*(p.vel[i]??0) + 0.3*(p.pbest[i]??0 - p.pos[i]??0) + 0.2*(best[i]??0 - p.pos[i]??0); p.pos[i]=(p.pos[i]??0)+ (p.vel[i]??0)*0.5; }
            }
        }
        return { best: best.map(v=>Math.round(v*100)/100), score: Math.round(bestScore*100)/100 };
    }
}
