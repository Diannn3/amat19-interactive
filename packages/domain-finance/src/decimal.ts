const SCALE_DIGITS=30;
const SCALE=10n**BigInt(SCALE_DIGITS);
function abs(v:bigint){return v<0n?-v:v}
function parsePlain(value:string):bigint{
 let s=value.trim().toLowerCase();if(!s)throw new TypeError('Decimal value is empty.');
 let sign=1n;if(s.startsWith('-')){sign=-1n;s=s.slice(1)}else if(s.startsWith('+'))s=s.slice(1);
 let exponent=0;if(s.includes('e')){const parts=s.split('e');if(parts.length!==2)throw new TypeError('Invalid decimal value.');s=parts[0]!;exponent=Number(parts[1]);if(!Number.isInteger(exponent))throw new TypeError('Invalid decimal exponent.');}
 const [wholeRaw='0',fracRaw='']=s.split('.');if(!/^\d+$/.test(wholeRaw||'0')||!/^\d*$/.test(fracRaw))throw new TypeError('Invalid decimal value.');
 let digits=(wholeRaw||'0')+fracRaw;let decimalPlaces=fracRaw.length-exponent;
 if(decimalPlaces<0){digits+= '0'.repeat(-decimalPlaces);decimalPlaces=0;}
 if(decimalPlaces>SCALE_DIGITS){const keep=digits.slice(0,digits.length-(decimalPlaces-SCALE_DIGITS));const discarded=digits.slice(digits.length-(decimalPlaces-SCALE_DIGITS));let raw=BigInt(keep||'0');if(discarded[0]&&Number(discarded[0])>=5)raw+=1n;return sign*raw;}
 const raw=BigInt(digits||'0')*10n**BigInt(SCALE_DIGITS-decimalPlaces);return sign*raw;
}
function divRound(numerator:bigint,denominator:bigint):bigint{if(denominator===0n)throw new RangeError('Division by zero.');const sign=(numerator<0n)!==(denominator<0n)?-1n:1n;const n=abs(numerator),d=abs(denominator);const q=n/d,r=n%d;return sign*(q+(r*2n>=d?1n:0n));}
export class FinanceDecimal{
 readonly raw:bigint;
 private constructor(raw:bigint){this.raw=raw}
 static from(value:FinanceDecimal|number|string|bigint):FinanceDecimal{if(value instanceof FinanceDecimal)return value;if(typeof value==='bigint')return new FinanceDecimal(value*SCALE);if(typeof value==='number'){if(!Number.isFinite(value))throw new RangeError('Finance values must be finite.');return new FinanceDecimal(parsePlain(String(value)));}return new FinanceDecimal(parsePlain(value));}
 static zero(){return new FinanceDecimal(0n)} static one(){return new FinanceDecimal(SCALE)}
 add(other:FinanceDecimal|number|string|bigint){return new FinanceDecimal(this.raw+FinanceDecimal.from(other).raw)}
 subtract(other:FinanceDecimal|number|string|bigint){return new FinanceDecimal(this.raw-FinanceDecimal.from(other).raw)}
 multiply(other:FinanceDecimal|number|string|bigint){return new FinanceDecimal(divRound(this.raw*FinanceDecimal.from(other).raw,SCALE))}
 divide(other:FinanceDecimal|number|string|bigint){const d=FinanceDecimal.from(other).raw;return new FinanceDecimal(divRound(this.raw*SCALE,d))}
 negate(){return new FinanceDecimal(-this.raw)} abs(){return new FinanceDecimal(abs(this.raw))}
 compare(other:FinanceDecimal|number|string|bigint){const b=FinanceDecimal.from(other).raw;return this.raw===b?0:this.raw<b?-1:1}
 powInt(exponent:number):FinanceDecimal{if(!Number.isInteger(exponent))throw new RangeError('Integer power expected.');if(exponent===0)return FinanceDecimal.one();if(exponent<0)return FinanceDecimal.one().divide(this.powInt(-exponent));let result=FinanceDecimal.one(),base:FinanceDecimal=this,e=exponent;while(e>0){if(e%2===1)result=result.multiply(base);e=Math.floor(e/2);if(e)base=base.multiply(base);}return result}
 rootInt(n:number):FinanceDecimal{if(!Number.isInteger(n)||n<=0)throw new RangeError('Root degree must be a positive integer.');if(n===1)return this;if(this.raw<0n&&n%2===0)throw new RangeError('Even root of a negative value is not real.');if(this.raw===0n)return FinanceDecimal.zero();const negative=this.raw<0n;const target:FinanceDecimal=negative?this.negate():this;let guess=FinanceDecimal.from(Math.pow(target.toNumber(),1/n));if(guess.raw===0n)guess=FinanceDecimal.one();for(let i=0;i<22;i++){const denom=guess.powInt(n-1);const next=guess.multiply(n-1).add(target.divide(denom)).divide(n);if(abs(next.raw-guess.raw)<=1n){guess=next;break}guess=next;}return negative?guess.negate():guess}
 powRational(exponent:number):FinanceDecimal{if(!Number.isFinite(exponent))throw new RangeError('Exponent must be finite.');if(Number.isInteger(exponent))return this.powInt(exponent);const text=String(exponent);const match=text.match(/^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i);if(!match)return FinanceDecimal.from(Math.pow(this.toNumber(),exponent));let frac=match[3]??'',exp=Number(match[4]??0),num=BigInt((match[2]??'0')+frac),den=10n**BigInt(frac.length);if(exp>0)num*=10n**BigInt(exp);if(exp<0)den*=10n**BigInt(-exp);if(match[1]==='-')num=-num;const gcd=(a:bigint,b:bigint):bigint=>{a=abs(a);b=abs(b);while(b){[a,b]=[b,a%b]}return a||1n};const g=gcd(num,den);num/=g;den/=g;if(den>10000n)return FinanceDecimal.from(Math.pow(this.toNumber(),exponent));const powered=this.powInt(Number(abs(num)));const rooted=powered.rootInt(Number(den));return num<0n?FinanceDecimal.one().divide(rooted):rooted}
 toNumber(){return Number(this.raw)/Number(SCALE)}
 toString(maxPlaces=SCALE_DIGITS){const neg=this.raw<0n;const raw=abs(this.raw);const whole=raw/SCALE;let frac=(raw%SCALE).toString().padStart(SCALE_DIGITS,'0').slice(0,Math.max(0,Math.min(SCALE_DIGITS,maxPlaces))).replace(/0+$/,'');return `${neg?'-':''}${whole}${frac?'.'+frac:''}`}
 toFixed(places:number){if(!Number.isInteger(places)||places<0||places>SCALE_DIGITS)throw new RangeError(`Decimal places must be between 0 and ${SCALE_DIGITS}.`);const factor=10n**BigInt(SCALE_DIGITS-places);const rounded=divRound(this.raw,factor);const neg=rounded<0n;const raw=abs(rounded);const base=10n**BigInt(places);const whole=raw/base;const frac=places?(raw%base).toString().padStart(places,'0'):'';return`${neg?'-':''}${whole}${places?'.'+frac:''}`}
}
