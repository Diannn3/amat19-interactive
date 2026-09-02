export type MatrixCompatibilityOperation = 'add' | 'subtract' | 'multiply';
export type MatrixCompatibilitySkill = 'linear.matrix.add' | 'linear.matrix.multiply';

export function matrixCompatibilitySkill(operation: MatrixCompatibilityOperation): MatrixCompatibilitySkill {
  return operation === 'multiply' ? 'linear.matrix.multiply' : 'linear.matrix.add';
}
