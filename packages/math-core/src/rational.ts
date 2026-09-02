function bigintAbs(value: bigint): bigint { return value < 0n ? -value : value; }
function gcd(a: bigint, b: bigint): bigint {
  let x = bigintAbs(a), y = bigintAbs(b);
  while (y !== 0n) [x, y] = [y, x % y];
  return x === 0n ? 1n : x;
}

export const MAX_RATIONAL_TEXT_DIGITS = 10_000;
export const MAX_RATIONAL_DECIMAL_EXPONENT = 10_000;
export const MAX_RATIONAL_RESULT_DIGITS = 20_000;

function pow10(exponent: number): bigint {
  if (!Number.isInteger(exponent) || exponent < 0) throw new RangeError('Exponent must be a nonnegative integer.');
  if (exponent > MAX_RATIONAL_DECIMAL_EXPONENT) throw new RangeError(`Decimal exponent magnitude cannot exceed ${MAX_RATIONAL_DECIMAL_EXPONENT}.`);
  return 10n ** BigInt(exponent);
}

function assertDigitBudget(text: string): void {
  const digits = (text.match(/\d/g) ?? []).length;
  if (digits > MAX_RATIONAL_TEXT_DIGITS) throw new RangeError(`Exact rational text cannot contain more than ${MAX_RATIONAL_TEXT_DIGITS} digits.`);
}


function bigintDigits(value: bigint): number { return bigintAbs(value).toString().length; }
function assertRawRationalBudget(numerator: bigint, denominator: bigint): void {
  if (bigintDigits(numerator) > MAX_RATIONAL_RESULT_DIGITS || bigintDigits(denominator) > MAX_RATIONAL_RESULT_DIGITS) {
    throw new RangeError(`Exact rational numerator and denominator cannot exceed ${MAX_RATIONAL_RESULT_DIGITS} digits.`);
  }
}
function exactInteger(value: bigint | number | string, name: string): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new RangeError(`${name} supplied as a JavaScript number must be a safe integer; use a string or bigint for larger exact integers.`);
    return BigInt(value);
  }
  const text = value.trim();
  if (!/^[+-]?\d+$/.test(text)) throw new SyntaxError(`${name} must be an exact integer.`);
  assertDigitBudget(text);
  return BigInt(text);
}
function assertProductBudget(left: bigint, right: bigint, label: string): void {
  if (left === 0n || right === 0n) return;
  if (bigintDigits(left) + bigintDigits(right) - 1 > MAX_RATIONAL_RESULT_DIGITS) {
    throw new RangeError(`${label} would exceed the ${MAX_RATIONAL_RESULT_DIGITS}-digit exact rational work budget.`);
  }
}

function decimalPartsToRational(signText: string, wholeText: string, fractionText: string, exponentText?: string): Rational {
  const sign = signText === '-' ? -1n : 1n;
  const whole = wholeText || '0';
  const fraction = fractionText || '';
  const exponent = exponentText === undefined ? 0 : Number(exponentText);
  if (!Number.isInteger(exponent) || Math.abs(exponent) > MAX_RATIONAL_DECIMAL_EXPONENT) {
    throw new RangeError(`Decimal exponent magnitude cannot exceed ${MAX_RATIONAL_DECIMAL_EXPONENT}.`);
  }
  const combined = `${whole}${fraction}`.replace(/^0+(?=\d)/, '') || '0';
  const decimalScale = fraction.length - exponent;
  if (decimalScale >= 0) return new Rational(sign * BigInt(combined), pow10(decimalScale));
  return new Rational(sign * BigInt(combined) * pow10(-decimalScale));
}

