export interface KernelEvent {
    type: string;
    payload: unknown;
    timestamp: number;
    seq: number;
}
