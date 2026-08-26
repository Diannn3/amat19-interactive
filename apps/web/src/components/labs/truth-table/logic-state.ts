import type { CheckResult } from '@amat19/learning-engine';

export type LabMode = 'explore' | 'practice' | 'argument';

export type SelectedCell = {
  rowIndex: number;
  columnId: string;
  nodeId?: string;
};

export type PracticeGuess = {
  value: boolean;
  status: 'correct' | 'wrong';
};

export type TruthLabState = {
  mode: LabMode;
  expression: string;
  selectedNodeId?: string;
  selectedCell?: SelectedCell;
  selectedPracticeRow: number;
  practiceGuesses: Record<number, PracticeGuess>;
  feedback?: CheckResult;
  hintVisible: boolean;
  persistenceStatus: 'idle' | 'loading' | 'saved' | 'unavailable';
};

export type TruthLabAction =
  | { type: 'set-mode'; mode: LabMode }
  | { type: 'set-expression'; expression: string }
  | { type: 'select-node'; nodeId: string }
  | { type: 'select-cell'; cell: SelectedCell }
  | { type: 'select-practice-row'; rowIndex: number }
  | { type: 'record-practice-guess'; rowIndex: number; value: boolean; status: PracticeGuess['status']; feedback: CheckResult }
  | { type: 'restore-expression'; expression: string }
  | { type: 'set-persistence-status'; status: TruthLabState['persistenceStatus'] }
  | { type: 'reveal-hint' }
  | { type: 'reset-practice' };

export const initialTruthLabState: TruthLabState = {
  mode: 'explore',
  expression: '(P -> Q) <-> (~Q -> ~P)',
  selectedPracticeRow: 0,
  practiceGuesses: {},
  hintVisible: false,
  persistenceStatus: 'loading'
};

export function truthLabReducer(state: TruthLabState, action: TruthLabAction): TruthLabState {
  switch (action.type) {
    case 'set-mode':
      return { ...state, mode: action.mode, feedback: undefined, hintVisible: false };
    case 'set-expression':
      return {
        ...state,
        expression: action.expression,
        selectedNodeId: undefined,
        selectedCell: undefined,
        practiceGuesses: {},
        selectedPracticeRow: 0,
        feedback: undefined,
        hintVisible: false
      };
    case 'select-node':
      return {
        ...state,
        selectedNodeId: action.nodeId,
        practiceGuesses: state.mode === 'practice' ? {} : state.practiceGuesses,
        feedback: state.mode === 'practice' ? undefined : state.feedback,
        hintVisible: false
      };
    case 'select-cell':
      return {
        ...state,
        selectedCell: action.cell,
        selectedNodeId: action.cell.nodeId ?? state.selectedNodeId,
        hintVisible: false
      };
    case 'select-practice-row':
      return { ...state, selectedPracticeRow: action.rowIndex, feedback: undefined, hintVisible: false };
    case 'record-practice-guess':
      return {
        ...state,
        practiceGuesses: {
          ...state.practiceGuesses,
          [action.rowIndex]: { value: action.value, status: action.status }
        },
        feedback: action.feedback,
        selectedPracticeRow: action.rowIndex,
        hintVisible: false
      };
    case 'restore-expression':
      return { ...state, expression: action.expression, persistenceStatus: 'saved' };
    case 'set-persistence-status':
      return { ...state, persistenceStatus: action.status };
    case 'reveal-hint':
      return { ...state, hintVisible: true };
    case 'reset-practice':
      return { ...state, practiceGuesses: {}, selectedPracticeRow: 0, feedback: undefined, hintVisible: false };
  }
}
