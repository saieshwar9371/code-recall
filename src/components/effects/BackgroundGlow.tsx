'use client';

import React from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useCursor } from './CursorContext';

export default function BackgroundGlow() {
  const { mousePosition } = useCursor();
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const smoothX = useSpring(x, { damping: 50, stiffness: 200 });
  const smoothY = useSpring(y, { damping: 50, stiffness: 200 });

  React.useEffect(() => {
    x.set(mousePosition.x);
    y.set(mousePosition.y);
  }, [mousePosition, x, y]);

  return (
    <motion.div
      className="fixed pointer-events-none z-0 w-[1000px] h-[1000px] rounded-full opacity-40"
      style={{
        left: smoothX,
        top: smoothY,
        translateX: '-50%',
        translateY: '-50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(34, 211, 238, 0.1) 40%, transparent 70%)',
        filter: 'blur(100px)',
      }}
    />
  );
}
