'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, Clock, ChevronRight, BarChart3, Terminal, Database, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { loadUserProgress, formatLastActive } from '@/lib/user-progress';
import { supabase } from '@/lib/supabase';

export default function ProgressPage() {
  const [mcqSolved, setMcqSolved] = useState(0);
  const [codingSolved, setCodingSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [pythonPct, setPythonPct] = useState(0);
  const [pythonLast, setPythonLast] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const id = data.session?.user?.id ?? null;
      if (id) {
        void (async () => {
          const [{ data: up }, { data: topics }] = await Promise.all([
            supabase
              .from('user_progress')
              .select('mcq_solved,coding_solved,day_streak,best_day_streak,last_active_at')
              .eq('user_id', id)
              .maybeSingle(),
            supabase
              .from('user_topic_progress')
              .select('mcq_done,mcq_total,coding_done,coding_total,updated_at')
              .eq('user_id', id),
          ]);

          if (up) {
            setMcqSolved(up.mcq_solved ?? 0);
            setCodingSolved(up.coding_solved ?? 0);
            setStreak(up.day_streak ?? 0);
            setBestStreak(up.best_day_streak ?? 0);
            setPythonLast(up.last_active_at ? new Date(up.last_active_at).getTime() : null);
          } else {
            const p = loadUserProgress(id);
            setMcqSolved(p.mcqSolved ?? 0);
            setCodingSolved(p.codingSolved ?? 0);
            setStreak(p.dayStreak ?? 0);
            setBestStreak(p.bestDayStreak ?? 0);
            setPythonLast(p.lastActiveAt);
          }

          const totals = (topics || []).reduce(
            (acc, t) => {
              acc.done += (t.mcq_done ?? 0) + (t.coding_done ?? 0);
              acc.total += (t.mcq_total ?? 0) + (t.coding_total ?? 0);
              return acc;
            },
            { done: 0, total: 0 },
          );
          const pct = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;
          setPythonPct(pct);
        })();
        return;
      }

      const p = loadUserProgress(id);
      setMcqSolved(p.mcqSolved ?? 0);
      setCodingSolved(p.codingSolved ?? 0);
      setStreak(p.dayStreak ?? 0);
      setBestStreak(p.bestDayStreak ?? 0);
      const topics = Object.values(p.perTopic || {});
      const totals = topics.reduce(
        (acc, t) => {
          acc.done += t.mcqDone + t.codingDone;
          acc.total += t.mcqTotal + t.codingTotal;
          acc.last = Math.max(acc.last, t.updatedAt || 0);
          return acc;
        },
        { done: 0, total: 0, last: 0 },
      );
      setPythonPct(totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0);
      setPythonLast(totals.last ? totals.last : null);
    });
  }, []);

  const pythonLastLabel = useMemo(() => formatLastActive(pythonLast), [pythonLast]);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-6xl mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-bold tracking-widest uppercase">Your Progress</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Track Your <span className="text-gradient">Mastery</span>
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Session completion, streaks, and consistent practice are the foundations of real learning.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-8">
          <ProgressCard
            title="Python"
            subtitle="Active"
            progress={pythonPct}
            color="primary"
            icon={<Terminal className="w-5 h-5 text-primary" />}
            lastActive={pythonLastLabel}
            href="/learn/python"
            inactive={false}
          />
          <ProgressCard
            title="SQL"
            subtitle="Not ready"
            progress={0}
            color="accent"
            icon={<Database className="w-5 h-5 text-white/60" />}
            lastActive="Coming soon"
            href={undefined}
            inactive={true}
          />
          <ProgressCard
            title="JavaScript"
            subtitle="Not ready"
            progress={0}
            color="purple-400"
            icon={<Code className="w-5 h-5 text-white/60" />}
            lastActive="Coming soon"
            href={undefined}
            inactive={true}
          />
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-[2rem] glass border border-white/5"
          >
            <h3 className="text-xl font-bold text-white mb-6">Activity Summary</h3>
            <div className="space-y-4">
              <StatItem icon={<Calendar className="w-4 h-4 text-primary" />} label="Day Streak" value={`${streak} day${streak === 1 ? '' : 's'}`} />
              <StatItem icon={<CheckCircle2 className="w-4 h-4 text-success" />} label="Best Streak" value={`${bestStreak} days`} />
              <StatItem icon={<Clock className="w-4 h-4 text-blue-400" />} label="MCQs Completed" value={`${mcqSolved}`} />
              <StatItem icon={<Clock className="w-4 h-4 text-accent" />} label="Coding Completed" value={`${codingSolved}`} />
            </div>
            <Button
              disabled
              className="w-full mt-8 bg-white/5 border border-white/10 text-white/40 rounded-xl h-12"
              title="Coming soon"
            >
              View All History (Soon)
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ProgressCard({
  title,
  subtitle,
  progress,
  color,
  icon,
  lastActive,
  href,
  inactive,
}: {
  title: string;
  subtitle?: string;
  progress: number;
  color: string;
  icon: React.ReactNode;
  lastActive: string;
  href?: string;
  inactive?: boolean;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-8 rounded-[2.5rem] glass border border-white/5 transition-all group ${
        inactive ? 'opacity-45 grayscale' : 'hover:border-white/10'
      }`}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {title}
              {subtitle && (
                <span className="text-[10px] uppercase font-black tracking-widest text-white/35 border border-white/10 bg-white/5 px-2 py-0.5 rounded-full">
                  {subtitle}
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{lastActive}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{progress}%</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Completed</div>
        </div>
      </div>

      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 mb-6">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.1)]`} 
          style={{ 
            width: `${progress}%`,
            backgroundColor: color === 'primary' ? '#6366f1' : color === 'accent' ? '#22D3EE' : '#c084fc'
          }} 
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
          {inactive ? 'Locked' : 'Ready'}
        </div>
        {href && !inactive ? (
          <Link href={href}>
            <Button variant="ghost" className="text-sm font-bold text-primary hover:text-primary/80 group/btn">
              Open
              <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        ) : (
          <Button disabled variant="ghost" className="text-sm font-bold text-white/25" title="Coming soon">
            Coming soon
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-white/60 font-medium">{label}</span>
      </div>
      <span className="text-sm text-white font-bold">{value}</span>
    </div>
  );
}
