'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type CursorType = 'default' | 'button' | 'card' | 'code' | 'locked' | 'completed';

interface CursorContextType {
  cursorType: CursorType;
  setCursorType: (type: CursorType) => void;
  mousePosition: { x: number; y: number };
  triggerBurst: (color?: string) => void;
  burstSignal: { id: number; color?: string } | null;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [cursorType, setCursorType] = useState<CursorType>('default');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [burstSignal, setBurstSignal] = useState<{ id: number; color?: string } | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const triggerBurst = (color?: string) => {
    setBurstSignal({ id: Date.now(), color });
  };

  return (
    <CursorContext.Provider value={{ cursorType, setCursorType, mousePosition, triggerBurst, burstSignal }}>
      {children}
    </CursorContext.Provider>
  );
}

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
}
