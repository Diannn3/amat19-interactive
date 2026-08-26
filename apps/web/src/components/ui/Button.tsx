import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'answer';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({ variant = 'secondary', className = '', children, ...props }: Props) {
  return (
    <button className={`amat-button amat-button--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
