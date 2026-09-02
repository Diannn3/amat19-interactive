export type FinanceScalar = number | string;
export type NumericCertainty = 'exact' | 'fixed-point-rounded' | 'iterative-approximation';
export type FinanceTraceStep = { id: string; label: string; expression: string; explanation: string; value?: number; decimalValue?:string; /** @deprecated Compatibility alias; this name does not imply mathematical exactness. */ exactValue?:string };
export type FinanceResult = {
 value: number;
 decimalValue:string;
 /** @deprecated Compatibility alias for decimalValue; not a mathematical exactness claim. */ exactValue:string;
 certainty:NumericCertainty;
 precisionDigits:30;
 roundingMode:'half-up';
 warnings?:string[];
 trace: FinanceTraceStep[];
};
export type Cashflow = { time: FinanceScalar; amount: FinanceScalar; label?: string };
export type AnnuityTiming = 'immediate' | 'due';
export type ValueDirection = 'present' | 'future';
