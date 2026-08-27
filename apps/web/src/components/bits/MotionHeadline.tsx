import { MotionConfig, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

// Source adapted from React Bits BlurText (MIT + Commons Clause):
// https://github.com/DavidHDev/react-bits/blob/d71509062d8adbd97a43035a94d0ebdaf154b5cf/src/ts-tailwind/Components/BlurText/BlurText.tsx
// Reduced to a semantic heading and kept within the AMAT 19 motion budget.
type Props = { id?: string; text: string; className?: string };

export default function MotionHeadline({ id, text, className = '' }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [forcedReduced, setForcedReduced] = useState(false);

  useEffect(() => {
    setForcedReduced(document.documentElement.dataset.motion === 'reduced');
  }, []);

  const animate = !prefersReducedMotion && !forcedReduced;
  const words = text.split(' ');

  return (
    <MotionConfig reducedMotion="user">
      <motion.h1
        id={id}
        className={`display-title motion-headline ${className}`.trim()}
        aria-label={text}
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {words.map((word, index) => (
          <motion.span
            key={`${word}-${index}`}
            aria-hidden="true"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: animate ? index * 0.035 : 0, ease: 'easeOut' }}
          >
            {word}{index < words.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </motion.h1>
    </MotionConfig>
  );
}
