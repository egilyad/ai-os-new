/**
 * Tool Repair — AGEMS port, Phase 12.4.
 * Fixes invalid tool_use input before sending back to the agent.
 */

export interface ToolCall {
    name: string;
    input: Record<string, unknown>;
}

export interface ToolSchema {
    name: string;
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description?: string;
            required?: boolean;
            default?: unknown;
            enum?: unknown[];
        }>;
        required?: string[];
    };
}

export interface RepairResult {
    repaired: boolean;
    call: ToolCall;
    fixes: string[];
}

/**
 * Repair a tool call's input to match the expected schema.
 */
export function repairToolCall(call: ToolCall, schema?: ToolSchema): RepairResult {
    const fixes: string[] = [];
    const input = { ...call.input };

    if (!schema) {
        // Basic repairs without schema
        return { repaired: false, call, fixes };
    }

    const props = schema.parameters.properties;
    const required = schema.parameters.required ?? [];

    // Fix missing required fields with defaults
    for (const field of required) {
        if (input[field] === undefined || input[field] === null) {
            const prop = props[field];
            if (prop?.default !== undefined) {
                input[field] = prop.default;
                fixes.push(`Added default value for missing field "${field}"`);
            } else if (prop?.type === 'string') {
                input[field] = '';
                fixes.push(`Added empty string for missing field "${field}"`);
            } else if (prop?.type === 'number') {
                input[field] = 0;
                fixes.push(`Added 0 for missing field "${field}"`);
            } else if (prop?.type === 'boolean') {
                input[field] = false;
                fixes.push(`Added false for missing field "${field}"`);
            } else if (prop?.type === 'array') {
                input[field] = [];
                fixes.push(`Added empty array for missing field "${field}"`);
            }
        }
    }

    // Fix type mismatches
    for (const [key, value] of Object.entries(input)) {
        const prop = props[key];
        if (!prop) continue;

        if (prop.type === 'string' && typeof value !== 'string') {
            input[key] = String(value);
            fixes.push(`Converted "${key}" from ${typeof value} to string`);
        } else if (prop.type === 'number' && typeof value !== 'number') {
            const num = Number(value);
            if (!isNaN(num)) {
                input[key] = num;
                fixes.push(`Converted "${key}" from ${typeof value} to number`);
            }
        } else if (prop.type === 'boolean' && typeof value !== 'boolean') {
            if (value === 'true' || value === '1') {
                input[key] = true;
                fixes.push(`Converted "${key}" to boolean true`);
            } else if (value === 'false' || value === '0') {
                input[key] = false;
                fixes.push(`Converted "${key}" to boolean false`);
            }
        }

        // Fix enum values
        if (prop.enum && !prop.enum.includes(value)) {
            const first = prop.enum[0];
            input[key] = first;
            fixes.push(`Replaced invalid enum value for "${key}" with "${first}"`);
        }
    }

    // Remove unknown fields
    for (const key of Object.keys(input)) {
        if (!props[key]) {
            delete input[key];
            fixes.push(`Removed unknown field "${key}"`);
        }
    }

    return {
        repaired: fixes.length > 0,
        call: { ...call, input },
        fixes,
    };
}
