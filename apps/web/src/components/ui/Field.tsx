import type { InputHTMLAttributes, ReactNode } from 'react';

export function Field({
  label,
  hint,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string }) {
  const id = props.id ?? props.name;
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <label className="form-field">
      <span className="form-field__label">{label}</span>
      <input className="text-input" {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} />
      {hint && <span className="form-field__hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="form-field__error" id={`${id}-error`} role="alert">{error}</span>}
    </label>
  );
}
