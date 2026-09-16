import { spawn } from 'node:child_process';

// Start sync server
const sync = spawn('node', ['server/sync-server.mjs'], {
  stdio: 'pipe',
});
sync.stdout.on('data', (d) => process.stdout.write(`[sync] ${d}`));
sync.stderr.on('data', (d) => process.stderr.write(`[sync] ${d}`));
sync.on('exit', (code) => { if (code !== 0) { console.error(`[sync] exited with code ${code}`); process.exit(1); } });

// Start Vite dev server
const vite = spawn('npx', ['vite', '--host'], {
  stdio: 'inherit',
  shell: true,
});
vite.on('exit', (code) => { if (code !== 0) { console.error(`[vite] exited with code ${code}`); process.exit(1); } });

process.on('SIGINT', () => {
  sync.kill();
  vite.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  sync.kill();
  vite.kill();
  process.exit(0);
});
