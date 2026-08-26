import {
  buildTruthTable,
  collectDisplayNodes,
  extractSymbols,
  LogicParseError,
  MAX_TRUTH_TABLE_SYMBOLS,
  parseLogic,
  type TruthTable
} from '@amat19/domain-logic';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { ArgumentMode } from './ArgumentMode';
import { BuildModePanel } from './BuildModePanel';
import { ClassificationPanel } from './ClassificationPanel';
import { ExpressionInput } from './ExpressionInput';
import { EvaluationPanel } from './EvaluationPanel';
import { initialTruthLabState, truthLabReducer } from './logic-state';
import { PracticePanel } from './PracticePanel';
import { RowPatternExplainer } from './RowPatternExplainer';
import { StructureStrip } from './StructureStrip';
import { computeTruthTable } from './truth-table-compute';
import { TruthTableView } from './TruthTableView';
import { useDraftPersistence } from './useDraftPersistence';
import { useTruthPracticePersistence } from './useTruthPracticePersistence';
import { Tabs, TabsList, TabsTrigger } from '../../ui/Tabs';
import './lab.css';

function parseErrorDetails(error: unknown): { message: string; span?: { start: number; end: number } } {
  if (error instanceof LogicParseError) return { message: error.message, span: error.span };
  if (error instanceof RangeError) return { message: error.message };
  if (error instanceof Error) return { message: error.message };
  return { message: 'The proposition could not be evaluated.' };
}

export default function TruthTableLab() {
  const [state, dispatch] = useReducer(truthLabReducer, initialTruthLabState);
  const [table, setTable] = useState<TruthTable>(() => buildTruthTable(initialTruthLabState.expression));
  const [computeError, setComputeError] = useState<{ message: string; span?: { start: number; end: number } }>();
  const [isComputing, setIsComputing] = useState(false);

  useDraftPersistence(state.expression, dispatch);

  const immediateParse = useMemo(() => {
    try {
      const ast = parseLogic(state.expression);
      const symbols = extractSymbols(ast);
      if (symbols.length > MAX_TRUTH_TABLE_SYMBOLS) {
        throw new RangeError(`This lab currently supports at most ${MAX_TRUTH_TABLE_SYMBOLS} unique symbols; the expression has ${symbols.length}.`);
      }
      return { ast, symbols, error: undefined };
    } catch (error) {
      return { ast: undefined, symbols: undefined, error: parseErrorDetails(error) };
    }
  }, [state.expression]);

  useEffect(() => {
    if (!immediateParse.ast) {
      setComputeError(immediateParse.error);
      setIsComputing(false);
      return;
    }
    let active = true;
    setIsComputing(true);
    setComputeError(undefined);
    computeTruthTable(state.expression)
      .then((nextTable) => {
        if (!active) return;
        setTable(nextTable);
        const nodes = collectDisplayNodes(nextTable.ast);
        if (nodes.length > 0 && !state.selectedNodeId) dispatch({ type: 'select-node', nodeId: nodes.at(-1)!.id });
      })
      .catch((error) => { if (active) setComputeError(parseErrorDetails(error)); })
      .finally(() => { if (active) setIsComputing(false); });
    return () => { active = false; };
  }, [state.expression, immediateParse.ast, immediateParse.error]);

  const visibleTable = immediateParse.ast && table.expression === state.expression ? table : undefined;
  const error = immediateParse.error ?? computeError;
  const fallbackPracticeColumn = visibleTable?.columns.filter((column) => column.nodeId).at(-1);
  const selectedPracticeColumn = visibleTable?.columns.find((column) => column.nodeId === state.selectedNodeId) ?? fallbackPracticeColumn;

  useTruthPracticePersistence(state, visibleTable, selectedPracticeColumn?.id);

  return (
    <div className="truth-lab" data-testid="truth-table-lab">
      <Tabs value={state.mode} onValueChange={(mode) => dispatch({ type: 'set-mode', mode: mode as 'explore' | 'build' | 'practice' | 'argument' })}>
        <TabsList aria-label="Truth table mode">
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="build">Build</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="argument">Argument</TabsTrigger>
        </TabsList>
      </Tabs>

      {state.mode === 'argument' ? <ArgumentMode /> : (
        <>
          <ExpressionInput expression={state.expression} error={error?.message} errorSpan={error?.span} onChange={(expression) => dispatch({ type: 'set-expression', expression })} />

          {isComputing && !visibleTable && immediateParse.symbols && (
            <div className="truth-lab__loading" role="status" aria-live="polite">
              Building {2 ** immediateParse.symbols.length} truth-table rows…
            </div>
          )}

          {visibleTable && selectedPracticeColumn && (
            <>
              <div className="truth-lab__meta" role="status" aria-live="polite">
                <span><strong>{visibleTable.symbols.length}</strong> symbol{visibleTable.symbols.length === 1 ? '' : 's'}</span>
                <span><strong>{visibleTable.rows.length}</strong> row{visibleTable.rows.length === 1 ? '' : 's'} = 2^{visibleTable.symbols.length}</span>
                <span>{isComputing ? 'Computing…' : state.persistenceStatus === 'saved' ? 'Draft saved locally' : state.persistenceStatus === 'unavailable' ? 'Local save unavailable' : ''}</span>
              </div>

              {state.mode === 'build' ? (
                <BuildModePanel table={visibleTable} />
              ) : (<>
              <RowPatternExplainer symbols={visibleTable.symbols} />
              <StructureStrip ast={visibleTable.ast} selectedNodeId={state.selectedNodeId} onSelect={(nodeId) => dispatch({ type: 'select-node', nodeId })} />

              <div className="truth-lab__workspace">
                <div className="truth-lab__main">
                  <TruthTableView
                    table={visibleTable}
                    mode={state.mode}
                    selectedNodeId={state.selectedNodeId}
                    selectedCell={state.selectedCell}
                    practiceColumnId={selectedPracticeColumn.id}
                    practiceGuesses={state.practiceGuesses}
                    selectedPracticeRow={state.selectedPracticeRow}
                    onSelectCell={(cell) => dispatch({ type: 'select-cell', cell })}
                    onSelectPracticeRow={(rowIndex) => dispatch({ type: 'select-practice-row', rowIndex })}
                  />
                </div>
                <div className="truth-lab__side">
                  {state.mode === 'explore'
                    ? <EvaluationPanel table={visibleTable} selectedCell={state.selectedCell} selectedNodeId={state.selectedNodeId} />
                    : <PracticePanel table={visibleTable} practiceColumnId={selectedPracticeColumn.id} state={state} dispatch={dispatch} />}
                </div>
              </div>

              <ClassificationPanel table={visibleTable} />
              </>)}
            </>
          )}
        </>
      )}
    </div>
  );
}
