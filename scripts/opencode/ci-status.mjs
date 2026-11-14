// ci-status.mjs — статус последних GitHub Actions ранов.
// Использование: node scripts/opencode/ci-status.mjs [--limit N]

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf('--limit') + 1] ?? 5);
const repo = 'egilyad/ai-os-new';

const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=${limit}`, {
    headers: { 'User-Agent': 'opencode' },
});

if (!res.ok) {
    console.error(`GitHub API ошибка: ${res.status}`);
    process.exit(1);
}

const { workflow_runs: runs } = await res.json();

console.log(`Последние ${runs.length} ранов CI (${repo}):\n`);
for (const r of runs) {
    const sha = r.head_sha.slice(0, 7);
    const who = r.status === 'completed' ? (r.conclusion ?? '?') : r.status;
    const icon = who === 'success' ? '✅' : who === 'failure' ? '❌' : who === 'in_progress' || who === 'queued' ? '⏳' : '⚪';
    console.log(`${icon} ${who.padEnd(12)} ${sha} ${r.name} (${new Date(r.created_at).toISOString().slice(0, 16).replace('T', ' ')})`);
}
console.log('\nОткрой: https://github.com/' + repo + '/actions');
