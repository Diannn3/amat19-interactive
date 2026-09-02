export type NonnegativeIntegerInput =
  | { status: 'valid'; raw: string; value: number }
  | { status: 'incomplete'; raw: string; message: string }
  | { status: 'invalid'; raw: string; message: string };

export function parseNonnegativeIntegerInput(raw: string, options: { label?: string; max?: number; positive?: boolean } = {}): NonnegativeIntegerInput {
  const label = options.label ?? 'Value';
  const text = raw.trim();
  if (!text) return { status: 'incomplete', raw, message: `${label} is required.` };
  if (!/^\d+$/.test(text)) return { status: 'invalid', raw, message: `${label} must be a whole number written without decimals or exponent notation.` };
  const value = Number(text);
  if (!Number.isSafeInteger(value)) return { status: 'invalid', raw, message: `${label} is too large to represent safely.` };
  if (options.positive && value < 1) return { status: 'invalid', raw, message: `${label} must be at least 1.` };
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  if (value > max) return { status: 'invalid', raw, message: `${label} cannot exceed ${max}.` };
  return { status: 'valid', raw, value };
}


export type PositiveIntegerListInput =
  | { status: 'valid'; raw: string; value: number[] }
  | { status: 'invalid'; raw: string; message: string };

export function parsePositiveIntegerList(raw:string,label='Line references'):PositiveIntegerListInput{
 const text=raw.trim();if(!text)return{status:'valid',raw,value:[]};
 const parts=text.split(',').map(part=>part.trim());const values:number[]=[];
 for(const part of parts){if(!/^\d+$/.test(part))return{status:'invalid',raw,message:`${label} must be comma-separated positive whole numbers without decimals or exponent notation.`};const value=Number(part);if(!Number.isSafeInteger(value)||value<1)return{status:'invalid',raw,message:`${label} must contain positive safe integers.`};values.push(value);}
 return{status:'valid',raw,value:values};
}
