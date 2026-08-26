import type { AnnuityTiming, Cashflow, FinanceResult, FinanceTraceStep, ValueDirection } from './types.ts';
function finite(name:string,value:number){if(!Number.isFinite(value))throw new RangeError(`${name} must be finite.`);}
function nonnegative(name:string,value:number){finite(name,value);if(value<0)throw new RangeError(`${name} cannot be negative.`);}
function validRate(rate:number){finite('Rate',rate);if(rate<=-1)throw new RangeError('The effective rate must be greater than -100%.');}
function validFrequency(m:number){if(!Number.isInteger(m)||m<=0)throw new RangeError('Compounding frequency must be a positive integer.');}
export function roundFinance(value:number,places=4):number { const factor=10**places; return Math.round((value+Number.EPSILON)*factor)/factor; }
export function simpleAccumulation(principal:number,annualRate:number,years:number):FinanceResult {
  nonnegative('Principal',principal); validRate(annualRate); nonnegative('Time',years);
  const factor=1+annualRate*years, value=principal*factor;
  return { value, trace:[
    {id:'identify',label:'Identify the simple-interest model',expression:'A = P(1 + it)',explanation:'Simple interest is earned only on the original principal.'},
    {id:'factor',label:'Build the accumulation factor',expression:`1 + (${annualRate})(${years}) = ${factor}`,explanation:'Multiply the annual rate by elapsed years, then add 1.',value:factor},
    {id:'accumulate',label:'Accumulate the principal',expression:`${principal}(${factor}) = ${value}`,explanation:'Scale the original principal by the simple-interest accumulation factor.',value}
  ]};
}
export function compoundAccumulation(principal:number,annualEffectiveRate:number,years:number):FinanceResult {
  nonnegative('Principal',principal); validRate(annualEffectiveRate); nonnegative('Time',years);
  const factor=(1+annualEffectiveRate)**years,value=principal*factor;
  return { value, trace:[
    {id:'identify',label:'Identify the compound model',expression:'A = P(1 + i)^t',explanation:'Compound interest earns interest on the accumulated balance.'},
    {id:'factor',label:'Build the accumulation factor',expression:`(1 + ${annualEffectiveRate})^${years} = ${factor}`,explanation:'Raise the one-period accumulation factor to the number of periods.',value:factor},
    {id:'accumulate',label:'Accumulate the principal',expression:`${principal}(${factor}) = ${value}`,explanation:'Multiply principal by the compound accumulation factor.',value}
  ]};
}
export function nominalAccumulation(principal:number,nominalAnnualRate:number,m:number,years:number):FinanceResult {
  nonnegative('Principal',principal); finite('Nominal rate',nominalAnnualRate); validFrequency(m); nonnegative('Time',years);
  if(1+nominalAnnualRate/m<=0)throw new RangeError('The rate per conversion period must keep the accumulation factor positive.');
  const periodic=nominalAnnualRate/m, periods=m*years, factor=(1+periodic)**periods, value=principal*factor;
  return {value,trace:[
    {id:'periodic',label:'Convert the nominal rate to a periodic rate',expression:`j/m = ${nominalAnnualRate}/${m} = ${periodic}`,explanation:'A nominal annual rate is divided by its number of conversion periods.',value:periodic},
    {id:'periods',label:'Count conversion periods',expression:`mt = ${m}(${years}) = ${periods}`,explanation:'Compounding occurs once per conversion period.',value:periods},
    {id:'accumulate',label:'Compound over all conversion periods',expression:`A = ${principal}(1 + ${periodic})^${periods} = ${value}`,explanation:'Use the periodic rate for every conversion period.',value}
  ]};
}
export function nominalToEffective(nominalAnnualRate:number,m:number):FinanceResult {
  finite('Nominal rate',nominalAnnualRate); validFrequency(m);
  const periodic=nominalAnnualRate/m;
  if(1+periodic<=0)throw new RangeError('The periodic accumulation factor must be positive.');
  const value=(1+periodic)**m-1;
  return{value,trace:[
    {id:'periodic',label:'Periodic rate',expression:`j/m = ${nominalAnnualRate}/${m} = ${periodic}`,explanation:'Divide the quoted nominal annual rate by the conversion frequency.',value:periodic},
    {id:'annualize',label:'Equivalent annual effective rate',expression:`i = (1 + ${periodic})^${m} - 1 = ${value}`,explanation:'Equivalent rates produce the same one-year accumulation.',value}
  ]};
}
export function effectiveToNominal(annualEffectiveRate:number,m:number):FinanceResult {
  validRate(annualEffectiveRate); validFrequency(m);
  const periodic=(1+annualEffectiveRate)**(1/m)-1,value=m*periodic;
  return{value,trace:[
    {id:'periodic',label:'Equivalent periodic rate',expression:`(1 + i)^(1/m) - 1 = ${periodic}`,explanation:'Find the conversion-period rate that reproduces the same annual accumulation.',value:periodic},
    {id:'quote',label:'Nominal annual quote',expression:`j = ${m}(${periodic}) = ${value}`,explanation:'Multiply the periodic rate by the number of conversion periods.',value}
  ]};
}
export function valueAtTime(amount:number,fromTime:number,toTime:number,annualEffectiveRate:number):FinanceResult {
  finite('Amount',amount); finite('Starting time',fromTime); finite('Valuation time',toTime); validRate(annualEffectiveRate);
  const periods=toTime-fromTime,factor=(1+annualEffectiveRate)**periods,value=amount*factor;
  const direction=periods>=0?'accumulate':'discount';
  return{value,trace:[
    {id:'distance',label:'Measure the time shift',expression:`${toTime} - ${fromTime} = ${periods}`,explanation:'Cash flows must be moved to one common focal date before they can be compared.',value:periods},
    {id:'move',label:direction==='accumulate'?'Accumulate forward':'Discount backward',expression:`${amount}(1 + ${annualEffectiveRate})^${periods} = ${value}`,explanation:direction==='accumulate'?'Moving right on the timeline multiplies by accumulation factors.':'Moving left on the timeline divides by accumulation factors.',value}
  ]};
}
export function valueCashflowsAt(cashflows:Cashflow[],valuationTime:number,annualEffectiveRate:number):FinanceResult {
  if(cashflows.length===0)throw new RangeError('At least one cash flow is required.'); validRate(annualEffectiveRate); finite('Valuation time',valuationTime);
  const trace:FinanceTraceStep[]=[]; let value=0;
  cashflows.forEach((flow,index)=>{finite('Cash-flow time',flow.time);finite('Cash-flow amount',flow.amount);const moved=flow.amount*(1+annualEffectiveRate)**(valuationTime-flow.time);value+=moved;trace.push({id:`flow-${index}`,label:flow.label||`Cash flow ${index+1}`,expression:`${flow.amount}(1 + ${annualEffectiveRate})^(${valuationTime} - ${flow.time}) = ${moved}`,explanation:'Move this cash flow to the common focal date before adding it.',value:moved});});
  trace.push({id:'sum',label:'Combine values at the focal date',expression:`V(${valuationTime}) = ${value}`,explanation:'Amounts may be added only after they refer to the same valuation date.',value});
  return{value,trace};
}
function annuityFactor(rate:number,n:number,direction:ValueDirection):number {
  validRate(rate); if(!Number.isInteger(n)||n<0)throw new RangeError('The number of payments must be a nonnegative integer.');
  if(n===0)return 0; if(rate===0)return n;
  return direction==='present' ? (1-(1+rate)**(-n))/rate : ((1+rate)**n-1)/rate;
}
export function annuityValue(payment:number,ratePerPaymentPeriod:number,n:number,timing:AnnuityTiming,direction:ValueDirection):FinanceResult {
  finite('Payment',payment); const base=annuityFactor(ratePerPaymentPeriod,n,direction); const timingFactor=timing==='due' ? 1+ratePerPaymentPeriod : 1; const value=payment*base*timingFactor;
  const symbol=direction==='present'?'a-angle-n':'s-angle-n';
  const baseExpr=ratePerPaymentPeriod===0?`${n}`:direction==='present'?`(1 - (1+i)^(-n))/i`:`((1+i)^n - 1)/i`;
  return{value,trace:[
    {id:'base',label:`${direction==='present'?'Present':'Future'}-value annuity factor`,expression:`${symbol} = ${baseExpr} = ${base}`,explanation:`This factor combines ${n} equal ${timing==='immediate'?'end-of-period':'beginning-of-period'} payments at one focal date.`,value:base},
    ...(timing==='due'?[{id:'due',label:'Shift an annuity-immediate one period',expression:`factor × (1 + i) = ${base}(${1+ratePerPaymentPeriod})`,explanation:'Every annuity-due payment occurs one period earlier, so the entire value is one accumulation factor larger.',value:base*timingFactor}]:[]),
    {id:'payment',label:'Scale by the payment amount',expression:`${payment} × ${base*timingFactor} = ${value}`,explanation:'The annuity factor is the value of unit payments; multiply by the actual payment.',value}
  ]};
}
export function annuityPaymentForValue(targetValue:number,rate:number,n:number,timing:AnnuityTiming,direction:ValueDirection):FinanceResult {
  finite('Target value',targetValue); const unit=annuityValue(1,rate,n,timing,direction); if(unit.value===0)throw new RangeError('The annuity factor is zero, so a payment cannot be solved.'); const value=targetValue/unit.value;
  return{value,trace:[...unit.trace,{id:'solve-payment',label:'Solve for the level payment',expression:`R = ${targetValue} / ${unit.value} = ${value}`,explanation:'Divide the target value by the value of one unit payment.',value}]};
}

