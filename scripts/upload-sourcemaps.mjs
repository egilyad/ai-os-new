// P1.27: Upload `dist/**/*.map` sourcemaps to an error-tracking backend
// (Sentry or Datadog) AFTER `npm run build`.
//
// Design:
//  - No credentials configured -> clean no-op with an info message (exit 0).
//    This keeps the default CI/build pipeline green for projects that have not
//    wired up error tracking yet.
//  - Sentry: requires SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT. The
//    release version defaults to VITE_APP_VERSION / package.json version and
//    can be overridden with SENTRY_RELEASE.
//  - Datadog: requires DATADOG_API_KEY, DATADOG_SITE (default datadoghq.com).
//  - The official CLIs are pulled on demand via npx so we do not add heavy
//    platform-specific binaries to package.json.
//
// Usage: node scripts/upload-sourcemaps.mjs

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const sentryToken = process.env.SENTRY_AUTH_TOKEN;
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
const datadogKey = process.env.DATADOG_API_KEY;
const datadogSite = process.env.DATADOG_SITE || 'datadoghq.com';

function resolveVersion() {
    if (process.env.SENTRY_RELEASE) return process.env.SENTRY_RELEASE;
    if (process.env.VITE_APP_VERSION) return process.env.VITE_APP_VERSION;
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
        if (pkg.version) return pkg.version;
    } catch {
        /* ignore */
    }
    return 'latest';
}

function listMaps() {
    const out = [];
    if (!fs.existsSync(DIST)) return out;
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name.endsWith('.map')) out.push(full);
        }
    };
    walk(DIST);
    return out;
}

function run(cmd) {
    console.log(`[sourcemaps] $ ${cmd}`);
    execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

const maps = listMaps();

if (maps.length === 0) {
    console.log('[sourcemaps] No .map files in dist/. Build with sourcemap "hidden" first.');
    process.exit(0);
}

const hasSentry = Boolean(sentryToken && sentryOrg && sentryProject);
const hasDatadog = Boolean(datadogKey);

if (!hasSentry && !hasDatadog) {
    console.log(
        '[sourcemaps] No error-tracking credentials found ' +
            '(SENTRY_AUTH_TOKEN/SENTRY_ORG/SENTRY_PROJECT or DATADOG_API_KEY). ' +
            `Skipping upload of ${maps.length} sourcemap file(s). Configure the env vars to enable it.`,
    );
    process.exit(0);
}

console.log(`[sourcemaps] Found ${maps.length} .map file(s) to upload.`);

if (hasSentry && hasDatadog) {
    console.error(
        '[sourcemaps] Both Sentry and Datadog credentials present — upload to Sentry only. Remove DATADOG_API_KEY to switch.',
    );
}

if (hasSentry) {
    const release = resolveVersion();
    console.log(
        `[sourcemaps] Uploading to Sentry org="${sentryOrg}" project="${sentryProject}" release="${release}"`,
    );
    run(
        `npx @sentry/cli releases new -p ${JSON.stringify(sentryProject)} ${JSON.stringify(release)}`,
    );
    run(
        `npx @sentry/cli releases files ${JSON.stringify(release)} upload-sourcemaps ${JSON.stringify(DIST)} ` +
            '--ignore **/*.map.map --ignore **/*.map.js',
    );
    run(`npx @sentry/cli releases finalize ${JSON.stringify(release)}`);
} else if (hasDatadog) {
    console.log(`[sourcemaps] Uploading to Datadog site="${datadogSite}"`);
    run(
        `npx datadog-ci sourcemaps upload ${JSON.stringify(DIST)} ` +
            `--service ${JSON.stringify(process.env.DD_SERVICE || 'ai-os')} ` +
            `--release-version ${JSON.stringify(resolveVersion())} ` +
            `--minified-path-prefix ${JSON.stringify(process.env.DD_MINIFIED_PATH_PREFIX || '/assets/')} ` +
            '--disable-git-metadata-upload',
    );
}

console.log('[sourcemaps] Done.');
