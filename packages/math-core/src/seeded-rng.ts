export type SeededUint32 = () => number;
export type SeededRandom = () => number;
export const UINT32_RANGE = 4294967296;

function xmur3(input: string): () => number {
  let hash = 1779033703 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    hash = Math.imul(hash ^ input.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

export function createSeededUint32(seed: string): SeededUint32 {
  const makeSeed = xmur3(seed);
  let state = makeSeed();
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  };
}

export function createSeededRandom(seed: string): SeededRandom {
  const uint32 = createSeededUint32(seed);
  return () => uint32() / UINT32_RANGE;
}

export function stableHash(input: string): string {
  return xmur3(input)().toString(36);
}
