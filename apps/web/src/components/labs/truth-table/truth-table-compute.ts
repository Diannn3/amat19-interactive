import { buildTruthTable, parseLogic, type TruthTable } from '@amat19/domain-logic';

const WORKER_SYMBOL_THRESHOLD = 5;

function countUniqueIdentifiers(expression: string): number {
  try {
    const ast = parseLogic(expression);
    const names = new Set<string>();
    const stack = [ast];
    while (stack.length) {
      const node = stack.pop()!;
      if (node.kind === 'identifier') names.add(node.name);
      else if (node.kind === 'not') stack.push(node.operand);
      else stack.push(node.left, node.right);
    }
    return names.size;
  } catch {
    return 0;
  }
}

export async function computeTruthTable(expression: string): Promise<TruthTable> {
  const symbolCount = countUniqueIdentifiers(expression);
  if (symbolCount < WORKER_SYMBOL_THRESHOLD || typeof Worker === 'undefined') {
    return buildTruthTable(expression);
  }

  return new Promise<TruthTable>((resolve) => {
    let settled = false;
    const worker = new Worker(new URL('../../../workers/truth-table.worker.ts', import.meta.url), { type: 'module' });
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve(buildTruthTable(expression));
    }, 2500);

    worker.onmessage = (event: MessageEvent<{ ok: true; table: TruthTable } | { ok: false }>) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      worker.terminate();
      if (event.data.ok) resolve(event.data.table);
      else resolve(buildTruthTable(expression));
    };

    worker.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      worker.terminate();
      resolve(buildTruthTable(expression));
    };

    worker.postMessage({ expression });
  });
}
