export type SourceSpan = {
  start: number;
  end: number;
};

export type LogicOperator = 'not' | 'and' | 'or' | 'implies' | 'iff';

export type IdentifierNode = {
  kind: 'identifier';
  id: string;
  name: string;
  span: SourceSpan;
};

export type NotNode = {
  kind: 'not';
  id: string;
  operand: LogicNode;
  span: SourceSpan;
};

export type BinaryNode = {
  kind: 'and' | 'or' | 'implies' | 'iff';
  id: string;
  left: LogicNode;
  right: LogicNode;
  span: SourceSpan;
};

export type LogicNode = IdentifierNode | NotNode | BinaryNode;

export type TokenKind =
  | 'identifier'
  | 'not'
  | 'and'
  | 'or'
  | 'implies'
  | 'iff'
  | 'lparen'
  | 'rparen'
  | 'eof';

export type Token = {
  kind: TokenKind;
  lexeme: string;
  span: SourceSpan;
};

export type Assignment = Record<string, boolean>;

export type EvaluationStep = {
  nodeId: string;
  nodeKind: LogicNode['kind'];
  expression: string;
  value: boolean;
  childValues: boolean[];
  explanation: string;
};

export type EvaluationResult = {
  value: boolean;
  byNodeId: Record<string, EvaluationStep>;
};

export type TruthTableColumn = {
  id: string;
  label: string;
  nodeId?: string;
  kind: 'variable' | 'subexpression' | 'result';
};

export type TruthTableRow = {
  index: number;
  assignment: Assignment;
  values: Record<string, boolean>;
  finalValue: boolean;
};

export type TruthTable = {
  expression: string;
  ast: LogicNode;
  symbols: string[];
  columns: TruthTableColumn[];
  rows: TruthTableRow[];
  classification: 'tautology' | 'contradiction' | 'contingent';
};

export type LogicParseErrorCode =
  | 'unexpected-character'
  | 'unexpected-token'
  | 'missing-operand'
  | 'missing-rparen'
  | 'empty-expression'
  | 'expression-too-large'
  | 'expression-too-deep';

export class LogicParseError extends Error {
  readonly code: LogicParseErrorCode;
  readonly span: SourceSpan;

  constructor(code: LogicParseErrorCode, message: string, span: SourceSpan) {
    super(message);
    this.name = 'LogicParseError';
    this.code = code;
    this.span = span;
  }
}
