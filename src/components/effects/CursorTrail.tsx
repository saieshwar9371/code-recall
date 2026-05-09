'use client';

import React, { useEffect, useRef } from 'react';
import { useCursor } from './CursorContext';

export default function CursorTrail() {
  const { mousePosition, cursorType } = useCursor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<{ x: number; y: number; age: number; color: string }[]>([]);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const getColor = () => {
      switch (cursorType) {
        case 'button': return '#6366f1';
        case 'card': return '#22D3EE';
        case 'locked': return '#F43F5E';
        case 'completed': return '#10B981';
        default: return '#6366f1';
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Add new point
      points.current.push({ ...mousePosition, age: 0, color: getColor() });
      
      // Update and draw points
      points.current = points.current.filter(p => p.age < 20);
      
      if (points.current.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points.current[0].x, points.current[0].y);
        
        for (let i = 1; i < points.current.length; i++) {
          const p = points.current[i];
          p.age += 1;
          
          const alpha = 1 - p.age / 20;
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = alpha * 0.3;
          ctx.lineWidth = alpha * 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [mousePosition, cursorType]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9998]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
