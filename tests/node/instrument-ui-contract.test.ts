import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const app = read('apps/web/src/layouts/AppLayout.astro');
const shell = read('apps/web/src/components/course/LabShell.astro');
const theme = read('apps/web/src/styles/theme.css');
const globalCss = read('apps/web/src/styles/global.css');
const instrument = read('apps/web/src/styles/instrument.css');
const icon = read('apps/web/public/icon.svg');
const manifest = read('apps/web/public/manifest.webmanifest');
const offline = read('apps/web/public/offline.html');
const publicColorSources = { theme, globalCss, instrument, icon, manifest, offline };

function grayViolations(source: string): string[] {
  const violations: string[] = [];
  for (const match of source.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const raw = match[0].slice(1);
    const expanded = raw.length === 3 || raw.length === 4 ? raw.slice(0, 3).split('').map((char) => char + char) : [raw.slice(0, 2), raw.slice(2, 4), raw.slice(4, 6)];
    if (expanded.length === 3) {
      const [r, g, b] = expanded.map((value) => Number.parseInt(value, 16));
      if (!(r === g && g === b)) violations.push(match[0]);
    }
  }
  for (const match of source.matchAll(/rgba?\(([^)]+)\)/gi)) {
    const channels = match[1]!.split(/[\s,\/]+/).filter(Boolean).slice(0, 3).map(Number);
    if (channels.length === 3 && channels.every(Number.isFinite) && !(channels[0] === channels[1] && channels[1] === channels[2])) violations.push(match[0]);
  }
  for (const match of source.matchAll(/hsla?\(([^)]+)\)/gi)) {
    const parts = match[1]!.split(/[\s,\/]+/).filter(Boolean);
    const saturation = Number.parseFloat(parts[1] ?? '0');
    if (Number.isFinite(saturation) && saturation !== 0) violations.push(match[0]);
  }
  return violations;
}

