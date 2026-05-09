'use client';

import { useEffect, useState } from 'react';
import { useMotionValue } from 'framer-motion';
import { useCursor } from './CursorContext';

export default function CustomCursor() {
  const { mousePosition } = useCursor();
  const [isMobile, setIsMobile] = useState(false);

  // Smooth position tracking
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window;
      setIsMobile(mobile);
      
      // Manage body cursor style
      if (mobile) {
        document.body.style.cursor = 'auto';
      } else {
        document.body.style.cursor = 'none';
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.body.style.cursor = 'auto';
    };
  }, []);

  useEffect(() => {
    if (isMobile) return;
    cursorX.set(mousePosition.x);
    cursorY.set(mousePosition.y);
  }, [mousePosition, cursorX, cursorY, isMobile]);

  return null;
}
