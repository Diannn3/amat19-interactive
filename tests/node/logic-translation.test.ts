import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOGIC_TRANSLATION_PROMPTS,
  checkLogicTranslation,
} from '../../apps/web/src/lib/logic-translation.ts';

test('every controlled-language prompt has a parseable canonical answer', () => {
  for (const prompt of LOGIC_TRANSLATION_PROMPTS) {
    assert.equal(checkLogicTranslation(prompt.expected, prompt.expected).status, 'correct', prompt.id);
  }
});

test('logic translation accepts keyboard aliases for the same notation', () => {
  const prompt = LOGIC_TRANSLATION_PROMPTS.find((item) => item.id === 'only-if');
  assert.ok(prompt);
  assert.equal(checkLogicTranslation('P -> Q', prompt.expected).status, 'correct');
});

test('logic translation gives local feedback without revealing the target', () => {
  const prompt = LOGIC_TRANSLATION_PROMPTS.find((item) => item.id === 'only-if');
  assert.ok(prompt);
  const wrong = checkLogicTranslation('Q -> P', prompt.expected);
  assert.equal(wrong.status, 'incorrect');
  assert.doesNotMatch(wrong.message, /P.*→.*Q|P.*->.*Q/i);
});

test('logic translation rejects malformed input without exposing an answer', () => {
  const prompt = LOGIC_TRANSLATION_PROMPTS[0]!;
  const invalid = checkLogicTranslation('P ->', prompt.expected);
  assert.equal(invalid.status, 'invalid');
  assert.doesNotMatch(invalid.message, /P.*→|P.*->/i);
});
