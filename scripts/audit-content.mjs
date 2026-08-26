import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const PUBLIC_ROOTS = [
  'apps/web/src',
  'packages/course-content/src'
];
const PRIVATE_ASSESSMENT_MARKERS = [
  /\bExam\s*[12]\b/i,
  /\bbluebook\b/i,
  /\bTotal points\s*:/i,
  /sample\s+AMAT\s+Exam/i
];

async function filesUnder(directory) {
  const entries = await readdir(path.join(ROOT, directory), { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const rel = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await filesUnder(rel));
    else if (/\.(ts|tsx|astro|md|mdx|json)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

const violations = [];
for (const root of PUBLIC_ROOTS) {
  for (const file of await filesUnder(root)) {
    const source = await readFile(path.join(ROOT, file), 'utf8');
    for (const marker of PRIVATE_ASSESSMENT_MARKERS) {
      if (marker.test(source)) violations.push(`${file}: contains private-assessment marker ${marker}`);
    }
  }
}

if (violations.length) {
  console.error('Public-content audit FAILED');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}
console.log('Public-content audit PASS');
console.log('- learner-facing source contains original/synthesized examples rather than historical assessment text');
