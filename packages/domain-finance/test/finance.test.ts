import assert from 'node:assert/strict'; import test from 'node:test';
import { BOND_CLASSIFICATION_POLICY,bondPrice,annuityPaymentForValue,annuityValue,compoundAccumulation,effectiveToNominal,nominalAccumulation,nominalToEffective,roundFinance,simpleAccumulation,valueAtTime,valueCashflowsAt} from '../src/index.ts';
const close=(actual:number,expected:number,tol=1e-9)=>assert.ok(Math.abs(actual-expected)<=tol,`${actual} ≉ ${expected}`);
test('simple interest accumulates only on principal',()=>close(simpleAccumulation(1000,.05,3).value,1150));
test('compound accumulation uses the effective accumulation factor',()=>close(compoundAccumulation(1000,.05,2).value,1102.5));
test('nominal quarterly accumulation matches direct periodic compounding',()=>close(nominalAccumulation(100,.025,4,3).value,100*(1+.025/4)**12));
test('nominal and effective rate conversions are inverse operations',()=>{const i=nominalToEffective(.08,4).value;close(effectiveToNominal(i,4).value,.08);});
test('moving money forward then backward returns the same value',()=>{const future=valueAtTime(250,0,5,.04).value;close(valueAtTime(future,5,0,.04).value,250);});
test('cashflows are combined only at one focal date',()=>{const result=valueCashflowsAt([{time:0,amount:100},{time:1,amount:100}],1,.1);close(result.value,210);});
test('annuity immediate present and future values are consistent',()=>{const pv=annuityValue(100,.05,4,'immediate','present').value;const fv=annuityValue(100,.05,4,'immediate','future').value;close(pv*(1.05**4),fv);});
test('annuity due is one period larger than immediate',()=>{const immediate=annuityValue(100,.05,4,'immediate','present').value;const due=annuityValue(100,.05,4,'due','present').value;close(due,immediate*1.05);});
test('zero-rate annuity reduces to payment times count',()=>close(annuityValue(50,0,12,'immediate','future').value,600));
test('solving annuity payment reverses valuation',()=>{const p=annuityPaymentForValue(10000,.01,24,'immediate','future').value;close(annuityValue(p,.01,24,'immediate','future').value,10000,1e-7);});
test('course display rounding can preserve four decimal places',()=>assert.equal(roundFinance(19.6891532,4),19.6892));

test('bond price equals coupon annuity plus discounted redemption and classifies premium or discount', () => {
  const premium = bondPrice({ faceValue: 1000, couponRatePerPeriod: 0.05, redemptionValue: 1000, yieldPerPeriod: 0.04, periods: 10 });
  assert.ok(premium.value > 1000);
  assert.equal(premium.classification, 'premium');
  assert.ok(Math.abs(premium.value - (premium.couponPresentValue + premium.redemptionPresentValue)) < 1e-9);
  const discount = bondPrice({ faceValue: 1000, couponRatePerPeriod: 0.03, redemptionValue: 1000, yieldPerPeriod: 0.04, periods: 10 });
  assert.equal(discount.classification, 'discount');
});

test('high-precision finance vectors match independent Decimal reference values',()=>{
  assert.ok(nominalAccumulation(1250,.072,12,10).exactValue.startsWith('2562.522570997562567105'));
  assert.ok(effectiveToNominal(.083,12).exactValue.startsWith('0.080000458430804850024'));
  assert.ok(annuityValue(450,.0075,36,'immediate','present').exactValue.startsWith('14151.062363077090835160'));
  assert.ok(bondPrice({faceValue:1000,couponRatePerPeriod:.03,redemptionValue:1000,yieldPerPeriod:.025,periods:20}).exactValue.startsWith('1077.945811428234047325'));
});

test('finance domain accepts decimal text without an intermediate Number coercion',()=>{
  const simple=simpleAccumulation('100000000000000000001','0','1');
  assert.equal(simple.exactValue,'100000000000000000001');
  const tiny=simpleAccumulation('1','0.000000000000000000001','1');
  assert.equal(tiny.exactValue,'1.000000000000000000001');
});

test('finance integer counts reject decimal/exponent text and excessive workloads',()=>{
  assert.throws(()=>annuityValue('100','0.01','2.5','immediate','present'),/nonnegative integer/i);
  assert.throws(()=>nominalToEffective('0.05','1e3'),/positive integer/i);
  assert.throws(()=>bondPrice({faceValue:'1000',couponRatePerPeriod:'0.04',redemptionValue:'1000',yieldPerPeriod:'0.05',periods:'10001'}),/cannot exceed 10000/i);
});


