import type { HTMLAttributes, ReactNode } from 'react';
// shadcn/ui-inspired owned primitive: https://ui.shadcn.com/docs/components/card
export function Card({className='',...props}:HTMLAttributes<HTMLDivElement>){return <div className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-soft)] ${className}`.trim()} {...props}/>}
export function CardHeader({className='',...props}:HTMLAttributes<HTMLDivElement>){return <div className={`grid gap-1.5 p-5 sm:p-6 ${className}`.trim()} {...props}/>}
export function CardTitle({className='',...props}:HTMLAttributes<HTMLHeadingElement>){return <h3 className={`font-display text-lg font-semibold tracking-tight ${className}`.trim()} {...props}/>}
export function CardDescription({className='',...props}:HTMLAttributes<HTMLParagraphElement>){return <p className={`text-sm leading-relaxed text-[var(--foreground-muted)] ${className}`.trim()} {...props}/>}
export function CardContent({className='',...props}:HTMLAttributes<HTMLDivElement>){return <div className={`px-5 pb-5 sm:px-6 sm:pb-6 ${className}`.trim()} {...props}/>}
export function CardFooter({className='',children,...props}:HTMLAttributes<HTMLDivElement>&{children?:ReactNode}){return <div className={`flex items-center gap-2 px-5 pb-5 sm:px-6 sm:pb-6 ${className}`.trim()} {...props}>{children}</div>}
