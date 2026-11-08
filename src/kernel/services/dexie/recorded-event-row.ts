// Schema for EventRecorder persistence (Dexie store)
export interface RecordedEventRow {
    id?: number; // auto-increment
    sequence: number;
    event: string;
    dataJson: string; // JSON.stringify(data)
    checksum: string;
    timestamp: number;
}
