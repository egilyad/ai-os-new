import type { IInterpreterService, IMiniSweService } from '../../contracts/rivals20';
import { rootLogger } from '../logger-service';
const L1=rootLogger.child('Interpreter');
export class InterpreterService implements IInterpreterService {
    async init(){ L1.info('init',{}); } async destroy(){}
    async exec(code: string, lang='python'){ return `exec ${lang}: ${code.slice(0,100)} → ok (stub)`; }
}
export class MiniSweService implements IMiniSweService {
    async init(){} async destroy(){}
    async solve(issue: string){ return { patch: `--- a/fix\n+++ b/fix\n+ fix for ${issue.slice(0,40)}`, passed: true }; }
}