function hexRgb(value: string): [number, number, number] {
  const raw = value.replace('#', '');
  const normalized = raw.length === 3 ? raw.split('').map((char) => char + char).join('') : raw;
  return [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const one = luminance(hexRgb(a));
  const two = luminance(hexRgb(b));
  return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
}

function token(name: string): string {
  const match = theme.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  assert.ok(match, `theme should define --${name}`);
  return match[1]!;
}

function directSectionLabelBeforeHeading(source: string): boolean {
  return /<p class(?:Name)?="section-label"[^>]*>.*?<\/p>\s*<h[1-3]\b/s.test(source);
}

test('instrument shell owns the active design layer and preserves quiet utility functionality', () => {
  assert.match(app, /styles\/instrument\.css/);
  assert.doesNotMatch(app, /pass4\.css/);
  assert.doesNotMatch(instrument, /^\.more-menu(?:__|\s)/m);
  assert.doesNotMatch(app, /plus-jakarta/i);
  assert.match(app, /DeveloperContact/);
  assert.match(app, /data-developer-contact-trigger/);
  assert.doesNotMatch(globalCss, /Inter Variable|Sora Variable|Plus Jakarta/i);
  assert.match(theme, /system-ui/);
  const ledger = read('docs/DEPENDENCY_LEDGER.md');
  assert.doesNotMatch(ledger, /Jakarta is the interface face/i);
  assert.match(ledger, /Native system UI stack/);
});

test('public design sources are truly grayscale across hex, rgb, hsl, and gradient syntaxes', () => {
  for (const [name, source] of Object.entries(publicColorSources)) {
    assert.deepEqual(grayViolations(source), [], `${name} contains a hue-bearing literal`);
    assert.doesNotMatch(source, /linear-gradient|radial-gradient|conic-gradient/i, `${name} must not reintroduce gradients`);
  }
});

test('tertiary copy and control boundaries meet the intended contrast floors', () => {
  const backgrounds = [token('canvas'), token('surface'), token('surface-raised'), token('surface-recessed')];
  for (const background of backgrounds) assert.ok(contrast(token('ink-tertiary'), background) >= 4.5, `tertiary copy must be >=4.5:1 on ${background}`);
  for (const background of backgrounds) assert.ok(contrast(token('control-edge'), background) >= 3, `control edge must be >=3:1 on ${background}`);
});

test('shared lab shell is canvas-first rather than permanent three-rail chrome', () => {
  assert.match(shell, /lab-route__canvas/);
  assert.doesNotMatch(shell, /lab-route__context-rail/);
  assert.doesNotMatch(shell, /lab-route__support/);
  assert.match(shell, /About this workspace/);
  assert.doesNotMatch(shell, /lab-instrument-header__module[^]*?<h1>/);
  const moduleJourney = read('apps/web/src/components/course/ModuleJourney.astro');
  assert.doesNotMatch(moduleJourney, /module-overview__context[^]*?<h1/);
});

test('the delivery contains the complete subject-native stylesheet rather than a truncated release', () => {
  assert.ok(Buffer.byteLength(instrument) > 90_000, 'instrument.css must contain the complete instrument system');
  for (const selector of [
    '.finance-instrument {', '.game-instrument {', '.markov-instrument {', '.gauss-jordan-instrument {',
    'learning-lab[data-testid="counting-lab"]', 'conditional-lab[data-testid="bayes-lab"]',
    '.distribution-lab {', '.simulation-lab {',
  ]) assert.ok(instrument.includes(selector), `missing late-stage selector: ${selector}`);
});

test('section hierarchy does not relapse into eyebrow or kicker driven composition', () => {
  const sources = [
    'apps/web/src/components/home/HomeDashboard.tsx', 'apps/web/src/components/study/StudyDashboard.tsx',
    'apps/web/src/components/progress/ProgressDashboard.tsx', 'apps/web/src/pages/exam.astro',
    'apps/web/src/components/labs/formal-proof/FormalProofLab.tsx', 'apps/web/src/components/labs/distribution/DistributionLab.tsx',
    'apps/web/src/components/labs/conditional-probability/ConditionalProbabilityLab.tsx', 'apps/web/src/components/labs/conditional-probability/BayesLab.tsx',
    'apps/web/src/components/labs/applications/GameTheoryLab.tsx', 'apps/web/src/components/labs/applications/MarkovLab.tsx',
    'apps/web/src/components/labs/finance/BondLab.tsx', 'apps/web/src/components/labs/finance/AnnuityLab.tsx',
    'apps/web/src/components/labs/finance/InterestLab.tsx', 'apps/web/src/components/labs/finance/CashflowTimelineLab.tsx',
    'apps/web/src/components/labs/matrices/RowReductionLab.tsx', 'apps/web/src/components/labs/equivalence/EquivalenceLab.tsx',
  ].map(read);
  for (const source of sources) {
    assert.doesNotMatch(source, /\beyebrow\b|bento-kicker/i);
    assert.equal(directSectionLabelBeforeHeading(source), false);
  }
  const equivalence = read('apps/web/src/components/labs/equivalence/EquivalenceLab.tsx');
  assert.match(equivalence, /math-panel__head[^]*?<h2>Change exactly one rule at a time\.<\/h2><p className="section-label">Equivalence transformer<\/p>/);
  assert.doesNotMatch(equivalence, /learning-lab__explain"><h2>Change exactly one rule/);
});

test('shared finance timeline distributes coincident labels without falsifying time position', () => {
  const timeline = read('apps/web/src/components/math/Timeline.tsx');
  assert.match(timeline, /function distributeLabels/);
  assert.match(timeline, /rowCount/);
  assert.match(timeline, /finance-label-leader/);
  assert.match(timeline, /const pointX = x\(point\.time\)/);
  assert.doesNotMatch(timeline, /lane\s*%\s*2/);
});

test('flagship subjects use unmistakable subject-native mathematical compositions', () => {
  const truth = read('apps/web/src/components/labs/truth-table/lab.css');
  const row = read('apps/web/src/components/labs/matrices/RowReductionLab.tsx');
  const matrix = read('apps/web/src/components/labs/matrices/MatrixOperationsLab.tsx');
  const lp = read('apps/web/src/components/labs/applications/LinearProgrammingLab.tsx');
  const finance = read('apps/web/src/components/labs/finance/InterestLab.tsx');
  const conditional = read('apps/web/src/components/labs/conditional-probability/ConditionalProbabilityLab.tsx');
  const game = read('apps/web/src/components/labs/applications/GameTheoryLab.tsx');
  const markov = read('apps/web/src/components/labs/applications/MarkovLab.tsx');
  assert.match(truth, /truth-table/);
  assert.match(row, /gauss-jordan-instrument/);
  assert.match(matrix, /matrix-equation/);
  assert.match(lp, /lp-plot/);
  assert.match(finance, /finance-instrument/);
  assert.match(conditional, /population-partition/);
  assert.match(game, /payoff-table--instrument/);
  assert.match(markov, /markov-synchronized/);
});

test('home review guidance is evidence-backed and module-native rather than fabricated', () => {
  const home = read('apps/web/src/components/home/HomeDashboard.tsx');
  assert.match(home, /reviewItems/);
  assert.match(home, /\['repair', 'weak', 'review'\]/);
  assert.match(home, /moduleSketch/);
  assert.match(home, /Nothing urgent/);
  assert.doesNotMatch(home, /around\s+\{?Math|max\(5,\s*computed\.queue\.length\s*\*\s*2|around\s+\d+\s+min/i);
});

test('study and progress derive recency and repair states from ordered evidence', () => {
  const home = read('apps/web/src/components/home/HomeDashboard.tsx');
  const study = read('apps/web/src/components/study/StudyDashboard.tsx');
  const progress = read('apps/web/src/components/progress/ProgressDashboard.tsx');
  for (const source of [home, study, progress]) {
    assert.match(source, /\.sort\(\(a, b\) => b\.updatedAt\.localeCompare\(a\.updatedAt\)\)/);
  }
  assert.match(progress, /byId\.has\(skill\.id\)/);
  assert.match(progress, /attemptsByRecency\.slice/);
});

test('native radio groups are named and literal lab buttons cannot accidentally submit forms', () => {
  const radioSources = [
    'apps/web/src/components/labs/finance/AnnuityLab.tsx', 'apps/web/src/components/labs/finance/BondLab.tsx',
    'apps/web/src/components/labs/matrices/RowReductionLab.tsx', 'apps/web/src/components/labs/matrices/MatrixOperationsLab.tsx',
    'apps/web/src/components/labs/applications/LinearProgrammingLab.tsx', 'apps/web/src/components/labs/applications/GameTheoryLab.tsx',
    'apps/web/src/components/labs/equivalence/EquivalenceLab.tsx',
  ];
  for (const path of radioSources) {
    const source = read(path);
    assert.doesNotMatch(source, /<input type="radio"(?![^>]*\bname=)/);
  }
  const buttonSources = [
    'apps/web/src/components/labs/matrices/RowReductionLab.tsx', 'apps/web/src/components/labs/matrices/MatrixOperationsLab.tsx',
    'apps/web/src/components/labs/applications/LinearProgrammingLab.tsx', 'apps/web/src/components/labs/applications/GameTheoryLab.tsx',
    'apps/web/src/components/labs/equivalence/EquivalenceLab.tsx',
  ];
  for (const path of buttonSources) assert.doesNotMatch(read(path), /<button(?![^>]*\btype=)/, `${path} contains an implicit submit button`);
});

test('interactive controls retain a browser-safe 44px floor with 45px on cross-engine disclosure targets', () => {
  assert.match(instrument, /\.amat-button[^}]*min-height:\s*44px/s);
  assert.match(instrument, /\.text-input[^}]*min-height:\s*44px/s);
  assert.match(instrument, /\.mobile-more-menu__link[^}]*min-height:\s*48px/s);
  assert.match(instrument, /\.cashflow-ledger__row input[^}]*min-height:\s*44px/s);
  assert.match(instrument, /\.prediction-fieldset label[^}]*min-height:\s*44px/s);
  assert.match(instrument, /\.lab-about > summary,[\s\S]*min-height:\s*45px/s);
});

