'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft,
  Trophy,
  Target,
  BookOpen,
  Code2,
  Sparkles,
  Flame,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCursor } from '@/components/effects/CursorContext';
import MCQView from '@/components/learn/MCQView';
import CodingView from '@/components/learn/CodingView';
import { cn } from '@/lib/utils';
import { bumpSolved, getTopicResume, resetStreak } from '@/lib/user-progress';
import { User as SupabaseUser } from '@supabase/supabase-js';

type McqRow = {
  id: string;
  question: string;
  options: unknown;
  correct_answer: number;
  explanation?: string | null;
  difficulty: number;
};

type CodingRow = {
  id: string;
  title: string;
  problem_statement: string;
  starter_code?: string | null;
  test_cases: unknown;
  difficulty: number;
  hints?: unknown;
  example_input?: string | null;
  example_output?: string | null;
};

function parseOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseHints(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

type RawTest = { input?: string; output?: string; expected?: string };

function parseTests(raw: unknown): { input: string; output?: string; expected?: string }[] {
  if (!Array.isArray(raw)) {
    if (typeof raw === 'string') {
      try {
        const p = JSON.parse(raw) as unknown;
        return Array.isArray(p) ? parseTests(p) : [];
      } catch {
        return [];
      }
    }
    return [];
  }
  return raw
    .filter((t): t is RawTest => t != null && typeof t === 'object')
    .map((t) => ({
      input: t.input ?? '',
      output: t.output,
      expected: t.expected,
    }));
}

function ProgressStrip({
  total,
  currentIndex,
  mode,
}: {
  total: number;
  currentIndex: number;
  mode: 'mcq' | 'coding';
}) {
  if (total <= 0) return null;
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.25em] text-white/35">
        <span>{mode === 'mcq' ? 'Concept track' : 'Code track'}</span>
        <span>
          Unlock {currentIndex + 1} / {total}
        </span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: total }).map((_, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const locked = i > currentIndex;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={
                active
                  ? { scale: [1, 1.15, 1], transition: { duration: 0.4 } }
                  : done
                    ? { scale: 1 }
                    : { scale: 0.92, opacity: 0.45 }
              }
              className={cn(
                'h-2.5 flex-1 min-w-[6px] max-w-[28px] rounded-full transition-colors relative',
                done && 'bg-gradient-to-r from-emerald-500 to-primary',
                active && 'bg-primary shadow-[0_0_12px_rgba(99,102,241,0.5)]',
                locked && 'bg-white/10',
              )}
              title={locked ? 'Locked until previous is cleared' : done ? 'Done' : 'Current'}
            >
              {locked && (
                <span className="sr-only">
                  locked step {i + 1}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function PracticeHub() {
  const { topicId } = useParams();
  const router = useRouter();
  const { setCursorType } = useCursor();

  const [userId, setUserId] = useState<string | null>(null);
  const [topicTitle, setTopicTitle] = useState<string>('Python');
  const [mcqQuestions, setMcqQuestions] = useState<McqRow[]>([]);
  const [codingQuestions, setCodingQuestions] = useState<CodingRow[]>([]);

  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [currentCodingIndex, setCurrentCodingIndex] = useState(0);

  const [viewMode, setViewMode] = useState<'mcq' | 'coding'>('mcq');
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  const [streak, setStreak] = useState(0);
  const [burst, setBurst] = useState(false);
  const [mcqSectionDone, setMcqSectionDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = (data.session?.user as SupabaseUser | undefined) || undefined;
      setUserId(u?.id ?? null);
    });
  }, []);

  useEffect(() => {
    async function fetchQuestions() {
      const [topicRes, mcqRes, codingRes] = await Promise.all([
        supabase.from('topics').select('title').eq('id', topicId).maybeSingle(),
        supabase.from('mcq_questions').select('*').eq('topic_id', topicId).order('order_index', { ascending: true }),
        supabase.from('coding_questions').select('*').eq('topic_id', topicId).order('order_index', { ascending: true }),
      ]);

      if (topicRes.data?.title) setTopicTitle(topicRes.data.title);
      if (mcqRes.data) setMcqQuestions(mcqRes.data as McqRow[]);
      if (codingRes.data) setCodingQuestions(codingRes.data as CodingRow[]);

      setLoading(false);
    }
    fetchQuestions();
  }, [topicId]);

  useEffect(() => {
    if (loading) return;
    if (mcqQuestions.length === 0) {
      setMcqSectionDone(true);
      if (codingQuestions.length > 0) setViewMode('coding');
    }
  }, [loading, mcqQuestions.length, codingQuestions.length]);

  useEffect(() => {
    if (loading) return;
    const topicKey = String(topicId);
    const applyResume = (mcqDone: number, codingDone: number) => {
      setCurrentMcqIndex(mcqDone);
      setCurrentCodingIndex(codingDone);
      if (mcqQuestions.length === 0 || mcqDone >= mcqQuestions.length) {
        setMcqSectionDone(true);
        if (codingQuestions.length > 0) setViewMode('coding');
      }
      if (
        (mcqQuestions.length === 0 || mcqDone >= mcqQuestions.length) &&
        codingQuestions.length > 0 &&
        codingDone >= codingQuestions.length
      ) {
        setCompleted(true);
      }
    };

    if (userId) {
      void (async () => {
        const { data } = await supabase
          .from('user_topic_progress')
          .select('mcq_done,coding_done')
          .eq('user_id', userId)
          .eq('topic_id', topicKey)
          .maybeSingle();
        if (data) {
          applyResume(data.mcq_done ?? 0, data.coding_done ?? 0);
          return;
        }
        const r = getTopicResume(userId, topicKey, mcqQuestions.length, codingQuestions.length);
        applyResume(r.mcqDone, r.codingDone);
      })();
      return;
    }
    const r = getTopicResume(userId, topicKey, mcqQuestions.length, codingQuestions.length);
    applyResume(r.mcqDone, r.codingDone);
  }, [loading, userId, topicId, mcqQuestions.length, codingQuestions.length]);

  const totalMcq = mcqQuestions.length;
  const totalCoding = codingQuestions.length;
  const totalQuestions = totalMcq + totalCoding;

  const bumpSuccess = useCallback(() => {
    setStreak((s) => s + 1);
    setBurst(true);
    window.setTimeout(() => setBurst(false), 700);
  }, []);

  const handleCorrectMcq = () => {
    bumpSuccess();
    const updated = bumpSolved({
      userId,
      topicId: String(topicId),
      kind: 'mcq',
      questionIndex: currentMcqIndex,
      mcqTotal: totalMcq,
      codingTotal: totalCoding,
      streak: streak + 1,
    });
    // Persist to Supabase for authenticated users
    if (userId) {
      const t = updated.topic;
      void supabase.from('user_progress').upsert({
        user_id: userId,
        mcq_solved: updated.progress.mcqSolved,
        coding_solved: updated.progress.codingSolved,
        streak: updated.progress.streak,
        best_streak: updated.progress.bestStreak,
        day_streak: updated.progress.dayStreak,
        best_day_streak: updated.progress.bestDayStreak,
        last_active_day: updated.progress.lastActiveDay,
        last_active_at: new Date(updated.progress.lastActiveAt || Date.now()).toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (t) {
        void supabase.from('user_topic_progress').upsert({
          user_id: userId,
          topic_id: String(topicId),
          mcq_done: t.mcqDone,
          mcq_total: t.mcqTotal,
          coding_done: t.codingDone,
          coding_total: t.codingTotal,
          completed: t.completed,
          updated_at: new Date(t.updatedAt).toISOString(),
        });
      }
    }
    if (currentMcqIndex < mcqQuestions.length - 1) {
      setCurrentMcqIndex((prev) => prev + 1);
    } else if (codingQuestions.length > 0) {
      setMcqSectionDone(true);
      setViewMode('coding');
    } else {
      setCompleted(true);
    }
  };

  const handleCorrectCoding = () => {
    bumpSuccess();
    const updated = bumpSolved({
      userId,
      topicId: String(topicId),
      kind: 'coding',
      questionIndex: currentCodingIndex,
      mcqTotal: totalMcq,
      codingTotal: totalCoding,
      streak: streak + 1,
    });
    // Persist to Supabase for authenticated users
    if (userId) {
      const t = updated.topic;
      void supabase.from('user_progress').upsert({
        user_id: userId,
        mcq_solved: updated.progress.mcqSolved,
        coding_solved: updated.progress.codingSolved,
        streak: updated.progress.streak,
        best_streak: updated.progress.bestStreak,
        day_streak: updated.progress.dayStreak,
        best_day_streak: updated.progress.bestDayStreak,
        last_active_day: updated.progress.lastActiveDay,
        last_active_at: new Date(updated.progress.lastActiveAt || Date.now()).toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (t) {
        void supabase.from('user_topic_progress').upsert({
          user_id: userId,
          topic_id: String(topicId),
          mcq_done: t.mcqDone,
          mcq_total: t.mcqTotal,
          coding_done: t.codingDone,
          coding_total: t.codingTotal,
          completed: t.completed,
          updated_at: new Date(t.updatedAt).toISOString(),
        });
      }
    }
    if (currentCodingIndex < codingQuestions.length - 1) {
      setCurrentCodingIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleWrongMcq = () => {
    setStreak(0);
    resetStreak(userId);
    if (userId) {
      void supabase.from('user_progress').upsert({
        user_id: userId,
        streak: 0,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const currentMcq = mcqQuestions[currentMcqIndex];
  const currentCoding = codingQuestions[currentCodingIndex];

  const mcqOptions = useMemo(() => (currentMcq ? parseOptions(currentMcq.options) : []), [currentMcq]);
  const codingHints = useMemo(
    () => (currentCoding ? parseHints(currentCoding.hints) : []),
    [currentCoding],
  );

  const codingTests = useMemo(
    () => (currentCoding ? parseTests(currentCoding.test_cases) : []),
    [currentCoding],
  );

  if (loading)
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs font-black tracking-[0.3em] text-primary uppercase">Syncing Lab...</span>
      </div>
    );

  if (totalQuestions === 0)
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center gap-6">
        <Target className="w-16 h-16 text-white/10" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">No challenges found</h2>
          <p className="text-muted-foreground mt-2">Run Supabase seed for this topic or check your project link.</p>
        </div>
        <Button onClick={() => router.back()} variant="outline" className="rounded-xl">
          Go back
        </Button>
      </div>
    );

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass p-12 rounded-[3.5rem] border border-white/10 text-center relative overflow-hidden shadow-2xl"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-emerald-500/10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-[80px]" />

          <motion.div
            initial={{ rotate: -8, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="w-24 h-24 bg-primary/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20 border border-primary/20 relative z-10"
          >
            <Trophy className="w-12 h-12 text-primary" />
          </motion.div>

          <h1 className="text-4xl font-black text-white mb-2 tracking-tight relative z-10">Session complete</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6 relative z-10">
            You finished <span className="text-white font-semibold">{topicTitle}</span>
            {totalMcq > 0 && totalCoding > 0 && ' — MCQs and code labs'}
            {totalMcq > 0 && totalCoding === 0 && ' — all quick checks'}
            {totalMcq === 0 && totalCoding > 0 && ' — all coding labs'}
            . That is a real win.
          </p>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-10 relative z-10">
            Best streak this run · {streak} in a row
          </p>

          <Button
            onClick={() => router.push('/learn/python')}
            className="w-full bg-primary text-white hover:bg-primary/90 rounded-[1.5rem] h-16 font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/30 relative z-10"
          >
            Back to hub
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <AnimatePresence>
        {burst && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[100] flex items-start justify-center pt-28"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="rounded-full bg-emerald-500/30 blur-3xl w-40 h-40"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6 min-w-0">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="rounded-2xl hover:bg-white/5 w-12 h-12 p-0 border border-white/5 shrink-0"
              onMouseEnter={() => setCursorType('button')}
              onMouseLeave={() => setCursorType('default')}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="hidden sm:block min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Sparkles className="w-3 h-3 text-primary fill-current shrink-0" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] truncate">{topicTitle}</h2>
              </div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest truncate">
                Python · progressive unlock
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-2xl border text-[11px] font-black uppercase tracking-widest',
                streak > 0
                  ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
                  : 'border-white/10 bg-white/5 text-white/35',
              )}
            >
              <Flame className={cn('w-4 h-4', streak > 0 && 'text-orange-400')} />
              Streak {streak}
            </div>
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => setViewMode('mcq')}
                disabled={mcqQuestions.length === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${
                  viewMode === 'mcq'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest hidden sm:block">MCQ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mcqQuestions.length > 0 && !mcqSectionDone) return;
                  setViewMode('coding');
                }}
                disabled={codingQuestions.length === 0 || (mcqQuestions.length > 0 && !mcqSectionDone)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${
                  viewMode === 'coding'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest hidden sm:block">Code</span>
                {mcqQuestions.length > 0 && !mcqSectionDone && <Lock className="w-3 h-3 opacity-50" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full flex-grow p-6 md:p-12">
        <div className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight">
                {viewMode === 'mcq' ? 'Quick thinking' : 'Hands-on lab'}
              </h3>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">
                Question {(viewMode === 'mcq' ? currentMcqIndex : currentCodingIndex) + 1} of{' '}
                {viewMode === 'mcq' ? totalMcq : totalCoding}
              </p>
            </div>
            {viewMode === 'mcq' ? (
              <ProgressStrip total={totalMcq} currentIndex={currentMcqIndex} mode="mcq" />
            ) : (
              <ProgressStrip total={totalCoding} currentIndex={currentCodingIndex} mode="coding" />
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'mcq' && currentMcq ? (
            <motion.div
              key={`mcq-${currentMcq.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.45, ease: 'circOut' }}
              className="h-full"
            >
              <MCQView
                question={currentMcq.question}
                options={mcqOptions}
                answerIndex={Number(currentMcq.correct_answer)}
                explanation={currentMcq.explanation}
                difficulty={Number(currentMcq.difficulty)}
                onCorrect={handleCorrectMcq}
                onWrong={handleWrongMcq}
              />
            </motion.div>
          ) : viewMode === 'coding' && currentCoding ? (
            <motion.div
              key={`coding-${currentCoding.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.45, ease: 'circOut' }}
              className="h-full"
            >
              <CodingView
                title={currentCoding.title}
                description={currentCoding.problem_statement}
                initialCode={currentCoding.starter_code ?? ''}
                tests={codingTests}
                difficulty={Number(currentCoding.difficulty)}
                hints={codingHints}
                exampleInput={currentCoding.example_input}
                exampleOutput={currentCoding.example_output}
                onCorrect={handleCorrectCoding}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
