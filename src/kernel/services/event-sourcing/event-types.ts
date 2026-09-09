export interface RecordedEvent {
    readonly sequence: number;
    readonly event: string;
    readonly data: unknown;
    readonly timestamp: number;
    readonly checksum: string;
    /** Sequence of the event that triggered this one (causal ordering link). */
    readonly prevSequence?: number;
}

export type EventFilter = (event: RecordedEvent) => boolean;
