/**
 * History processors pipeline (SWE-agent-inspired, I5).
 *
 * Built-in processors: drop empty messages and keep only the last N entries.
 * Custom processors can be registered for domain-specific compression.
 */
import type {
    IHistoryProcessorService,
    HistoryProcessor,
    HistoryEntry,
} from '../../contracts/history-processor';

export class HistoryProcessorService implements IHistoryProcessorService {
    private processors: HistoryProcessor[] = [];

    constructor() {
        this.use({
            id: 'drop-empty',
            process: (entries) => entries.filter((e) => e.content.trim().length > 0),
        });
        this.use({
            id: 'last-40',
            process: (entries) => entries.slice(-40),
        });
    }

    use(processor: HistoryProcessor): void {
        this.processors = this.processors.filter((p) => p.id !== processor.id);
        this.processors.push(processor);
    }

    process(entries: HistoryEntry[]): HistoryEntry[] {
        return this.processors.reduce((acc, processor) => processor.process(acc), [...entries]);
    }

    list(): string[] {
        return this.processors.map((p) => p.id);
    }
}
