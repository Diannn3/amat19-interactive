/// <reference types="astro/client" />

export {};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      math: import('react').HTMLAttributes<HTMLElement> & { display?: 'block' | 'inline' };
      mfrac: import('react').HTMLAttributes<HTMLElement>;
      mi: import('react').HTMLAttributes<HTMLElement>;
      mn: import('react').HTMLAttributes<HTMLElement>;
      mo: import('react').HTMLAttributes<HTMLElement>;
      mover: import('react').HTMLAttributes<HTMLElement>;
      mrow: import('react').HTMLAttributes<HTMLElement>;
      msub: import('react').HTMLAttributes<HTMLElement>;
      msup: import('react').HTMLAttributes<HTMLElement>;
      mtext: import('react').HTMLAttributes<HTMLElement>;
      munder: import('react').HTMLAttributes<HTMLElement>;
    }
  }
}
