import type { ReactNode } from 'react';

export function Feedback({
  tone = 'neutral',
  children,
  role = 'status'
}: {
  tone?: 'neutral' | 'success' | 'error' | 'warning';
  children: ReactNode;
  role?: 'status' | 'alert';
}) {
  return <div className="feedback-region" data-tone={tone} role={role} aria-live="polite">{children}</div>;
}
