export interface ParsedAction {
    thought?: string;
    action: string;
    args: Record<string, unknown>;
}

/** Pluggable parser for agent thought/action output (SWE-agent I4). */
export interface IActionParser {
    id: string;
    canParse(text: string): boolean;
    parse(text: string): ParsedAction | null;
}

/** Registry of pluggable parsers — first matching parser wins. */
export interface IActionParserService {
    register(parser: IActionParser): void;
    parse(text: string): ParsedAction | null;
    list(): string[];
}
