'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Terminal, User, LogOut, Menu } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserType } from '@supabase/supabase-js';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/playground', label: 'Playground' },
    { href: '/progress', label: 'Progress' },
    { href: '/account', label: 'Account' },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser((session?.user as unknown as UserType) ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser((session?.user as unknown as UserType) ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-4 glass-darker mx-2 md:mx-4 mt-4 rounded-2xl"
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
            <Terminal className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight text-white">
            Code<span className="text-accent">Recall</span>
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-4 md:gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={`text-sm font-medium transition-all relative py-1 px-2 ${
                  isActive ? 'text-white' : 'text-muted-foreground hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex sm:hidden items-center mr-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10 transition-colors outline-none">
                <Menu className="w-5 h-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 glass-darker border-white/10 text-white" align="end">
                {navLinks.map((link) => (
                  <DropdownMenuItem 
                    key={link.href} 
                    className={`cursor-pointer focus:bg-white/10 hover:bg-white/10 ${pathname === link.href ? 'text-primary' : 'text-white'}`} 
                    onClick={() => router.push(link.href)}
                  >
                    {link.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none ring-offset-background transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar className="h-10 w-10 border border-white/10">
                  <AvatarImage src={user.user_metadata.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass-darker border-white/10 text-white" align="end">
                <DropdownMenuItem
                  className="cursor-pointer group text-white focus:bg-white/10 focus:text-white hover:bg-white/10 hover:text-white"
                  onClick={() => router.push('/account')}
                >
                  <User className="mr-2 h-4 w-4 opacity-100 transition-colors" stroke="white" style={{ color: 'white' }} strokeWidth={2.5} />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer group text-red-400 focus:bg-white/10 focus:text-red-400 hover:bg-white/10 hover:text-red-400" 
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4 opacity-100 transition-colors" stroke="#f87171" style={{ color: '#f87171' }} strokeWidth={2.5} />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-white"
                onClick={() => setIsAuthModalOpen(true)}
              >
                Login
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/80 text-white rounded-xl px-6"
                onClick={() => setIsAuthModalOpen(true)}
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </motion.nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}
