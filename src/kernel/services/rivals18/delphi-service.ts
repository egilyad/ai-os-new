import type { IDelphiService } from '../../contracts/rivals18';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Delphi');
export class DelphiService implements IDelphiService {
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async round(estimates: Record<string,number>){
        const vals=Object.values(estimates).sort((a,b)=>a-b);
        if(vals.length===0) return { median: 0, iqr: 0, consensus: true };
        const median=vals[Math.floor(vals.length/2)] as number;
        const q1=vals[Math.floor(vals.length*0.25)] as number;
        const q3=vals[Math.floor(vals.length*0.75)] as number;
        const iqr=q3-q1;
        return { median: Math.round(median*100)/100, iqr: Math.round(iqr*100)/100, consensus: iqr < 1 };
    }
}
