import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import './setup-workspace-links.mjs';

const testFiles = [
  'packages/math-core/test/*.test.ts',
  'packages/domain-logic/test/*.test.ts',
  'packages/domain-probability/test/*.test.ts',
  'packages/domain-finance/test/*.test.ts',
  'packages/domain-linear/test/*.test.ts',
  'packages/domain-games/test/*.test.ts',
  'tests/node/math-property-certification.test.ts',
  'tests/node/mixed-assessment.test.ts',
  'tests/node/pass8-assessment-contract.test.ts',
];

const shellCommand = `node --experimental-strip-types --test --test-reporter=tap ${testFiles.join(' ')}`;
const child = spawn(shellCommand, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
let stdout = '';
let stderr = '';
child.stdout.on('data', (chunk) => { const text = chunk.toString(); stdout += text; process.stdout.write(text); });
child.stderr.on('data', (chunk) => { const text = chunk.toString(); stderr += text; process.stderr.write(text); });

const exitCode = await new Promise((resolve) => child.on('close', resolve));
await mkdir('artifacts', { recursive: true });
const extract = (name) => Number(stdout.match(new RegExp(`# ${name} (\\d+)`))?.[1] ?? 0);
const durationMs = Number(stdout.match(/# duration_ms ([0-9.]+)/)?.[1] ?? 0);
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  baselineIntent: 'AMAT 19 math/backend anti-hallucination certification',
  command: shellCommand,
  status: exitCode === 0 ? 'pass' : 'fail',
  exitCode,
  tests: extract('tests'),
  pass: extract('pass'),
  fail: extract('fail'),
  skipped: extract('skipped'),
  durationMs,
  scopes: ['math-core','logic','probability','finance','linear','games','generated-assessment'],
};
await writeFile('artifacts/math-property-report.json', `${JSON.stringify(report, null, 2)}\n`);
await writeFile('artifacts/math-property-tests.tap', stdout);
if (stderr) await writeFile('artifacts/math-property-tests.stderr.log', stderr);
process.exitCode = Number(exitCode);
