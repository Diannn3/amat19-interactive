import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const PURE_PACKAGES = [
  'packages/math-core/src',
  'packages/domain-logic/src',
  'packages/domain-probability/src',
  'packages/domain-finance/src',
  'packages/domain-linear/src',
  'packages/domain-games/src',
  'packages/learning-engine/src',
  'packages/course-content/src'
];
const FORBIDDEN = [
  /from\s+['"]react['"]/,
  /from\s+['"]astro/,
  /\bdocument\./,
  /\bwindow\./,
  /\blocalStorage\b/,
  /\bindexedDB\b/,
  /\bDexie\b/
];
const DANGEROUS = [/\beval\s*\(/, /new\s+Function\s*\(/, /dangerouslySetInnerHTML/, /\.innerHTML\s*=/];

async function filesUnder(directory) {
  const entries = await readdir(path.join(ROOT, directory), { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await filesUnder(relative));
    else if (/\.(ts|tsx|js|mjs|astro)$/.test(entry.name)) output.push(relative);
  }
  return output;
}

const violations = [];
for (const directory of PURE_PACKAGES) {
  for (const file of await filesUnder(directory)) {
    const source = await readFile(path.join(ROOT, file), 'utf8');
    for (const rule of FORBIDDEN) if (rule.test(source)) violations.push(`${file}: pure domain matched ${rule}`);
    for (const rule of DANGEROUS) if (rule.test(source)) violations.push(`${file}: unsafe execution/render path matched ${rule}`);
  }
}

for (const file of await filesUnder('apps/web/src')) {
  const source = await readFile(path.join(ROOT, file), 'utf8');
  for (const rule of DANGEROUS) if (rule.test(source)) violations.push(`${file}: unsafe execution/render path matched ${rule}`);
}

const labPages = (await filesUnder('apps/web/src/pages/labs')).filter((file) => file.endsWith('.astro'));
if (labPages.length !== 1 || !labPages[0]?.endsWith(`${path.sep}[lab].astro`)) {
  violations.push(`apps/web/src/pages/labs: expected one dynamic compatibility route; found ${labPages.length}`);
} else {
  const source = await readFile(path.join(ROOT, labPages[0]), 'utf8');
  if (!source.includes('legacyLabAliases') || !source.includes('window.location.replace') || !source.includes('http-equiv="refresh"')) {
    violations.push(`${labPages[0]}: legacy lab route must resolve through the canonical alias registry`);
  }
  if (/client:(load|idle|visible|only|media)/.test(source)) {
    violations.push(`${labPages[0]}: compatibility redirects must not hydrate a client root`);
  }
}

const workbenchPages = (await filesUnder('apps/web/src/pages/workbenches')).filter((file) => file.endsWith('.astro'));
for (const file of workbenchPages) {
  const source = await readFile(path.join(ROOT, file), 'utf8');
  const hydrationCount = (source.match(/client:(load|idle|visible|only|media)/g) ?? []).length;
  if (hydrationCount !== 1 || !source.includes('client:load')) {
    violations.push(`${file}: expected exactly one client:load workbench root; found ${hydrationCount} hydration directives`);
  }
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
console.log(`- ${PURE_PACKAGES.length} domain/content packages remain DOM/framework independent`);
console.log(`- ${workbenchPages.length} workbench routes each hydrate exactly one client:load root`);
console.log('- legacy lab URLs resolve through one non-hydrated compatibility route');
console.log('- no dynamic JS evaluation, unsafe raw HTML rendering, or overlapping monolithic UI suites detected');
