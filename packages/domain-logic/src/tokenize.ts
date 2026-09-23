import { LogicParseError, type Token } from './types.ts';

export const MAX_LOGIC_INPUT_LENGTH = 4096;
export const MAX_LOGIC_TOKENS = 2048;

const SINGLE_CHAR_TOKENS: Record<string, Token['kind']> = {
  '~': 'not',
  '¬': 'not',
  '∼': 'not',
  '!': 'not',
  '&': 'and',
  '∧': 'and',
  '|': 'or',
  '∨': 'or',
  '→': 'implies',
  '↔': 'iff',
  '(': 'lparen',
  ')': 'rparen'
};

export function tokenizeLogic(input: string): Token[] {
  if (input.length > MAX_LOGIC_INPUT_LENGTH) {
    throw new LogicParseError('expression-too-large', `Logic input cannot exceed ${MAX_LOGIC_INPUT_LENGTH.toLocaleString()} characters.`, { start: MAX_LOGIC_INPUT_LENGTH, end: input.length });
  }
  const tokens: Token[] = [];
  const push = (token: Token) => {
    if (tokens.length >= MAX_LOGIC_TOKENS) throw new LogicParseError('expression-too-large', `Logic input cannot exceed ${MAX_LOGIC_TOKENS.toLocaleString()} tokens.`, token.span);
    tokens.push(token);
  };
  let index = 0;

  while (index < input.length) {
    const character = input[index]!;

    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }

    if (input.startsWith('<->', index)) {
      push({ kind: 'iff', lexeme: '<->', span: { start: index, end: index + 3 } });
      index += 3;
      continue;
    }

    if (input.startsWith('->', index)) {
      push({ kind: 'implies', lexeme: '->', span: { start: index, end: index + 2 } });
      index += 2;
      continue;
    }

    const singleKind = SINGLE_CHAR_TOKENS[character];
    if (singleKind) {
      push({ kind: singleKind, lexeme: character, span: { start: index, end: index + 1 } });
      index += 1;
      continue;
    }

    if (/[A-Za-z]/u.test(character)) {
      const start = index;
      index += 1;
      while (index < input.length && /[A-Za-z0-9_]/u.test(input[index]!)) {
        index += 1;
      }
      push({
        kind: 'identifier',
        lexeme: input.slice(start, index),
        span: { start, end: index }
      });
      continue;
    }

    throw new LogicParseError(
      'unexpected-character',
      `Unsupported character “${character}” at position ${index + 1}.`,
      { start: index, end: index + 1 }
    );
  }

  push({ kind: 'eof', lexeme: '', span: { start: input.length, end: input.length } });
  return tokens;
}
