import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const root = join(tmpdir(), `amat19-release-${createHash('sha256').update(process.cwd()).digest('hex').slice(0, 8)}`);
for (const release of ['a', 'b']) {
  const env = { ...process.env, VERCEL_GIT_COMMIT_SHA: release.repeat(40) };
  const output = join(root, release);
  execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', output],
    { cwd: 'apps/web', stdio: 'inherit', env });
  execFileSync(process.execPath, ['scripts/build-offline-assets.mjs', output], { stdio: 'inherit', env });
}
