'use client';

import { useEffect, useState } from 'react';
import { useMotionValue } from 'framer-motion';
import { useCursor } from './CursorContext';

export default function CustomCursor() {
  const { mousePosition } = useCursor();
  const [, setIsMobile] = useState(false);

  // Smooth position tracking
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    cursorX.set(mousePosition.x);
    cursorY.set(mousePosition.y);
  }, [mousePosition, cursorX, cursorY]);

  return null;
}
