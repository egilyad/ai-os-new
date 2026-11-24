import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const source = process.env['SKILLS_SOURCE'] || join(homedir(), '.config', 'opencode', 'skills');
const dest = resolve('.opencode/skills');

let copied = 0;
let unchanged = 0;
let skipped = 0;

for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const src = join(source, entry.name, 'SKILL.md');
    if (!existsSync(src)) {
        skipped++;
        continue;
    }
    const content = readFileSync(src, 'utf8');
    const targetDir = join(dest, entry.name);
    const target = join(targetDir, 'SKILL.md');
    if (existsSync(target) && readFileSync(target, 'utf8') === content) {
        unchanged++;
        continue;
    }
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(target, content, 'utf8');
    copied++;
}

console.log(`skills sync: copied=${copied} unchanged=${unchanged} skipped=${skipped}`);
