'use client';

import { motion } from 'framer-motion';
import { Terminal, Database, Code, Sparkles, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCursor } from '@/components/effects/CursorContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadUserProgress } from '@/lib/user-progress';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [streak, setStreak] = useState('00');
  const [mcqSolved, setMcqSolved] = useState('0');
  const [codingSolved, setCodingSolved] = useState('0');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id ?? null;
      // Prefer DB progress for logged-in users, fall back to local progress
      if (userId) {
        void (async () => {
          const { data: row } = await supabase
            .from('user_progress')
            .select('mcq_solved,coding_solved,day_streak')
            .eq('user_id', userId)
            .maybeSingle();
          if (row) {
            setStreak(String(row.day_streak ?? 0).padStart(2, '0'));
            setMcqSolved(String(row.mcq_solved ?? 0));
            setCodingSolved(String(row.coding_solved ?? 0));
            return;
          }
          const p = loadUserProgress(userId);
          setStreak(String(p.dayStreak ?? 0).padStart(2, '0'));
          setMcqSolved(String(p.mcqSolved ?? 0));
          setCodingSolved(String(p.codingSolved ?? 0));
        })();
        return;
      }
      const p = loadUserProgress(userId);
      setStreak(String(p.dayStreak ?? 0).padStart(2, '0'));
      setMcqSolved(String(p.mcqSolved ?? 0));
      setCodingSolved(String(p.codingSolved ?? 0));
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 min-h-screen">
      {/* Dashboard Header */}
      <div className="w-full max-w-6xl mb-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4 fill-current" />
            <span className="text-xs font-black tracking-[0.3em] uppercase">Architecture v1.0</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Select Your <span className="text-gradient">Mastery Path</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            A high-fidelity learning environment designed for deep focus and structured progression.
          </p>
        </motion.div>
      </div>

      {/* Language Selection Grid - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        <LanguageCard 
          icon={<Terminal className="w-8 h-8 text-primary" />}
          title="Python"
          description="Master the world's most versatile language. From basics to automation."
          stats="24 Modules • 120 Exercises"
          progress={0}
          color="primary"
          delay={0.1}
          type="completed"
          href="/learn/python"
        />
        <LanguageCard 
          icon={<Database className="w-8 h-8 text-accent" />}
          title="SQL"
          description="Learn to query, manage, and scale data with structured logic."
          stats="18 Modules • 85 Exercises"
          progress={0}
          color="accent"
          delay={0.2}
          type="card"
          isInactive={true}
        />
        <LanguageCard 
          icon={<Code className="w-8 h-8 text-purple-400" />}
          title="JavaScript"
          description="Build interactive web apps and master the logic of the browser."
          stats="32 Modules • 150 Exercises"
          progress={0}
          color="purple-400"
          delay={0.3}
          type="locked"
          isInactive={true}
        />
      </div>

      {/* Quick Stats / Activity Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-6xl mt-20 p-8 rounded-[3rem] glass border border-white/5 flex flex-col lg:flex-row items-center justify-between gap-12"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full lg:w-auto">
          <StatBox label="Day Streak" value={streak} />
          <StatBox label="MCQs Solved" value={mcqSolved} />
          <StatBox label="Coding Solved" value={codingSolved} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <Link href="/learn/python" className="w-full lg:w-auto">
            <Button className="w-full lg:w-auto bg-white text-black hover:bg-white/90 rounded-2xl px-12 h-14 font-black uppercase tracking-widest group shadow-xl shadow-white/5">
              Open Python Hub
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button
            disabled
            variant="outline"
            className="w-full lg:w-auto rounded-2xl px-12 h-14 font-black uppercase tracking-widest border-white/10 bg-white/5 text-white/40"
            title="Coming soon"
          >
            Daily Challenge (Soon)
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-center min-w-[140px]">
      <div className={`text-4xl font-black text-white`}>{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] mt-1">{label}</div>
    </div>
  );
}

interface LanguageCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  stats: string;
  progress: number;
  color: string;
  delay: number;
  type: 'card' | 'locked' | 'completed';
  href?: string;
  isInactive?: boolean;
}

function LanguageCard({ icon, title, description, stats, progress, color, delay, type, href, isInactive }: LanguageCardProps) {
  const { setCursorType } = useCursor();
  const isStarted = progress > 0;

  const CardContent = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isInactive ? { scale: 1.02, y: -5 } : {}}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setCursorType(isInactive ? 'locked' : type)}
      onMouseLeave={() => setCursorType('default')}
      className={`group relative flex flex-col p-8 rounded-[2.5rem] glass border border-white/5 hover:border-primary/30 transition-all duration-500 overflow-hidden ${isInactive ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer shadow-xl hover:shadow-primary/5'}`}
    >
      {/* Dynamic Glow Accent */}
      <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] transition-opacity duration-700 opacity-10 group-hover:opacity-30`} 
           style={{ backgroundColor: color === 'primary' ? '#6366f1' : color === 'accent' ? '#22D3EE' : '#c084fc' }} />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
          {icon}
        </div>

        <div className="flex justify-between items-start mb-4">
          <h3 className="text-3xl font-black text-white tracking-tight group-hover:text-gradient transition-all">{title}</h3>
          {isInactive && (
            <span className="text-[9px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/40 uppercase font-black tracking-widest">
              Inactive
            </span>
          )}
        </div>
        
        <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
          {description}
        </p>

        <div className="mt-auto">
          <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-6 flex justify-between">
             {stats}
          </div>

          <Button 
            variant="default" 
            disabled={isInactive}
            onMouseEnter={() => !isInactive && setCursorType('button')}
            onMouseLeave={() => !isInactive && setCursorType(type)}
            className={`w-full rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-[10px] ${!isInactive ? 'bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-white/20'} transition-all`}
          >
            {isStarted ? 'Continue' : 'Start Path'}
            {!isInactive && <Play className={`w-4 h-4 ml-2 fill-current`} />}
          </Button>
        </div>
      </div>
    </motion.div>
  );

  if (href && !isInactive) {
    return (
      <Link href={href} className="block no-underline">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
