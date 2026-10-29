import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function git(dir, args) {
  return execFileAsync('git', args, { cwd: dir, timeout: 60000 });
}

export const SessionWikiPlugin = async ({ directory }) => {
  return {
    event: async ({ event }) => {
      // When an assistant answer completes, opencode emits session.idle.
      if (event?.type !== 'session.idle') return;

      const script = join(directory, 'scripts', 'export-opencode-turns.mjs');
      if (!existsSync(script)) return;

      try {
        // 1) Write every assistant turn to docs/sessions/turns (+ wiki mirror).
        await execFileAsync('node', [script], { cwd: directory, timeout: 30000 });

        // 2) Auto-commit + push (only the session art, idempotent).
        const status = await git(directory, ['status', '--porcelain', '--', 'docs/sessions', 'docs/wiki/sessions']);
        if (status.stdout.trim()) {
          await git(directory, ['add', '--', 'docs/sessions', 'docs/wiki/sessions']);
          await git(directory, ['commit', '--no-verify', '-m', `docs(sessions): autosave turns ${new Date().toISOString()}`, '--', 'docs/sessions', 'docs/wiki/sessions']);
          await git(directory, ['push']);
        }
      } catch {
        // best-effort: never break the session on export/commit failure
      }
    },
  };
};
