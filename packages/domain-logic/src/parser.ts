import { tokenizeLogic } from './tokenize.ts';

export const MAX_LOGIC_PARSE_DEPTH = 256;
import {
  LogicParseError,
  type BinaryNode,
  type LogicNode,
  type NotNode,
  type Token,
  type TokenKind
} from './types.ts';

function makeNodeId(kind: LogicNode['kind'], start: number, end: number): string {
  return `${kind}:${start}:${end}`;
}

class Parser {
  private cursor = 0;
  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): LogicNode {
    if (this.peek().kind === 'eof') {
      throw new LogicParseError('empty-expression', 'Enter a proposition first.', this.peek().span);
    }

    const expression = this.parseIff(0);
    const trailing = this.peek();
    if (trailing.kind !== 'eof') {
      throw new LogicParseError(
        'unexpected-token',
        `Unexpected token “${trailing.lexeme}”.`,
        trailing.span
      );
    }
    return expression;
  }

  private parseIff(depth: number): LogicNode {
    this.guardDepth(depth);
    let left = this.parseImplies(depth);
    while (this.match('iff')) {
      const right = this.parseImplies(depth);
      left = this.binary('iff', left, right);
    }
    return left;
  }

  private parseImplies(depth: number): LogicNode {
    this.guardDepth(depth);
    const left = this.parseOr(depth);
    if (this.match('implies')) {
      const right = this.parseImplies(depth);
      return this.binary('implies', left, right);
    }
    return left;
  }

  private parseOr(depth: number): LogicNode {
    this.guardDepth(depth);
    let left = this.parseAnd(depth);
    while (this.match('or')) {
      const right = this.parseAnd(depth);
      left = this.binary('or', left, right);
    }
    return left;
  }

  private parseAnd(depth: number): LogicNode {
    this.guardDepth(depth);
    let left = this.parseUnary(depth);
    while (this.match('and')) {
      const right = this.parseUnary(depth);
      left = this.binary('and', left, right);
    }
    return left;
  }

  private parseUnary(depth: number): LogicNode {
    this.guardDepth(depth);
    if (this.match('not')) {
      const operator = this.previous();
      if (this.peek().kind === 'eof' || this.peek().kind === 'rparen') {
        throw new LogicParseError('missing-operand', 'Negation needs a proposition after it.', operator.span);
      }
      const operand = this.parseUnary(depth + 1);
      const node: NotNode = {
        kind: 'not',
        id: makeNodeId('not', operator.span.start, operand.span.end),
        operand,
        span: { start: operator.span.start, end: operand.span.end }
      };
      return node;
    }

    if (this.match('identifier')) {
      const token = this.previous();
      return {
        kind: 'identifier',
        id: makeNodeId('identifier', token.span.start, token.span.end),
        name: token.lexeme.toUpperCase(),
        span: token.span
      };
    }

    if (this.match('lparen')) {
      const opening = this.previous();
      const expression = this.parseIff(0);
      if (!this.match('rparen')) {
        throw new LogicParseError(
          'missing-rparen',
          'This opening parenthesis needs a closing parenthesis.',
          opening.span
        );
      }
      return expression;
    }

    const token = this.peek();
    throw new LogicParseError(
      'unexpected-token',
      token.kind === 'eof' ? 'The proposition ends before an operand appears.' : `Expected a proposition, found “${token.lexeme}”.`,
      token.span
    );
  }

  private guardDepth(depth: number): void {
    if (depth <= MAX_LOGIC_PARSE_DEPTH) return;
    const token = this.peek();
    throw new LogicParseError('expression-too-deep', `Logic nesting cannot exceed ${MAX_LOGIC_PARSE_DEPTH} levels.`, token.span);
  }

  private binary(kind: BinaryNode['kind'], left: LogicNode, right: LogicNode): BinaryNode {
    return {
      kind,
      id: makeNodeId(kind, left.span.start, right.span.end),
      left,
      right,
      span: { start: left.span.start, end: right.span.end }
    };
  }

  private match(kind: TokenKind): boolean {
    if (this.peek().kind !== kind) return false;
    this.cursor += 1;
    return true;
  }

  private peek(): Token {
    return this.tokens[this.cursor]!;
  }

  private previous(): Token {
    return this.tokens[this.cursor - 1]!;
  }
}

export function parseLogic(input: string): LogicNode {
  return new Parser(tokenizeLogic(input)).parse();
}
