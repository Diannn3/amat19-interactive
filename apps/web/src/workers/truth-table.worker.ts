/// <reference lib="webworker" />
import { buildTruthTable } from '@amat19/domain-logic';

self.onmessage = (event: MessageEvent<{ expression: string }>) => {
  try {
    const table = buildTruthTable(event.data.expression);
    self.postMessage({ ok: true, table });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown truth-table worker error.'
    });
  }
};

export {};
