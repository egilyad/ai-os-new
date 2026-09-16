import type { ICrushService } from '../../contracts/rivals19';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('Crush');
export class CrushService implements ICrushService {
    async init(){ LOGGER.info('init',{}); } async destroy(){}
    async pretty(text: string){
        const bar='─'.repeat(40);
        return `╭${bar}╮\n│ ${text.slice(0,38).padEnd(38)} │\n╰${bar}╯ ✨ crush`;
    }
}
