/**
 * CodeExecService — J.3 (E2B-style code tickets, browser-honest).
 *
 * The browser cannot execute arbitrary code, so tickets validate statically
 * (balanced brackets, banned identifiers, size/time limits) and wait for an
 * external executor delegate (E2B-like). Without a delegate the ticket stays
 * queued as an explicit handoff — never silently "executed".
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ICodeExecService } from '../../contracts/rivals5';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('CodeExec');

const BANNED = [
    'eval',
    'Function',
    'process',
    'require',
    'import(',
    '__proto__',
    'constructor',
    'globalThis',
    'fetch',
    'XMLHttpRequest',
];

const MAX_CODE_CHARS = 20000;

type Delegate = (ticketId: string, language: string, code: string) => Promise<string>;

interface TicketDoc {
    id: string;
    language: string;
    code: string;
    status: 'queued' | 'done' | 'rejected';
    result?: string;
    createdAt: number;
}

function balanced(code: string): boolean {
    const stack: string[] = [];
    const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
    let inStr: string | null = null;
    let escaped = false;
    for (const ch of code) {
        if (inStr) {
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === inStr) inStr = null;
            continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') inStr = ch;
        else if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
        else if (ch === ')' || ch === ']' || ch === '}') {
            if (stack.pop() !== pairs[ch]) return false;
        }
    }
    return stack.length === 0 && !inStr;
}

export class CodeExecService implements ICodeExecService {
    private delegate?: Delegate;

    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        this.delegate = undefined;
    }

    setExecutor(delegate: Delegate): void {
        this.delegate = delegate;
    }

    async submit(language: string, code: string): Promise<string> {
        const lang = language.toLowerCase().slice(0, 20);
        if (!['python', 'javascript', 'typescript', 'sql'].includes(lang)) {
            throw new Error(`Unsupported language: ${language}`);
        }
        if (code.length > MAX_CODE_CHARS) throw new Error(`Code too large (${code.length} > ${MAX_CODE_CHARS})`);
        for (const banned of BANNED) {
            if (code.includes(banned)) throw new Error(`Banned identifier in code ticket: ${banned}`);
        }
        if (!balanced(code)) throw new Error('Unbalanced brackets/quotes in code ticket');
        const ticket: TicketDoc = {
            id: genId('codeticket'),
            language: lang,
            code,
            status: 'queued',
            createdAt: Date.now(),
        };
        await this.dal.kv.set(`codetickets/${ticket.id}`, ticket);
        this.events.emit(EVENTS.CODEEXEC_QUEUED, { ticketId: ticket.id, language: lang });

        if (this.delegate) {
            try {
                const result = await this.delegate(ticket.id, lang, code);
                ticket.status = 'done';
                ticket.result = result.slice(0, 8000);
                await this.dal.kv.set(`codetickets/${ticket.id}`, ticket);
            } catch (e) {
                ticket.status = 'rejected';
                ticket.result = e instanceof Error ? e.message : String(e);
                await this.dal.kv.set(`codetickets/${ticket.id}`, ticket);
            }
        }
        return ticket.id;
    }

    async result(ticketId: string): Promise<string> {
        const ticket = await this.dal.kv.get<TicketDoc>(`codetickets/${ticketId}`);
        if (!ticket) throw new Error(`Code ticket not found: ${ticketId}`);
        if (ticket.status === 'queued') {
            return 'queued — no external executor attached (handoff pending)';
        }
        return `${ticket.status}: ${(ticket.result ?? '').slice(0, 4000)}`;
    }
}
