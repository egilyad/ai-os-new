import { describe, it, expect } from 'vitest';
import { runSandboxCode, validateSandboxCode } from './sandbox-interpreter';
import type { SandboxOs } from './sandbox-interpreter';

function makeOs(overrides?: Partial<SandboxOs>): SandboxOs {
    return {
        executeTool: async (toolId: string, input: unknown) => {
            return { toolId, input, ok: true };
        },
        ...overrides,
    };
}

function run(code: string, data: unknown = {}, os: SandboxOs = makeOs()) {
    return runSandboxCode(code, data, os);
}

describe('validateSandboxCode', () => {
    it('returns null for valid code with top-level return', () => {
        expect(validateSandboxCode('return data')).toBeNull();
    });

    it('returns null for valid code with top-level await', () => {
        expect(validateSandboxCode('await Promise.resolve(1)')).toBeNull();
    });

    it('rejects forbidden identifiers', () => {
        expect(validateSandboxCode('fetch("https://x")')).toContain('fetch');
    });

    it('rejects eval call', () => {
        expect(validateSandboxCode('eval("1+1")')).toContain('eval');
    });

    it('rejects Function constructor via new', () => {
        expect(validateSandboxCode('new Function("return 1")')).toContain('Function');
    });

    it('rejects member access on constructor', () => {
        expect(validateSandboxCode('(async () => {}).constructor')).toContain('constructor');
    });

    it('rejects with statements', () => {
        expect(validateSandboxCode('with (obj) { x }')).toContain('with');
    });

    it('rejects import expression', () => {
        expect(validateSandboxCode('import("x")')).toContain('import');
    });

    it('rejects computed identifier access', async () => {
        expect(validateSandboxCode('obj["constructor"]')).toContain('constructor');
    });

    it('returns parse error for malformed code', () => {
        expect(validateSandboxCode('const = 1')).toContain('Unable to parse');
    });
});

describe('runSandboxCode — expressions', () => {
    it('evaluates arithmetic', async () => {
        expect(await run('return 2 + 3 * 4')).toBe(14);
    });

    it('evaluates string concatenation', async () => {
        expect(await run('return "foo" + "bar"')).toBe('foobar');
    });

    it('evaluates template literals with expressions', async () => {
        expect(await run('const x = 42; return `value: ${x * 2}`')).toBe('value: 84');
    });

    it('evaluates ternary', async () => {
        expect(await run('return 5 > 3 ? "yes" : "no"')).toBe('yes');
    });

    it('evaluates logical operators with short-circuit', async () => {
        expect(await run('return 0 || "fallback"')).toBe('fallback');
        expect(await run('return 1 && 2')).toBe(2);
        expect(await run('return null ?? "default"')).toBe('default');
    });

    it('evaluates unary and update operators', async () => {
        expect(await run('let a = 1; let b = a++; return a + b')).toBe(3);
        expect(await run('let c = 5; return --c')).toBe(4);
    });

    it('supports object literals with spread and computed keys', async () => {
        const res = await run(
            'const base = { a: 1 }; const key = "b"; return { ...base, [key]: 2 };',
        );
        expect(res).toEqual({ a: 1, b: 2 });
    });

    it('supports array literals with spread and holes', async () => {
        expect(await run('return [1, ...[2, 3], , 5]')).toEqual([1, 2, 3, undefined, 5]);
    });

    it('supports regex literals', async () => {
        expect(await run('return /ab+c/i.test("ABBBC")')).toBe(true);
    });

    it('supports destructuring assignment', async () => {
        expect(
            await run('const [a, b] = [1, 2]; const { x, y = 9 } = { x: 7 }; return a + b + x + y'),
        ).toBe(19);
    });

    it('supports member chains and computed access', async () => {
        expect(
            await run('const o = { nested: { list: [1, 2, 3] } }; return o.nested.list[1]'),
        ).toBe(2);
    });
});

describe('runSandboxCode — control flow', () => {
    it('evaluates if/else', async () => {
        expect(await run('let r; if (2 > 1) { r = "big" } else { r = "small" } return r')).toBe(
            'big',
        );
    });

    it('evaluates while loops with break', async () => {
        expect(
            await run(
                'let i = 0; let s = 0; while (true) { i++; if (i > 5) break; s += i } return s',
            ),
        ).toBe(15);
    });

    it('evaluates for loops', async () => {
        expect(
            await run(
                'let s = 0; for (let i = 0; i < 10; i++) { if (i % 2 === 0) continue; s += i } return s',
            ),
        ).toBe(25);
    });

    it('evaluates do-while loops', async () => {
        expect(await run('let i = 0; do { i++ } while (i < 3); return i')).toBe(3);
    });

    it('evaluates for-of over array', async () => {
        expect(await run('let s = 0; for (const v of [1, 2, 3]) { s += v } return s')).toBe(6);
    });

    it('evaluates for-in over object keys', async () => {
        expect(
            await run(
                'const keys = []; for (const k in { a: 1, b: 2 }) { keys.push(k) } return keys.join(",")',
            ),
        ).toBe('a,b');
    });

    it('evaluates switch statements', async () => {
        const code = `switch (2) { case 1: return "one"; case 2: return "two"; default: return "many"; }`;
        expect(await run(code)).toBe('two');
    });

    it('evaluates try/catch/finally', async () => {
        const code = `let out = ""; try { throw new Error("boom") } catch (e) { out = e.message } finally { out += "!" } return out`;
        expect(await run(code)).toBe('boom!');
    });

    it('evaluates labeled break', async () => {
        const code = `let s = 0; outer: for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) { if (i === 1 && j === 1) break outer; s++; } } return s`;
        expect(await run(code)).toBe(4);
    });
});

