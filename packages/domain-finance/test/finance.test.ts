import assert from 'node:assert/strict'; import test from 'node:test';
import { bondPrice,annuityPaymentForValue,annuityValue,compoundAccumulation,effectiveToNominal,nominalAccumulation,nominalToEffective,roundFinance,simpleAccumulation,valueAtTime,valueCashflowsAt} from '../src/index.ts';
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
