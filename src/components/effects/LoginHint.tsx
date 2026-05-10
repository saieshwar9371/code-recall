'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

export default function LoginHint() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [startDraw, setStartDraw] = useState(false);
  const [ww, setWw] = useState(1280);
  const [wh, setWh] = useState(900);
  const pathname = usePathname();

  useEffect(() => {
    const update = () => { setWw(window.innerWidth); setWh(window.innerHeight); };
    update();
    window.addEventListener('resize', update);
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setIsLoggedIn(!!s));
    return () => { window.removeEventListener('resize', update); subscription.unsubscribe(); };
  }, []);

  useEffect(() => { setDismissed(false); setStartDraw(false); }, [pathname]);

  const show = pathname === '/' && isLoggedIn === false && !dismissed;

  useEffect(() => {
    if (show) { const t = setTimeout(() => setStartDraw(true), 600); return () => clearTimeout(t); }
    else setStartDraw(false);
  }, [show]);

  const dismiss = () => { setDismissed(true); setStartDraw(false); };

  // Arrow start: BOTTOM of text (center screen)
  const sx = ww / 2;
  const sy = wh / 2 + 65;  // below text

  // Navbar: mt-4(16) + py-4(16) = content at 32px, button center ~52px
  // mx-4(16) + px-6(24) = 40px from right, two buttons ~196px wide
  // Highlight box: wraps Login + SignUp buttons precisely
  const hlW = 200; const hlH = 44;
  const hlX = ww - 40 - hlW;   // 40px from right edge
  const hlY = 30;               // navbar top content area

  // Arrow ends at LEFT edge of highlight box, vertically centered
  const ex = hlX - 8;
  const ey = hlY + hlH / 2;

  // Weighted midpoint — shift toward start for more curvature there
  const t1 = 0.22;  // P1 close to start → tight bend near text
  const t2 = 0.80;  // P2 close to end → straighter near highlight box

  const dh = ww * 0.32;
  const dv = wh * 0.32;

  // P1: near start, large perpendicular offset → tight curl at text bottom
  const p1x = sx + (ex - sx) * t1 + dh;
  const p1y = sy + (ey - sy) * t1 + dv;

  // P2: directly LEFT of endpoint → arrow arrives horizontally from the left
  const p2x = ex - ww * 0.22;
  const p2y = ey;

  const pathD = `M ${sx} ${sy} C ${p1x} ${p1y}, ${p2x} ${p2y}, ${ex} ${ey}`;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Page blur below navbar */}
          <motion.div
            className="fixed left-0 right-0 bottom-0"
            style={{ top: '88px', zIndex: 9995, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', backgroundColor: 'rgba(4,6,20,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={dismiss}
          />

          {/* SVG arrow + highlight */}
          <motion.svg
            className="fixed inset-0 pointer-events-none overflow-visible"
            style={{ width: '100vw', height: '100vh', zIndex: 9997 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <defs>
              <linearGradient id="cAG" gradientUnits="userSpaceOnUse" x1={sx} y1={sy} x2={ex} y2={ey}>
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#c4b5fd" stopOpacity="1" />
              </linearGradient>
              <filter id="cGF" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="cRF" x="-30%" y="-80%" width="160%" height="260%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Highlight ring */}
            {startDraw && (
              <motion.rect
                x={hlX} y={hlY} width={hlW} height={hlH} rx={12}
                fill="rgba(99,102,241,0.08)" stroke="#818cf8" strokeWidth={1.8}
                filter="url(#cRF)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 2.2 }}
              />
            )}

            {/* Single self-intersecting bezier — perfectly smooth loop */}
            <motion.path
              d={pathD}
              stroke="url(#cAG)" strokeWidth="3" fill="none"
              strokeLinecap="round"
              filter="url(#cGF)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={startDraw ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 2.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            />

            {/* Dot at left edge of highlight box */}
            <motion.circle
              cx={ex} cy={ey} r={6}
              fill="#c4b5fd"
              filter="url(#cGF)"
              initial={{ scale: 0, opacity: 0 }}
              animate={startDraw ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ delay: 2.2, type: 'spring', stiffness: 300, damping: 18 }}
              style={{ transformOrigin: `${ex}px ${ey}px` }}
            />
          </motion.svg>

          {/* Text centered — static, no bobbing */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            <p
              className="text-4xl font-extrabold tracking-tight select-none"
              style={{ color: 'white', textShadow: '0 0 40px rgba(99,102,241,1), 0 2px 24px rgba(0,0,0,1)' }}
            >
              <span style={{ color: '#a78bfa' }}>Login</span>{' '}or{' '}
              <span style={{ color: '#a78bfa' }}>Sign Up</span>
            </p>
            <p
              className="text-base font-medium mt-3 select-none"
              style={{ color: 'rgba(255,255,255,0.7)', textShadow: '0 2px 16px rgba(0,0,0,1)' }}
            >
              to save your progress &amp; track your data 🚀
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