export type RationalLike = Rational | bigint | number | string;
export class Rational {
  readonly numerator: bigint;
  readonly denominator: bigint;
  constructor(numerator: bigint | number | string, denominator: bigint | number | string = 1n) {
    const n = exactInteger(numerator, 'Rational numerator'), d = exactInteger(denominator, 'Rational denominator');
    assertRawRationalBudget(n, d);
    if (d === 0n) throw new RangeError('A rational denominator cannot be zero.');
    const sign = d < 0n ? -1n : 1n, divisor = gcd(n, d);
    this.numerator = sign * (n / divisor);
    this.denominator = bigintAbs(d / divisor);
  }
  static zero(): Rational { return new Rational(0n); }
  static one(): Rational { return new Rational(1n); }
  static from(value: RationalLike): Rational {
    if (value instanceof Rational) return value;
    if (typeof value === 'bigint') return new Rational(value);
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new RangeError('Numeric values must be finite.');
      if (Math.abs(value) > Number.MAX_SAFE_INTEGER) throw new RangeError('Exact rational numbers outside the safe JavaScript numeric range must be supplied as a string or bigint.');
      return Rational.parse(String(value));
    }
    return Rational.parse(value);
  }
  static parse(raw: string): Rational {
    const text = raw.trim();
    if (!text) throw new SyntaxError('An exact rational value cannot be empty.');
    assertDigitBudget(text);
    if (/^[+-]?\d+$/.test(text)) return new Rational(text);
    const fraction = text.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
    if (fraction) return new Rational(fraction[1]!, fraction[2]!);
    const decimal = text.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/);
    if (decimal) {
      const whole = decimal[2] ?? '0';
      const fractionDigits = decimal[3] ?? decimal[4] ?? '';
      return decimalPartsToRational(decimal[1]!, whole, fractionDigits, decimal[5]);
    }
    throw new SyntaxError(`“${raw}” is not an exact integer, fraction, decimal, or decimal exponent form.`);
  }
  add(other: RationalLike): Rational {
    const rhs = Rational.from(other);
    assertProductBudget(this.numerator, rhs.denominator, 'Rational addition');
    assertProductBudget(rhs.numerator, this.denominator, 'Rational addition');
    assertProductBudget(this.denominator, rhs.denominator, 'Rational addition');
    return new Rational(this.numerator * rhs.denominator + rhs.numerator * this.denominator, this.denominator * rhs.denominator);
  }
  subtract(other: RationalLike): Rational {
    const rhs = Rational.from(other);
    assertProductBudget(this.numerator, rhs.denominator, 'Rational subtraction');
    assertProductBudget(rhs.numerator, this.denominator, 'Rational subtraction');
    assertProductBudget(this.denominator, rhs.denominator, 'Rational subtraction');
    return new Rational(this.numerator * rhs.denominator - rhs.numerator * this.denominator, this.denominator * rhs.denominator);
  }
  multiply(other: RationalLike): Rational {
    const rhs = Rational.from(other);
    assertProductBudget(this.numerator, rhs.numerator, 'Rational multiplication');
    assertProductBudget(this.denominator, rhs.denominator, 'Rational multiplication');
    return new Rational(this.numerator * rhs.numerator, this.denominator * rhs.denominator);
  }
  divide(other: RationalLike): Rational {
    const rhs = Rational.from(other);
    if (rhs.numerator === 0n) throw new RangeError('Cannot divide by zero.');
    assertProductBudget(this.numerator, rhs.denominator, 'Rational division');
    assertProductBudget(this.denominator, rhs.numerator, 'Rational division');
    return new Rational(this.numerator * rhs.denominator, this.denominator * rhs.numerator);
  }
  negate(): Rational { return new Rational(-this.numerator, this.denominator); }
  abs(): Rational { return new Rational(bigintAbs(this.numerator), this.denominator); }
  reciprocal(): Rational {
    if (this.numerator === 0n) throw new RangeError('Zero does not have a reciprocal.');
    return new Rational(this.denominator, this.numerator);
  }
  pow(exponent: number): Rational {
    if (!Number.isInteger(exponent)) throw new RangeError('A rational power requires an integer exponent.');
    if (Math.abs(exponent) > MAX_RATIONAL_DECIMAL_EXPONENT) throw new RangeError(`Rational power magnitude cannot exceed ${MAX_RATIONAL_DECIMAL_EXPONENT}.`);
    if (exponent === 0) return Rational.one();
    if (exponent < 0) return this.reciprocal().pow(-exponent);
    const estimatedNumeratorDigits = this.numerator === 0n ? 1 : (bigintDigits(this.numerator) - 1) * exponent + 1;
    const estimatedDenominatorDigits = (bigintDigits(this.denominator) - 1) * exponent + 1;
    if (estimatedNumeratorDigits > MAX_RATIONAL_RESULT_DIGITS || estimatedDenominatorDigits > MAX_RATIONAL_RESULT_DIGITS) {
      throw new RangeError(`Rational power would exceed the ${MAX_RATIONAL_RESULT_DIGITS}-digit exact rational work budget.`);
    }
    return new Rational(this.numerator ** BigInt(exponent), this.denominator ** BigInt(exponent));
  }
  equals(other: RationalLike): boolean {
    const rhs = Rational.from(other);
    return this.numerator === rhs.numerator && this.denominator === rhs.denominator;
  }
  compare(other: RationalLike): -1 | 0 | 1 {
    const rhs = Rational.from(other), left = this.numerator * rhs.denominator, right = rhs.numerator * this.denominator;
    return left === right ? 0 : left < right ? -1 : 1;
  }
  isZero(): boolean { return this.numerator === 0n; }
  isPositive(): boolean { return this.numerator > 0n; }
  isNegative(): boolean { return this.numerator < 0n; }
  isProbability(): boolean { return this.compare(0n) >= 0 && this.compare(1n) <= 0; }
  /** Explicit approximate conversion for rendering/interoperability only. */
  toNumber(): number { return Number(this.numerator) / Number(this.denominator); }
  toString(): string { return this.denominator === 1n ? String(this.numerator) : `${this.numerator}/${this.denominator}`; }
  toDecimal(places = 6): string {
    if (!Number.isInteger(places) || places < 0 || places > 100) throw new RangeError('Decimal places must be an integer from 0 to 100.');
    const negative = this.numerator < 0n;
    const magnitude = bigintAbs(this.numerator);
    const scale = 10n ** BigInt(places);
    const scaled = magnitude * scale;
    let rounded = scaled / this.denominator;
    const remainder = scaled % this.denominator;
    if (remainder * 2n >= this.denominator) rounded += 1n;

    if (places === 0) return `${negative && rounded !== 0n ? '-' : ''}${rounded}`;
    const whole = rounded / scale;
    let fractional = (rounded % scale).toString().padStart(places, '0').replace(/0+$/, '');
    const sign = negative && rounded !== 0n ? '-' : '';
    return fractional ? `${sign}${whole}.${fractional}` : `${sign}${whole}`;
  }
}
export function sumRationals(values: RationalLike[]): Rational {
  return values.reduce<Rational>((sum, value) => sum.add(value), Rational.zero());
}
