import type { ReactNode } from 'react';
export function FormulaBlock({label,formula,children}:{label?:string;formula:ReactNode;children?:ReactNode}){return <div className="formula-callout math-surface">{label&&<span>{label}</span>}<strong>{formula}</strong>{children&&<small>{children}</small>}</div>}
