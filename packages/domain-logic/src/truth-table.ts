import { evaluateLogic } from './evaluate.ts';
import { collectDisplayNodes, formatLogic } from './format.ts';
import { parseLogic } from './parser.ts';
import type { Assignment, LogicNode, TruthTable, TruthTableColumn, TruthTableRow } from './types.ts';
import { extractSymbols } from './variables.ts';

export const MAX_TRUTH_TABLE_SYMBOLS = 8;

export function generateAssignments(symbols: string[]): Assignment[] {
  if (symbols.length > MAX_TRUTH_TABLE_SYMBOLS) {
    throw new RangeError(
      `Truth-table analysis currently supports at most ${MAX_TRUTH_TABLE_SYMBOLS} unique symbols; received ${symbols.length}.`
    );
  }

  const count = 2 ** symbols.length;
  return Array.from({ length: count }, (_, rowIndex) => {
    const assignment: Assignment = {};
    symbols.forEach((symbol, symbolIndex) => {
      const bit = 1 << (symbols.length - 1 - symbolIndex);
      assignment[symbol] = (rowIndex & bit) === 0;
    });
    return assignment;
  });
}

function classifyRows(rows: TruthTableRow[]): TruthTable['classification'] {
  const allTrue = rows.every((row) => row.finalValue);
  const allFalse = rows.every((row) => !row.finalValue);
  if (allTrue) return 'tautology';
  if (allFalse) return 'contradiction';
  return 'contingent';
}

function buildColumns(root: LogicNode, symbols: string[]): TruthTableColumn[] {
  const displayNodes = collectDisplayNodes(root);
  const compoundColumns = displayNodes.map((node, index) => ({
    id: `node:${node.id}`,
    label: formatLogic(node),
    nodeId: node.id,
    kind: index === displayNodes.length - 1 ? 'result' as const : 'subexpression' as const
  }));

  return [
    ...symbols.map((symbol) => ({ id: `var:${symbol}`, label: symbol, kind: 'variable' as const })),
    ...compoundColumns
  ];
}

export function buildTruthTableFromAst(root: LogicNode, expression = formatLogic(root)): TruthTable {
  const symbols = extractSymbols(root);
  if (symbols.length > MAX_TRUTH_TABLE_SYMBOLS) {
    throw new RangeError(
      `This lab currently supports at most ${MAX_TRUTH_TABLE_SYMBOLS} unique symbols; the expression has ${symbols.length}.`
    );
  }

  const columns = buildColumns(root, symbols);
  const rows = generateAssignments(symbols).map((assignment, index): TruthTableRow => {
    const evaluation = evaluateLogic(root, assignment);
    const values: Record<string, boolean> = {};
    columns.forEach((column) => {
      if (column.kind === 'variable') {
        values[column.id] = assignment[column.label]!;
      } else if (column.nodeId) {
        values[column.id] = evaluation.byNodeId[column.nodeId]!.value;
      }
    });

    return {
      index,
      assignment,
      values,
      finalValue: evaluation.value
    };
  });

  return {
    expression,
    ast: root,
    symbols,
    columns,
    rows,
    classification: classifyRows(rows)
  };
}

export function buildTruthTable(expression: string): TruthTable {
  return buildTruthTableFromAst(parseLogic(expression), expression);
}
