import { LogicParseError, type Token } from './types.ts';

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
  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    const character = input[index]!;

    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }

    if (input.startsWith('<->', index)) {
      tokens.push({ kind: 'iff', lexeme: '<->', span: { start: index, end: index + 3 } });
      index += 3;
      continue;
    }

    if (input.startsWith('->', index)) {
      tokens.push({ kind: 'implies', lexeme: '->', span: { start: index, end: index + 2 } });
      index += 2;
      continue;
    }

    const singleKind = SINGLE_CHAR_TOKENS[character];
    if (singleKind) {
      tokens.push({ kind: singleKind, lexeme: character, span: { start: index, end: index + 1 } });
      index += 1;
      continue;
    }

    if (/[A-Za-z]/u.test(character)) {
      const start = index;
      index += 1;
      while (index < input.length && /[A-Za-z0-9_]/u.test(input[index]!)) {
        index += 1;
      }
      tokens.push({
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

  tokens.push({ kind: 'eof', lexeme: '', span: { start: input.length, end: input.length } });
  return tokens;
}
