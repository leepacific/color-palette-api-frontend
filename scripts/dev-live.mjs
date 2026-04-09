// Loop 3 FR-4: launch Vite dev server with MSW forced OFF for live smoke tests.
// Cross-platform replacement for `cross-env VITE_USE_MSW=false npm run dev`.
//
// Vite reads `.env` files at startup and merges process.env (VITE_*) on top,
// but file-based values beat process.env when both set the same key. So we
// write a temporary `.env.local` (higher precedence than `.env`) for the
// duration of the dev server, and clean it up on exit.
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const envLocalPath = join(here, '..', '.env.local');
const envLocalContent = 'VITE_USE_MSW=false\n';

// Always write (overwrite if stale from a prior crashed run).
writeFileSync(envLocalPath, envLocalContent);
console.log('[dev-live] wrote .env.local with VITE_USE_MSW=false');

function cleanup() {
  try {
    if (existsSync(envLocalPath)) unlinkSync(envLocalPath);
  } catch {}
}

const child = spawn('npm run dev -- --port 5173', {
  env: { ...process.env, VITE_USE_MSW: 'false' },
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  cleanup();
  process.exit(code ?? 0);
});
process.on('SIGINT', () => {
  cleanup();
  child.kill('SIGINT');
});
process.on('SIGTERM', () => {
  cleanup();
  child.kill('SIGTERM');
});
process.on('exit', cleanup);