test('motion, transparency, contrast, and forced-color preferences have explicit durable behavior', () => {
  assert.match(instrument, /prefers-contrast:\s*more/);
  assert.match(instrument, /prefers-reduced-transparency:\s*reduce/);
  assert.match(instrument, /prefers-reduced-motion:\s*reduce/);
  assert.match(instrument, /forced-colors:\s*active/);
  assert.match(theme, /forced-colors:\s*active[^]*--control-edge:\s*CanvasText/);
  assert.match(globalCss, /animation:\s*none\s*!important/);
  assert.match(globalCss, /transition:\s*none\s*!important/);
  assert.doesNotMatch(`${globalCss}\n${instrument}`, /0?\.0?1ms|\.01ms/);
});

test('responsive instrument layouts explicitly collapse for tablet and phone', () => {
  assert.match(instrument, /@media \(max-width:\s*820px\)/);
  assert.match(instrument, /\.conditional-instrument, \.finance-instrument, \.game-instrument, \.markov-instrument[^}]*grid-template-columns:1fr/s);
  assert.match(instrument, /\.gauss-jordan-instrument[^}]*grid-template-columns:1fr/s);
  assert.match(instrument, /\.mobile-nav[^}]*grid-template-columns:\s*repeat\(5,\s*1fr\)/s);
});
