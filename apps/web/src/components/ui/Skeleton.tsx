import type { HTMLAttributes } from 'react';
// shadcn/ui-inspired owned primitive: https://ui.shadcn.com/docs/components/skeleton
export function Skeleton({className='',...props}:HTMLAttributes<HTMLDivElement>){return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[var(--surface-strong)] motion-reduce:animate-none ${className}`.trim()} {...props}/>}
