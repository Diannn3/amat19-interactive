import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const labsDirectory = new URL('../../apps/web/src/pages/labs/', import.meta.url);
const labsDirectoryPath = fileURLToPath(labsDirectory);
const implementationLanguage = /parsed proposition tree|evaluating text dynamically|free-form NLP|\bBigInt\b|\bWeb Worker\b|deterministic step validation|older-handout topic|high-precision arithmetic/i;

test('lab route descriptions stay learner-facing', async () => {
  const files = (await readdir(labsDirectory)).filter((file) => file.endsWith('.astro'));
  const violations: string[] = [];

  for (const file of files) {
    const source = await readFile(join(labsDirectoryPath, file), 'utf8');
    const description = source.match(/<LabShell[^\n]*description="([^"]+)"/)?.[1];
    assert.ok(description, `${file} should declare a route description`);
    if (implementationLanguage.test(description)) violations.push(`${file}: ${description}`);
  }

  assert.deepEqual(violations, []);
});

test('practice navigation labels do not expose generation metadata', async () => {
  const [palette, practice] = await Promise.all([
    readFile(new URL('../../apps/web/src/components/navigation/CommandPalette.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../apps/web/src/components/practice/MixedPracticeRunner.tsx', import.meta.url), 'utf8'),
  ]);

  assert.doesNotMatch(palette, /Generated assessment/i);
  assert.doesNotMatch(practice, /Original generated set/i);
});

test('learner-facing lab copy does not expose implementation mechanics', async () => {
  const files = [
    '../../apps/web/src/components/math/StepTrace.tsx',
    '../../apps/web/src/components/labs/conditional-probability/ConditionalProbabilityLab.tsx',
    '../../apps/web/src/components/labs/finance/CashflowTimelineLab.tsx',
    '../../apps/web/src/components/labs/finance/InterestLab.tsx',
    '../../apps/web/src/components/labs/distribution/DistributionLab.tsx',
    '../../apps/web/src/components/labs/simulation/ProbabilitySimulationLab.tsx',
    '../../apps/web/src/components/labs/matrices/RowReductionLab.tsx',
    '../../apps/web/src/layouts/AppLayout.astro',
  ];
  const sources = await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), 'utf8')));
  const source = sources.join('\n');

  assert.doesNotMatch(source, /Internal value:|Internal high-precision value|High-precision internal value|exact engine checks|engine's trace|engine step|probability engine requires|seeded worker|Completed deterministic run|deterministic checkpoints|local-first deterministic learning tools|worker runs in chunks/i);
});

test('settings and local-data copy stays truthful and learner-facing', async () => {
  const [settingsPage, settingsPanel, dataManager] = await Promise.all([
    readFile(new URL('../../apps/web/src/pages/settings.astro', import.meta.url), 'utf8'),
    readFile(new URL('../../apps/web/src/components/settings/SettingsPanel.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../../apps/web/src/components/DataManager.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(settingsPage, /Choose whether optional motion appears while you study/i);
  assert.doesNotMatch(settingsPage, /IndexedDB/i);
  assert.match(settingsPanel, /Reduce interface motion/i);
  assert.doesNotMatch(settingsPanel, /Truth-value notation|Finance display decimals|Default practice length|Supplemental topics/i);
  assert.doesNotMatch(settingsPanel, /future shared formatters|internal precision|adaptive practice presets/i);
  assert.doesNotMatch(dataManager, /schema v|IndexedDB/i);
});
