import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const SessionWikiPlugin = async ({ directory }) => {
  return {
    event: async ({ event }) => {
      // Summar— assistant answer completes, opencode emits session.idle.
      // Export every assistant turn to docs/sessions/turns (+ wiki mirror).
      if (event?.type !== 'session.idle') return;
      const script = join(directory, 'scripts', 'export-opencode-turns.mjs');
      if (!existsSync(script)) return;
      try {
        await execFileAsync('node', [script], { cwd: directory, timeout: 30000 });
      } catch {
        // best-effort: never break the session on export failure
      }
    },
  };
};
