import { mkdir, lstat, readFile, symlink } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const packagesDir = path.join(root, 'packages');
const scopeDir = path.join(root, 'node_modules', '@amat19');
const packageNames = [
  'course-content',
  'domain-finance',
  'domain-games',
  'domain-linear',
  'domain-logic',
  'domain-probability',
  'learning-engine',
  'math-core',
  'persistence',
];

await mkdir(scopeDir, { recursive: true });
let created = 0;
for (const folder of packageNames) {
  const packageDir = path.join(packagesDir, folder);
  const manifest = JSON.parse(await readFile(path.join(packageDir, 'package.json'), 'utf8'));
  const expectedName = `@amat19/${folder}`;
  if (manifest.name !== expectedName) throw new Error(`Workspace package ${folder} declares ${manifest.name}; expected ${expectedName}.`);
  const linkPath = path.join(scopeDir, folder);
  try {
    await lstat(linkPath);
    continue;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  const target = path.relative(scopeDir, packageDir);
  await symlink(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
  created += 1;
}
console.log(`AMAT 19 workspace links ready (${created} created, ${packageNames.length - created} already present).`);
