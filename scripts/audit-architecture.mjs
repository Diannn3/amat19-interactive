import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const PURE_PACKAGES = ['packages/math-core/src', 'packages/domain-logic/src', 'packages/learning-engine/src'];
const FORBIDDEN = [
  /from\s+['"]react['"]/,
  /from\s+['"]astro/,
  /\bdocument\./,
  /\bwindow\./,
  /\blocalStorage\b/,
  /\bindexedDB\b/
];

async function filesUnder(directory) {
  const entries = await readdir(path.join(ROOT, directory), { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await filesUnder(relative));
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) output.push(relative);
  }
  return output;
}

const violations = [];
for (const directory of PURE_PACKAGES) {
  for (const file of await filesUnder(directory)) {
    const source = await readFile(path.join(ROOT, file), 'utf8');
    for (const rule of FORBIDDEN) {
      if (rule.test(source)) violations.push(`${file}: matched ${rule}`);
    }
  }
}

const labRoute = await readFile(path.join(ROOT, 'apps/web/src/pages/labs/truth-table.astro'), 'utf8');
const hydrationCount = (labRoute.match(/client:(load|idle|visible|only|media)/g) ?? []).length;
if (hydrationCount !== 1 || !labRoute.includes('client:load')) {
  violations.push(`truth-table.astro: expected exactly one client:load lab root; found ${hydrationCount} hydration directives`);
}

const webPackage = JSON.parse(await readFile(path.join(ROOT, 'apps/web/package.json'), 'utf8'));
const bannedSuites = ['@mui/material', 'antd', '@chakra-ui/react', 'daisyui', 'bootstrap'];
for (const dependency of bannedSuites) {
  if (webPackage.dependencies?.[dependency] || webPackage.devDependencies?.[dependency]) {
    violations.push(`apps/web/package.json: banned overlapping UI suite ${dependency}`);
  }
}

if (violations.length) {
  console.error('Architecture audit FAILED');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Architecture audit PASS');
console.log('- math-core/domain-logic/learning-engine remain DOM and framework independent');
console.log('- Truth Table route contains one client:load React root');
console.log('- no overlapping monolithic UI suites detected');
