import type { PropsWithChildren } from 'react';
// React Bits Gradient Text visual pattern, implemented dependency-free to avoid adding motion/react:
// https://reactbits.dev/text-animations/gradient-text
export function GradientText({children,className=''}:PropsWithChildren<{className?:string}>){return <span className={`gradient-text ${className}`.trim()}>{children}</span>}
