import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../../apps/web/src/components/workbenches/RowOperationsCoach.tsx', import.meta.url), 'utf8');

test('linear workbench has one canonical goal layer and four Radix tab triggers', () => {
  assert.match(source, /from '@radix-ui\/react-tabs'/);
  assert.doesNotMatch(source, /activeMatrixTab|activeMatrixOp|matrixCells|matrixDim|detValue|isoProject/);
  assert.doesNotMatch(source, /3D Geometric View|Eigenvalues/);
  assert.match(source, /<Tabs\.Root[^>]*value=\{goal\}/);
  assert.equal((source.match(/<Tabs\.Trigger\b/g) ?? []).length, 4);
});

test('linear goal selection writes history and reacts to browser navigation', () => {
  assert.ok(source.includes('window.history.pushState'), 'goal selection must write browser history');
  assert.ok(source.includes("window.addEventListener('popstate'"), 'Back and Forward must restore the goal');
});

test('multiplication explanation uses the exact domain trace', () => {
  assert.ok(source.includes('multiplicationCellTrace'), 'trace must come from the domain engine');
  assert.ok(source.includes('Row-by-column trace'), 'revealed multiplication must explain its cells');
});

test('arithmetic dimension errors keep the editable mathematical surface mounted', () => {
  assert.ok(source.includes("kind: 'arithmetic-error'"), 'dimension errors need an arithmetic panel state');
});
