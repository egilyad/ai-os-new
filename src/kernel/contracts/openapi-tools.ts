export interface OpenApiTool {
    name: string;
    description: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    parameters: Array<{ name: string; in: 'path' | 'query' | 'header'; required: boolean }>;
}

export interface OpenApiToolCall {
    tool: OpenApiTool;
    args: Record<string, unknown>;
    /** Rendered URL path with query string, ready for a fetch adapter. */
    url: string;
    method: OpenApiTool['method'];
}

/** Convert an OpenAPI spec into callable agent tools (Agency Swarm C2). */
export interface IOpenApiToolService {
    parse(spec: Record<string, unknown>): OpenApiTool[];
    /** Build a call from tool name + args without executing any network request. */
    buildCall(tool: OpenApiTool, args: Record<string, unknown>): OpenApiToolCall;
}
