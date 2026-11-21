/** Shared value types for the tool-loop driver and its guard/mentor extension. */

export interface ToolLoopToolCallInfo {
    name: string;
    args: Record<string, unknown>;
    ok: boolean;
    output: string;
}
