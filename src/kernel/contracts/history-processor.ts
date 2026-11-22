export interface HistoryEntry {
    role: string;
    content: string;
    tokens?: number;
}

/** A processor transforms the message history before it goes to the model. */
export interface HistoryProcessor {
    id: string;
    process(entries: HistoryEntry[]): HistoryEntry[];
}

/** Composable history processing pipeline (SWE-agent I5). */
export interface IHistoryProcessorService {
    use(processor: HistoryProcessor): void;
    process(entries: HistoryEntry[]): HistoryEntry[];
    list(): string[];
}
