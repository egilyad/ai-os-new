import { describe, it, expect } from 'vitest';
import { OpenApiToolService } from './openapi-tool-service';

const spec = {
    openapi: '3.0.0',
    paths: {
        '/pets/{petId}': {
            get: {
                operationId: 'getPet',
                summary: 'Get a pet',
                parameters: [
                    { name: 'petId', in: 'path', required: true },
                    { name: 'verbose', in: 'query', required: false },
                ],
            },
        },
        '/pets': {
            post: { summary: 'Create a pet' },
        },
    },
};

describe('OpenApiToolService', () => {
    it('extracts operations as agent tools', () => {
        const tools = new OpenApiToolService().parse(spec);
        expect(tools).toHaveLength(2);
        expect(tools[0]!.name).toBe('getPet');
        expect(tools[0]!.method).toBe('GET');
        expect(tools[1]!.name).toBe('post_pets');
    });

    it('renders path and query parameters into a call URL', () => {
        const svc = new OpenApiToolService();
        const tool = svc.parse(spec)[0]!;
        const call = svc.buildCall(tool, { petId: 'a b', verbose: 'true' });
        expect(call.url).toBe('/pets/a%20b?verbose=true');
        expect(call.method).toBe('GET');
    });

    it('returns empty for an invalid spec', () => {
        expect(new OpenApiToolService().parse({})).toEqual([]);
    });
});
