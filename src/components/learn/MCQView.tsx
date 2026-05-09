'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { difficultyBand, difficultyTone } from '@/lib/difficulty';
import { cn } from '@/lib/utils';

interface MCQViewProps {
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string | null;
  difficulty?: number;
  onCorrect: () => void;
  onWrong?: () => void;
}

const toneStyles = {
  emerald: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  orange: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  fuchsia: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-400',
};

export default function MCQView({
  question,
  options,
  answerIndex,
  explanation,
  difficulty = 1,
  onCorrect,
  onWrong,
}: MCQViewProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    setSelectedIdx(null);
    setIsCorrect(null);
    setShowExplanation(false);
    setCelebrate(false);
  }, [question]);

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null) return;

    setSelectedIdx(idx);
    const correct = idx === answerIndex;
    setIsCorrect(correct);

    if (correct) {
      setCelebrate(true);
      setTimeout(() => onCorrect(), 1100);
    } else {
      onWrong?.();
      setShowExplanation(true);
    }
  };

  const band = difficultyBand(difficulty);
  const tone = difficultyTone(difficulty);

  return (
    <motion.div
      animate={
        celebrate
          ? { scale: [1, 1.02, 1], boxShadow: ['0 0 0 0 rgba(16,185,129,0)', '0 0 40px 4px rgba(16,185,129,0.25)', '0 0 0 0 rgba(16,185,129,0)'] }
          : {}
      }
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="p-8 rounded-[2.5rem] glass border border-white/5 space-y-8 shadow-2xl relative overflow-hidden"
    >
      {celebrate && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-emerald-500/10 via-transparent to-primary/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      <div className="space-y-4 relative z-20">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold tracking-widest uppercase">
              MCQ
            </span>
            <span
              className={cn(
                'text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase border',
                toneStyles[tone],
              )}
            >
              {band}
            </span>
            <span className="text-[10px] text-white/35 font-bold tracking-widest uppercase">
              Q {difficulty} · Session
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-white/10"
                animate={celebrate ? { scale: [1, 1.8, 1], opacity: [0.4, 0.9, 0.4] } : {}}
                transition={{ delay: i * 0.06 }}
              />
            ))}
          </div>
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white">{question}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-20">
        {options.map((option, idx) => {
          const isSelected = selectedIdx === idx;
          const isWrong = isSelected && !isCorrect;
          const isRight = (isSelected && isCorrect) || (selectedIdx !== null && idx === answerIndex);

          return (
            <motion.button
              key={idx}
              whileHover={{ scale: selectedIdx === null ? 1.02 : 1 }}
              whileTap={{ scale: selectedIdx === null ? 0.98 : 1 }}
              onClick={() => handleSelect(idx)}
              disabled={selectedIdx !== null}
              className={`group relative p-6 rounded-2xl border transition-all duration-300 text-left flex items-center gap-4 ${
                isSelected
                  ? isCorrect
                    ? 'bg-success/10 border-success shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    : 'bg-error/10 border-error shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                  : isRight && selectedIdx !== null
                    ? 'bg-success/5 border-success/30'
                    : 'bg-white/5 border-white/5 hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                  isSelected
                    ? isCorrect
                      ? 'bg-success text-white'
                      : 'bg-error text-white'
                    : 'bg-white/5 group-hover:bg-primary group-hover:text-white'
                }`}
              >
                {isRight ? <Check className="w-4 h-4" /> : isWrong ? <X className="w-4 h-4" /> : String.fromCharCode(65 + idx)}
              </div>
              <span className={`text-lg ${isSelected ? 'font-bold' : ''}`}>{option}</span>

              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-2 -top-2">
                  <div className={`p-1 rounded-full ${isCorrect ? 'bg-success' : 'bg-error'}`}>
                    {isCorrect ? <Check className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
                  </div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-error/5 border border-error/20 flex gap-4 items-start relative z-20"
          >
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-error uppercase tracking-wider mb-1">Review Required</h4>
              <p className="text-sm text-muted-foreground">
                {explanation ||
                  'That\'s not quite right — read the explanation carefully and try again. Understanding the concept is what matters.'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedIdx(null);
                  setIsCorrect(null);
                  setShowExplanation(false);
                }}
                className="mt-4 text-error hover:bg-error/10 h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest"
              >
                Try again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
