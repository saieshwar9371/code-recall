'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TopicCard } from '@/components/learn/TopicCard';
import { BookOpen, Target, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { loadUserProgress } from '@/lib/user-progress';

interface Level {
  id: string;
  order: number;
  difficulty: string;
  isLocked: boolean;
  isCompleted: boolean;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  order: number;
  isLocked: boolean;
  isCompleted: boolean;
  completionPct: number;
  levels: Level[];
}

type LevelApi = Level & { [key: string]: unknown };
type TopicApi = Omit<Topic, 'levels' | 'isLocked' | 'isCompleted' | 'completionPct'> & {
  levels?: LevelApi[];
  slug?: string;
  [key: string]: unknown;
};

export default function PythonLearningHub() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayStreak, setDayStreak] = useState(0);
  const [totalSolved, setTotalSolved] = useState(0);

  useEffect(() => {
    async function fetchCurriculum() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;

      // Load user progress for completion pct
      const progress = loadUserProgress(userId);
      setDayStreak(progress.dayStreak ?? 0);
      setTotalSolved((progress.mcqSolved ?? 0) + (progress.codingSolved ?? 0));

      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select(`*, levels (*)`)
        .order('order', { ascending: true });

      if (topicsError) console.error('Supabase Fetch Error:', topicsError);

      if (topicsData) {
        let prevCompleted = true; // First topic always allowed to check its own status or be unlocked if first
        const processed: Topic[] = (topicsData as TopicApi[]).map((topic, tIdx: number) => {
          const pt = progress.perTopic?.[topic.id as string];
          const isCompleted = pt?.completed ?? false;
          
          // A topic is unlocked if it's the first one OR if the previous one was completed
          const isLocked = tIdx === 0 ? false : !prevCompleted;
          
          const levels = (topic.levels || [])
            .sort((a: LevelApi, b: LevelApi) => (a.order as number) - (b.order as number))
            .map((level: LevelApi, lIdx: number) => ({
              ...level,
              isLocked: isLocked || (lIdx > 0 && !isCompleted), // Simplified for now
              isCompleted: false, // In a real app, this would come from user_level_progress
            }));

          const done = (pt?.mcqDone ?? 0) + (pt?.codingDone ?? 0);
          const total = (pt?.mcqTotal ?? 0) + (pt?.codingTotal ?? 0);
          const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

          const updatedTopic = {
            ...topic,
            title: topic.slug === 'python-basics' ? 'Python Fundamentals' : (topic.title as string),
            levels,
            isLocked,
            isCompleted,
            completionPct,
          };

          prevCompleted = isCompleted;
          return updatedTopic;
        });
        setTopics(processed);
      }
      setLoading(false);
    }
    fetchCurriculum();
  }, []);

  const handleSelectTopic = (topicId: string) => {
    router.push(`/learn/python/${topicId}/practice`);
  };

  if (loading) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center gap-4 text-primary">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="text-xs font-bold tracking-widest uppercase opacity-50">Loading Curriculum...</span>
    </div>
  );

  const currentTopic = topics.find(t => !t.isCompleted && !t.isLocked) || topics[0];
  const completedTopics = topics.filter(t => t.isCompleted).length;
  const totalTopics = topics.length;
  const overallPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-14">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/10">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">Python Curriculum</h1>
            <p className="text-muted-foreground">Structured path to mastery — session by session.</p>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            icon={<Target />}
            label="Sessions Completed"
            value={`${completedTopics} / ${totalTopics}`}
            color="primary"
          />
          <StatCard
            icon={<Calendar />}
            label="Day Streak"
            value={`${dayStreak} day${dayStreak === 1 ? '' : 's'}`}
            color="accent"
          />
          <StatCard
            icon={<CheckCircle2 />}
            label="Questions Solved"
            value={totalSolved}
            color="success"
          />
        </div>

        {/* Overall progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 glass p-5 rounded-2xl border border-white/5"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-white/50 uppercase tracking-widest font-bold">Overall Progress</span>
            <span className="text-sm font-black text-white">{overallPct}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
            />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Active Session */}
          <div className="space-y-6">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Current Session
            </h2>
            {currentTopic && (
              <TopicCard
                topic={currentTopic}
                isCurrent={true}
                onSelectTopic={handleSelectTopic}
              />
            )}
          </div>

          {/* Full Curriculum Roadmap */}
          <div className="space-y-6">
            <h2 className="text-xs font-black text-white/20 uppercase tracking-[0.3em]">Full Roadmap</h2>
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-5 top-6 bottom-6 w-px bg-white/5 hidden md:block" />
              <div className="space-y-4">
                {topics.filter(t => t.id !== currentTopic?.id).map((topic, idx) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex gap-4 items-start"
                  >
                    {/* Step indicator */}
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 border transition-all ${
                      topic.isCompleted
                        ? 'bg-success/20 border-success/50 text-success'
                        : topic.isLocked
                        ? 'bg-white/5 border-white/10 text-white/20'
                        : 'bg-primary/20 border-primary/40 text-primary'
                    }`}>
                      {topic.isCompleted
                        ? <CheckCircle2 className="w-4 h-4" />
                        : <span className="text-xs font-black">0{topic.order}</span>
                      }
                    </div>
                    <div className="flex-1">
                      <TopicCard topic={topic} isCurrent={false} onSelectTopic={handleSelectTopic} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Mastery Summary */}
        <div className="space-y-6">
          <div className="glass p-8 rounded-[2.5rem] sticky top-32 border border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Mastery Summary</h3>

            <div className="space-y-4">
              {topics.map(topic => (
                <div key={topic.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50 font-medium truncate max-w-[70%]">{topic.title}</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      topic.isCompleted
                        ? 'bg-success/10 text-success'
                        : topic.isLocked
                        ? 'bg-white/5 text-white/20'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {topic.isCompleted ? 'Done' : topic.isLocked ? 'Locked' : `${topic.completionPct}%`}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        topic.isCompleted ? 'bg-success' : 'bg-primary/60'
                      }`}
                      style={{ width: `${topic.isCompleted ? 100 : topic.completionPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-white/30 leading-relaxed">
                Complete each session fully to unlock the next. Consistency builds mastery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass p-6 rounded-2xl flex items-center gap-4 border border-white/5 border-l-4 ${
        color === 'primary' ? 'border-l-primary' : color === 'success' ? 'border-l-success' : 'border-l-accent'
      }`}
    >
      <div className={`p-3 rounded-xl ${
        color === 'primary' ? 'bg-primary/10 text-primary' : color === 'success' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
      }`}>
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
      </div>
      <div>
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{label}</div>
      </div>
    </motion.div>
  );
}