export type BondPriceResult = FinanceResult & {
  couponPayment: number;
  redemptionPresentValue: number;
  couponPresentValue: number;
  classification: 'premium' | 'discount' | 'par';
};
/**
 * Price a level-coupon bond using rates per coupon-payment period.
 * P = (F r) a-angle-n at j + C v^n.
 */
export function bondPrice(input:{faceValue:number;couponRatePerPeriod:number;redemptionValue:number;yieldPerPeriod:number;periods:number}):BondPriceResult {
  const {faceValue,couponRatePerPeriod,redemptionValue,yieldPerPeriod,periods}=input;
  nonnegative('Face value',faceValue); nonnegative('Redemption value',redemptionValue); finite('Coupon rate',couponRatePerPeriod); validRate(yieldPerPeriod);
  if(!Number.isInteger(periods)||periods<=0)throw new RangeError('Coupon periods must be a positive integer.');
  const couponPayment=faceValue*couponRatePerPeriod;
  const discount=(1+yieldPerPeriod)**(-periods);
  const annuityFactor=yieldPerPeriod===0?periods:(1-discount)/yieldPerPeriod;
  const couponPresentValue=couponPayment*annuityFactor;
  const redemptionPresentValue=redemptionValue*discount;
  const value=couponPresentValue+redemptionPresentValue;
  const tolerance=Math.max(1,Math.abs(redemptionValue))*1e-10;
  const classification=value>redemptionValue+tolerance?'premium':value<redemptionValue-tolerance?'discount':'par';
  return {value,couponPayment,couponPresentValue,redemptionPresentValue,classification,trace:[
    {id:'coupon',label:'Find the coupon payment',expression:`Fr = ${faceValue}(${couponRatePerPeriod}) = ${couponPayment}`,explanation:'The face value and coupon rate per coupon period determine each level coupon.',value:couponPayment},
    {id:'coupons',label:'Value the coupon stream',expression:`(Fr)a_n|j = ${couponPayment}(${annuityFactor}) = ${couponPresentValue}`,explanation:'The coupons form an annuity-immediate valued at the bond yield per coupon period.',value:couponPresentValue},
    {id:'redemption',label:'Discount the redemption value',expression:`Cv^n = ${redemptionValue}(1 + ${yieldPerPeriod})^(-${periods}) = ${redemptionPresentValue}`,explanation:'The redemption amount is a single future cash flow at maturity.',value:redemptionPresentValue},
    {id:'price',label:'Combine all values at the purchase date',expression:`P = ${couponPresentValue} + ${redemptionPresentValue} = ${value}`,explanation:'Bond price is the present value of all coupons plus the present value of redemption.',value}
  ]};
}
