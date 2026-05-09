'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full glass border border-white/10 rounded-[2.5rem] p-10 text-center space-y-6"
      >
        <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/40">
          Lost in the lab
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">404</h1>
        <p className="text-muted-foreground">
          That page doesn&apos;t exist. Let&apos;s get you back to a working path.
        </p>
        <Link href="/" className="inline-block">
          <Button className="rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-[10px]">
            Back to dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

