/**
 * OpenAPI → agent tools (Agency Swarm-inspired).
 *
 * Read-only parser: extracts operations from an OpenAPI 3 spec and renders
 * calls (path params, query params) without performing any network request.
 * The caller decides how to execute the resulting URL/method.
 */
import type {
    IOpenApiToolService,
    OpenApiTool,
    OpenApiToolCall,
} from '../../contracts/openapi-tools';

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

export class OpenApiToolService implements IOpenApiToolService {
    parse(spec: Record<string, unknown>): OpenApiTool[] {
        const paths = spec['paths'];
        if (!paths || typeof paths !== 'object') return [];
        const tools: OpenApiTool[] = [];
        for (const [path, item] of Object.entries(paths as Record<string, unknown>)) {
            if (!item || typeof item !== 'object') continue;
            for (const method of METHODS) {
                const op = (item as Record<string, unknown>)[method];
                if (!op || typeof op !== 'object') continue;
                const o = op as Record<string, unknown>;
                const parameters: OpenApiTool['parameters'] = [];
                if (Array.isArray(o['parameters'])) {
                    for (const p of o['parameters']) {
                        if (!p || typeof p !== 'object') continue;
                        const param = p as Record<string, unknown>;
                        if (typeof param['name'] !== 'string') continue;
                        const where =
                            param['in'] === 'path' || param['in'] === 'header'
                                ? param['in']
                                : 'query';
                        parameters.push({
                            name: param['name'],
                            in: where,
                            required: param['required'] === true,
                        });
                    }
                }
                tools.push({
                    name:
                        typeof o['operationId'] === 'string'
                            ? o['operationId']
                            : `${method}_${path.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`,
                    description:
                        typeof o['summary'] === 'string'
                            ? o['summary']
                            : typeof o['description'] === 'string'
                              ? o['description']
                              : `${method.toUpperCase()} ${path}`,
                    method: method.toUpperCase() as OpenApiTool['method'],
                    path,
                    parameters,
                });
            }
        }
        return tools;
    }

    buildCall(tool: OpenApiTool, args: Record<string, unknown>): OpenApiToolCall {
        let url = tool.path;
        const query = new URLSearchParams();
        for (const p of tool.parameters) {
            if (!(p.name in args)) continue;
            const value = String(args[p.name]);
            if (p.in === 'path') {
                url = url.replace(`{${p.name}}`, encodeURIComponent(value));
            } else if (p.in === 'query') {
                query.set(p.name, value);
            }
        }
        const qs = query.toString();
        return {
            tool,
            args,
            url: qs ? `${url}?${qs}` : url,
            method: tool.method,
        };
    }
}