describe('runSandboxCode — functions', () => {
    it('evaluates function declarations and calls', async () => {
        const code = `function add(a, b) { return a + b } return add(2, 3)`;
        expect(await run(code)).toBe(5);
    });

    it('hoists function declarations', async () => {
        expect(await run('return double(4); function double(n) { return n * 2 }')).toBe(8);
    });

    it('supports arrow functions and closures', async () => {
        const code = `function counter() { let c = 0; return () => ++c } const inc = counter(); inc(); return inc()`;
        expect(await run(code)).toBe(2);
    });

    it('supports recursion', async () => {
        const code = `function fact(n) { return n <= 1 ? 1 : n * fact(n - 1) } return fact(5)`;
        expect(await run(code)).toBe(120);
    });

    it('supports default and rest parameters', async () => {
        const code = `function sum(a, b = 10, ...rest) { let s = a + b; for (const r of rest) s += r; return s } return sum(1, undefined, 2, 3)`;
        expect(await run(code)).toBe(16);
    });

    it('supports async/await', async () => {
        expect(await run('return await Promise.resolve("ok")')).toBe('ok');
    });

    it('supports method calls with this binding', async () => {
        const code = `const obj = { n: 5, get() { return this.n } }; return obj.get()`;
        expect(await run(code)).toBe(5);
    });

    it('supports callbacks via forEach', async () => {
        const code = `let s = 0; [1, 2, 3].forEach((v) => { s += v }); return s`;
        expect(await run(code)).toBe(6);
    });
});

describe('runSandboxCode — os/data integration', () => {
    it('exposes data via the data binding', async () => {
        const data = { name: 'world' };
        expect(await run('return data.name', data)).toBe('world');
    });

    it('calls os.executeTool with await', async () => {
        const os = makeOs({
            executeTool: async (toolId, input) => `${toolId}:${JSON.stringify(input)}`,
        });
        expect(await run('return await os.executeTool("search", { q: "x" })', {}, os)).toBe(
            'search:{"q":"x"}',
        );
    });

    it('supports chaining tool results', async () => {
        const os = makeOs({
            executeTool: async (toolId) => (toolId === 'a' ? { next: 1 } : 99),
        });
        const code = `const r1 = await os.executeTool("a", {}); return os.executeTool("b", r1.next)`;
        expect(await run(code, {}, os)).toBe(99);
    });

    it('exposes Math, JSON, Date, crypto', async () => {
        expect(await run('return Math.max(1, 5, 3)')).toBe(5);
        expect(await run('return JSON.stringify({ a: 1 })')).toBe('{"a":1}');
        expect(await run('return typeof Date')).toBe('function');
        expect(await run('return typeof crypto')).toBe('object');
    });
});

describe('runSandboxCode — sandboxing', () => {
    it('blocks forbidden global identifiers at runtime', async () => {
        await expect(run('fetch("https://example.com")')).rejects.toThrow(/fetch/);
    });

    it('blocks eval at runtime', async () => {
        await expect(run('eval("1")')).rejects.toThrow(/eval/);
    });

    it('blocks Function constructor via identifier', async () => {
        await expect(run('const f = Function("return 1")')).rejects.toThrow(/Function/);
    });

    it('blocks member access to constructor', async () => {
        await expect(run('(async () => {}).constructor')).rejects.toThrow(/constructor/);
    });

    it('blocks indirect escape via ["constructor"]', async () => {
        await expect(run('const c = {}["constructor"]')).rejects.toThrow(/constructor/);
    });

    it('blocks setTimeout', async () => {
        await expect(run('setTimeout(() => {}, 1)')).rejects.toThrow(/setTimeout/);
    });

    it('blocks self/globalThis', async () => {
        await expect(run('return self')).rejects.toThrow(/self/);
        await expect(run('return globalThis')).rejects.toThrow(/globalThis/);
    });

    it('enforces step limit', async () => {
        const code = `let i = 0; while (true) { i++ }`;
        await expect(runSandboxCode(code, {}, makeOs(), { maxSteps: 100 })).rejects.toThrow(
            /step limit/,
        );
    });

    it('enforces call depth limit', async () => {
        const code = `function loop() { return loop() } return loop()`;
        await expect(runSandboxCode(code, {}, makeOs(), { maxDepth: 50 })).rejects.toThrow(
            /depth limit/,
        );
    });

    it('forbids class declarations', async () => {
        await expect(run('class A {}')).rejects.toThrow(/Class declarations/);
    });

    it('forbids with statements', async () => {
        await expect(run('with ({}) {}')).rejects.toThrow(/with/);
    });

    it('returns thrown error with message', async () => {
        await expect(run('throw new Error("user bug")')).rejects.toThrow('user bug');
    });

    it('propagates sandbox-internal runtime errors', async () => {
        await expect(run('const x = undefined; return x.missing')).rejects.toThrow(
            /Cannot read properties/,
        );
    });
});
