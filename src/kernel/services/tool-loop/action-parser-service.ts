/**
 * Pluggable thought/action parsers (SWE-agent-inspired, I4).
 *
 * Ships a JSON parser and a lightweight `Thought:/Action:` text parser.
 * Callers may register custom parsers; first matching parser wins.
 */
import type {
    IActionParserService,
    IActionParser,
    ParsedAction,
} from '../../contracts/action-parser';

export class ActionParserService implements IActionParserService {
    private parsers: IActionParser[] = [];

    constructor() {
        this.register({
            id: 'json',
            canParse: (t) => t.trim().startsWith('{'),
            parse: (t) => {
                try {
                    const parsed = JSON.parse(t) as Record<string, unknown>;
                    if (typeof parsed['action'] !== 'string') return null;
                    const action = parsed['action'];
                    return {
                        thought:
                            typeof parsed['thought'] === 'string' ? parsed['thought'] : undefined,
                        action,
                        args:
                            parsed['args'] && typeof parsed['args'] === 'object'
                                ? (parsed['args'] as Record<string, unknown>)
                                : {},
                    };
                } catch {
                    return null;
                }
            },
        });
        this.register({
            id: 'text',
            canParse: (t) => /Action\s*:/i.test(t),
            parse: (t) => {
                const thought = /Thought\s*:\s*([\s\S]*?)(?=Action\s*:)/i.exec(t)?.[1]?.trim();
                const action = /Action\s*:\s*([^\n]+)/i.exec(t)?.[1]?.trim();
                if (!action) return null;
                return { thought, action, args: {} };
            },
        });
    }

    register(parser: IActionParser): void {
        this.parsers = this.parsers.filter((p) => p.id !== parser.id);
        this.parsers.push(parser);
    }

    parse(text: string): ParsedAction | null {
        for (const parser of this.parsers) {
            if (!parser.canParse(text)) continue;
            const result = parser.parse(text);
            if (result) return result;
        }
        return null;
    }

    list(): string[] {
        return this.parsers.map((p) => p.id);
    }
}
