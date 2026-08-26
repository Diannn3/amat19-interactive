export type ArgumentPrediction = 'valid' | 'invalid';
export type ArgumentState = {
  premises: string[];
  conclusion: string;
  prediction?: ArgumentPrediction;
  revealed: boolean;
};

export type ArgumentAction =
  | { type: 'set-premise'; index: number; value: string }
  | { type: 'add-premise' }
  | { type: 'remove-premise'; index: number }
  | { type: 'set-conclusion'; value: string }
  | { type: 'predict'; value: ArgumentPrediction }
  | { type: 'reveal' }
  | { type: 'restore'; state: ArgumentState }
  | { type: 'reset' };

export const initialArgumentState: ArgumentState = {
  premises: ['A -> B', 'A | C'],
  conclusion: 'B | C',
  revealed: false
};

export function argumentReducer(state: ArgumentState, action: ArgumentAction): ArgumentState {
  switch (action.type) {
    case 'set-premise':
      return { ...state, premises: state.premises.map((value, index) => index === action.index ? action.value : value), revealed: false };
    case 'add-premise':
      return { ...state, premises: [...state.premises, ''], revealed: false };
    case 'remove-premise':
      return { ...state, premises: state.premises.filter((_, index) => index !== action.index), revealed: false };
    case 'set-conclusion':
      return { ...state, conclusion: action.value, revealed: false };
    case 'predict':
      return { ...state, prediction: action.value, revealed: false };
    case 'reveal':
      return { ...state, revealed: true };
    case 'restore':
      return action.state;
    case 'reset':
      return initialArgumentState;
  }
}
