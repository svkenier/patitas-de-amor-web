/**
 * AnimatedSection — Wrapper de animación en scroll.
 *
 * Usa IntersectionObserver + CSS transitions (nativas, sin librerías externas).
 * Cuando el elemento entra en el viewport, aplica fade-in + slide-up suave.
 * Una vez visible, la clase no se revierte (se anima solo al aparecer).
 */

import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

interface AnimatedSectionProps {
  children: React.ReactNode;
  /**
   * Dirección del deslizamiento de entrada.
   * @default 'up'
   */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /**
   * Retardo antes de iniciar la animación (ms).
   * Útil para escalonar elementos en una cuadrícula.
   * @default 0
   */
  delay?: number;
  /**
   * Porcentaje del elemento que debe ser visible para disparar la animación.
   * @default 0.12
   */
  threshold?: number;
  /**
   * Distancia de deslizamiento inicial en píxeles.
   * @default 28
   */
  distance?: number;
  /** Props sx adicionales para el contenedor Box. */
  sx?: SxProps<Theme>;
}

const SLIDE_MAP: Record<NonNullable<AnimatedSectionProps['direction']>, string> = {
  up:    'translateY(VAR)',
  down:  'translateY(-VAR)',
  left:  'translateX(VAR)',
  right: 'translateX(-VAR)',
  none:  'none',
};

export default function AnimatedSection({
  children,
  direction = 'up',
  delay     = 0,
  threshold = 0.12,
  distance  = 28,
  sx,
}: AnimatedSectionProps) {
  const ref        = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el); // animar solo una vez
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const translateHidden =
    direction === 'none'
      ? 'none'
      : SLIDE_MAP[direction].replace('VAR', `${distance}px`);

  return (
    <Box
      ref={ref}
      onTransitionEnd={(e) => {
        if (e.target === ref.current && visible) {
          setFinished(true);
        }
      }}
      sx={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translate(0, 0)' : translateHidden,
        transition: `opacity 500ms ease ${delay}ms, transform 500ms ease ${delay}ms`,
        willChange: finished ? 'auto' : 'opacity, transform',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
