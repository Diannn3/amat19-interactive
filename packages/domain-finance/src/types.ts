export type FinanceTraceStep = { id: string; label: string; expression: string; explanation: string; value?: number; exactValue?:string };
export type FinanceResult = { value: number; exactValue:string; trace: FinanceTraceStep[] };
export type Cashflow = { time: number; amount: number; label?: string };
export type AnnuityTiming = 'immediate' | 'due';
export type ValueDirection = 'present' | 'future';
