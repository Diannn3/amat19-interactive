import type { HTMLAttributes } from 'react';
// shadcn/ui-inspired owned primitive: https://ui.shadcn.com/docs/components/badge
export function Badge({className='',...props}:HTMLAttributes<HTMLSpanElement>){return <span className={`inline-flex min-h-6 items-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-bold tracking-wide text-[var(--foreground-muted)] ${className}`.trim()} {...props}/>}
