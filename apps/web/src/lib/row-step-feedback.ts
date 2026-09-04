import {
  addMatrices,
  applyRowOperation,
  DEFAULT_INTERACTIVE_MATRIX_INPUT_LIMITS,
  matricesEqual,
  multiplyMatrices,
  parseMatrixText,
  subtractMatrices,
  type Matrix,
  type RowOperationInput,
} from '@amat19/domain-linear';

export type RowStepFeedback = {
  status: 'correct' | 'incorrect' | 'invalid' | 'model-error';
  code: 'correct' | 'wrong-column' | 'unchanged' | 'invalid-row' | 'operation' | 'model';
  field?: 'candidate';
  message: string;
};

export type ArithmeticOperation = 'add' | 'subtract' | 'multiply';

export type MatrixArithmeticFeedback = {
  status: 'correct' | 'incorrect' | 'invalid' | 'model-error';
  code: 'correct' | 'wrong-cell' | 'invalid-shape' | 'model';
  field?: 'candidate';
  message: string;
};

function targetRowFor(operation: RowOperationInput) {
  return operation.kind === 'swap' ? operation.rowA : operation.kind === 'scale' ? operation.row : operation.targetRow;
}

function parseCandidate(raw: string) {
  return parseMatrixText(raw, DEFAULT_INTERACTIVE_MATRIX_INPUT_LIMITS);
}

/** Check only the row the learner is changing; the exact domain operation remains authoritative. */
export function checkRowStep(current: Matrix, operation: RowOperationInput, candidateRaw: string): RowStepFeedback {
  let next: Matrix;
  try {
    next = applyRowOperation(current, operation).matrix;
  } catch (error) {
    return {
      status: 'model-error',
      code: 'operation',
      message: `Check the operation first. ${error instanceof Error ? error.message : 'This move is not valid.'}`,
    };
  }

  let candidate: Matrix;
  try {
    candidate = parseCandidate(candidateRaw);
  } catch (error) {
    return {
      status: 'invalid',
      code: 'invalid-row',
      field: 'candidate',
      message: `Enter one complete row with exact values separated by spaces. ${error instanceof Error ? error.message : ''}`.trim(),
    };
  }

  const rowIndex = targetRowFor(operation);
  const expectedRow = next[rowIndex];
  if (!expectedRow || candidate.length !== 1 || candidate[0]!.length !== expectedRow.length) {
    return {
      status: 'invalid',
      code: 'invalid-row',
      field: 'candidate',
      message: `Enter exactly one row with ${expectedRow?.length ?? current[0]?.length ?? 0} entries.`,
    };
  }

  if (candidate[0]!.every((value, column) => value.equals(expectedRow[column]!))) {
    return {
      status: 'correct',
      code: 'correct',
      message: 'Correct. Check the move, then apply it to the matrix.',
    };
  }

  const currentRow = current[rowIndex];
  if (currentRow && candidate[0]!.every((value, column) => value.equals(currentRow[column]!))) {
    return {
      status: 'incorrect',
      code: 'unchanged',
      field: 'candidate',
      message: 'This row is unchanged. Recheck the operation before applying it.',
    };
  }

  const firstWrongColumn = candidate[0]!.findIndex((value, column) => !value.equals(expectedRow[column]!));
  return {
    status: 'incorrect',
    code: 'wrong-column',
    field: 'candidate',
    message: `Column ${firstWrongColumn + 1} is off. Recheck the row operation across that entry before applying the move.`,
  };
}

function arithmeticResult(left: Matrix, right: Matrix, operation: ArithmeticOperation): Matrix {
  if (operation === 'add') return addMatrices(left, right);
  if (operation === 'subtract') return subtractMatrices(left, right);
  return multiplyMatrices(left, right);
}

/** Check a complete matrix result cell-by-cell without exposing the target matrix as a shortcut. */
export function checkMatrixArithmetic(
  left: Matrix,
  right: Matrix,
  operation: ArithmeticOperation,
  candidateRaw: string,
): MatrixArithmeticFeedback {
  let expected: Matrix;
  try {
    expected = arithmeticResult(left, right, operation);
  } catch (error) {
    return {
      status: 'model-error',
      code: 'model',
      message: `Check the matrix dimensions first. ${error instanceof Error ? error.message : 'These matrices cannot be combined.'}`,
    };
  }

  let candidate: Matrix;
  try {
    candidate = parseCandidate(candidateRaw);
  } catch (error) {
    return {
      status: 'invalid',
      code: 'invalid-shape',
      field: 'candidate',
      message: `Enter the complete result matrix, one row per line. ${error instanceof Error ? error.message : ''}`.trim(),
    };
  }

  if (candidate.length !== expected.length || candidate[0]!.length !== expected[0]!.length) {
    return {
      status: 'invalid',
      code: 'invalid-shape',
      field: 'candidate',
      message: `The result needs ${expected.length} row${expected.length === 1 ? '' : 's'} and ${expected[0]!.length} column${expected[0]!.length === 1 ? '' : 's'}.`,
    };
  }

  if (matricesEqual(candidate, expected)) {
    return {
      status: 'correct',
      code: 'correct',
      message: 'Correct. The exact matrix result matches.',
    };
  }

  for (let row = 0; row < expected.length; row += 1) {
    for (let column = 0; column < expected[row]!.length; column += 1) {
      if (!candidate[row]![column]!.equals(expected[row]![column]!)) {
        return {
          status: 'incorrect',
          code: 'wrong-cell',
          field: 'candidate',
          message: `Row ${row + 1}, column ${column + 1} is off. Recheck the ${operation === 'multiply' ? 'row-by-column products' : 'entrywise arithmetic'} there.`,
        };
      }
    }
  }

  return { status: 'incorrect', code: 'wrong-cell', field: 'candidate', message: 'Recheck the matrix arithmetic.' };
}

export { arithmeticResult };
