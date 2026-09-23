import type { FinanceResult } from '@amat19/domain-finance';

export function financeCertaintyLabel(result:Pick<FinanceResult,'certainty'|'precisionDigits'|'roundingMode'>):string{
 if(result.certainty==='iterative-approximation')return `Iterative approximation · ${result.precisionDigits}-digit fixed-point workspace · ${result.roundingMode} rounding`;
 if(result.certainty==='exact')return 'Exact under the declared finance representation';
 return `${result.precisionDigits}-digit fixed-point result · ${result.roundingMode} rounding`;
}
