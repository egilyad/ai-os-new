import { execSync } from 'node:child_process';

const ORDER = [
    ['feat', 'Features'],
    ['fix', 'Fixes'],
    ['perf', 'Performance'],
    ['refactor', 'Refactoring'],
    ['docs', 'Documentation'],
    ['test', 'Tests'],
    ['chore', 'Chores'],
    ['build', 'Build'],
    ['ci', 'CI'],
    ['style', 'Style'],
];

function git(args) {
    return execSync(`git ${args}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
}

const explicitFrom = process.argv[2]?.replace(/^--from=/, '');
let from = explicitFrom ?? '';
if (!from) {
    try {
        from = git('describe --tags --abbrev=0');
    } catch {
        from = '';
    }
}

const range = from ? `${from}..HEAD` : '';
const raw = git(`log --pretty=format:%s~%h ${range ? `${range} ` : '-n 300 '}`);

if (!raw) {
    console.log(`Нет коммитов${from ? ` после ${from}` : ''}.`);
    process.exit(0);
}

const entries = raw.split('\n').map((line) => {
    const [subject, hash] = line.split('~');
    const breaking = subject.startsWith('!') || /!:/.test(subject);
    const m =
        /^(feat|fix|perf|refactor|docs|test|chore|build|ci|style)(?:\(([^)]+)\))?!?:\s*(.+)$/.exec(
            subject,
        );
    if (!m) {
        return { subject, hash, breaking, type: 'other' };
    }
    return { subject: m[3], hash, breaking, type: m[1], scope: m[2] };
});

const groups = new Map();
for (const e of entries) {
    if (!groups.has(e.type)) groups.set(e.type, []);
    groups.get(e.type).push(e);
}

const lines = [];
lines.push(`## Изменения${from ? ` после ${from}` : ' (вся история)'}`);
lines.push('');
for (const [type, title] of ORDER) {
    const list = groups.get(type);
    if (!list?.length) continue;
    lines.push(`### ${title}`);
    lines.push('');
    for (const e of list) {
        const scope = e.scope ? `**${e.scope}:** ` : '';
        const breaking = e.breaking ? ' 🔥 BREAKING' : '';
        lines.push(`- ${scope}${e.subject}${breaking} (\`${e.hash}\`)`);
    }
    lines.push('');
}
const other = groups.get('other');
if (other?.length) {
    lines.push('### Прочее');
    lines.push('');
    for (const e of other) {
        lines.push(`- ${e.subject} (\`${e.hash}\`)`);
    }
    lines.push('');
}

process.stdout.write(lines.join('\n'));
