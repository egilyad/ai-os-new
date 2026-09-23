import type { DataAccessLayer } from '../../dal/types';
import type { IBlackboardService } from '../../contracts/rivals17';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Blackboard');
export class BlackboardService implements IBlackboardService {
    constructor(
        private dal: DataAccessLayer,
        private events?: IEventBus,
    ) {}
    async init(){ LOGGER.info('Blackboard', 'init',{}); } async destroy(){}
    async post(expert: string, data: string){ const list=(await this.dal.kv.get<string[]>('bb/board'))??[]; list.push(`${expert}: ${data.slice(0,300)}`); if(list.length>50) list.splice(0,list.length-50); await this.dal.kv.set('bb/board', list); await this.dal.kv.set(`bb/expert/${expert}`, { at: Date.now() }); try{ this.events?.emit(EVENTS.BLACKBOARD_POST, { board: 'bb/board' }); }catch{} }
    async tick(){
        const board=(await this.dal.kv.get<string[]>('bb/board'))??[];
        if(board.length===0) return 'blackboard empty';
        return `control loop: ${board.length} posts, last: ${board[board.length-1]?.slice(0,100)}`;
    }
}