test('finance results expose truthful fixed-point versus iterative certainty metadata',()=>{
  const simple=simpleAccumulation('1000','0.05','3');
  assert.equal(simple.certainty,'fixed-point-rounded');
  assert.equal(simple.precisionDigits,30);
  assert.equal(simple.roundingMode,'half-up');
  assert.equal(simple.decimalValue,simple.exactValue,'legacy exactValue is compatibility-only alias');
  assert.equal(compoundAccumulation('1000','0.05','2').certainty,'fixed-point-rounded');
  assert.equal(effectiveToNominal('0.083',12).certainty,'iterative-approximation');
  assert.equal(effectiveToNominal('0.083',1).certainty,'fixed-point-rounded');
});

test('fractional-period compound reference vector is explicitly approximate and course-rounds correctly',()=>{
  const result=compoundAccumulation('10000','0.05','0.583333333333333333333333333333');
  assert.equal(result.certainty,'iterative-approximation');
  close(result.value,10288.7,0.2);
});

test('zero-payment annuity has zero value under the domain model',()=>{
  const immediate=annuityValue('1500','0.01','0','immediate','present');
  const due=annuityValue('1500','0.01','0','due','future');
  assert.equal(immediate.decimalValue,'0');
  assert.equal(due.decimalValue,'0');
});

test('nonpositive simple-interest factor surfaces D-001 instead of silently endorsing the scenario',()=>{
  const result=simpleAccumulation('1000','-0.5','3');
  assert.ok(result.value<0);
  assert.match(result.warnings?.join(' ')??'',/D-001|course-mode policy/i);
});

test('bond classification keeps its legacy policy explicit and compares in fixed-point space',()=>{
  const par=bondPrice({faceValue:'1000',couponRatePerPeriod:'0.04',redemptionValue:'1000',yieldPerPeriod:'0.04',periods:'10'});
  assert.equal(par.classification,'par');
  assert.equal(par.classificationPolicy,BOND_CLASSIFICATION_POLICY);
  assert.equal(par.classificationPolicy,'legacy-relative-tolerance');
  assert.ok(par.classificationTolerance.length>0);
});

test('fractional finance powers avoid native Math.pow and preserve deterministic bounded-fraction roots', async()=>{
  const source=await (await import('node:fs/promises')).readFile(new URL('../src/decimal.ts',import.meta.url),'utf8');
  assert.equal(source.includes('Math.pow'),false,'FinanceDecimal authoritative power/root path must not use native Math.pow');
  const fractional=compoundAccumulation('10000','0.05','0.583333333333333333333333333333');
  assert.equal(fractional.certainty,'iterative-approximation');
  close(fractional.value,10288.7,0.2);
  const monthly=effectiveToNominal('0.083',12);
  close(nominalToEffective(monthly.decimalValue,12).value,0.083,1e-12);
});


test('FinanceDecimal rejects malformed mantissas instead of ignoring trailing decimal segments', async()=>{
  const {FinanceDecimal}=await import('../src/decimal.ts');
  assert.throws(()=>FinanceDecimal.from('1.2.3'),/invalid decimal value/i);
  assert.throws(()=>FinanceDecimal.from('1e2e3'),/invalid decimal value/i);
});

test('FinanceDecimal bounds pathological text, exponents, and arithmetic magnitude', async()=>{
  const {FinanceDecimal,MAX_FINANCE_TEXT_LENGTH}=await import('../src/decimal.ts');
  assert.throws(()=>FinanceDecimal.from('9'.repeat(MAX_FINANCE_TEXT_LENGTH+1)),/cannot exceed .* characters/i);
  assert.throws(()=>FinanceDecimal.from('1e100000000'),/exponent magnitude/i);
  assert.throws(()=>FinanceDecimal.from('1e301'),/magnitude cannot exceed/i);
  const large=FinanceDecimal.from('1e200');
  assert.throws(()=>large.multiply(large),/magnitude cannot exceed/i);
});


test('FinanceDecimal rejects unsafe large JavaScript numbers while preserving exact text input', async()=>{
  const {FinanceDecimal}=await import('../src/decimal.ts');
  assert.throws(()=>FinanceDecimal.from(Number.MAX_SAFE_INTEGER+1),/safe JavaScript numeric range/i);
  assert.equal(FinanceDecimal.from('9007199254740993').toString(),'9007199254740993');
});
