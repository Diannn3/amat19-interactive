function bigintAbs(value: bigint): bigint { return value < 0n ? -value : value; }
function gcd(a: bigint, b: bigint): bigint {
  let x = bigintAbs(a), y = bigintAbs(b);
  while (y !== 0n) [x, y] = [y, x % y];
  return x === 0n ? 1n : x;
}
function pow10(exponent: number): bigint {
  if (!Number.isInteger(exponent) || exponent < 0) throw new RangeError('Exponent must be a nonnegative integer.');
  return 10n ** BigInt(exponent);
}
export type RationalLike = Rational | bigint | number | string;
export class Rational {
  readonly numerator: bigint;
  readonly denominator: bigint;
  constructor(numerator: bigint | number | string, denominator: bigint | number | string = 1n) {
    const n = BigInt(numerator), d = BigInt(denominator);
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
      return Rational.parse(String(value));
    }
    return Rational.parse(value);
  }
  static parse(raw: string): Rational {
    const text = raw.trim();
    if (/^[+-]?\d+$/.test(text)) return new Rational(text);
    const fraction = text.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
    if (fraction) return new Rational(fraction[1]!, fraction[2]!);
    const decimal = text.match(/^([+-]?)(\d*)\.(\d+)$/);
    if (decimal) {
      const sign = decimal[1] === '-' ? -1n : 1n;
      const whole = decimal[2] || '0', places = decimal[3]!;
      return new Rational(sign * BigInt(`${whole}${places}`), pow10(places.length));
    }
    throw new SyntaxError(`“${raw}” is not an exact integer, fraction, or decimal.`);
  }
  add(other: RationalLike): Rational {
    const rhs = Rational.from(other);
    return new Rational(this.numerator * rhs.denominator + rhs.numerator * this.denominator, this.denominator * rhs.denominator);
  }
  subtract(other: RationalLike): Rational {
    const rhs = Rational.from(other);
    return new Rational(this.numerator * rhs.denominator - rhs.numerator * this.denominator, this.denominator * rhs.denominator);
  }
  multiply(other: RationalLike): Rational {
    const rhs = Rational.from(other);
    return new Rational(this.numerator * rhs.numerator, this.denominator * rhs.denominator);
  }
  divide(other: RationalLike): Rational {
    const rhs = Rational.from(other);
    if (rhs.numerator === 0n) throw new RangeError('Cannot divide by zero.');
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
    if (exponent === 0) return Rational.one();
    if (exponent < 0) return this.reciprocal().pow(-exponent);
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
  toNumber(): number { return Number(this.numerator) / Number(this.denominator); }
  toString(): string { return this.denominator === 1n ? String(this.numerator) : `${this.numerator}/${this.denominator}`; }
  toDecimal(places = 6): string {
    if (!Number.isInteger(places) || places < 0 || places > 15) throw new RangeError('Decimal places must be an integer from 0 to 15.');
    const fixed = this.toNumber().toFixed(places);
    return fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed;
  }
}
export function sumRationals(values: RationalLike[]): Rational {
  return values.reduce<Rational>((sum, value) => sum.add(value), Rational.zero());
}
