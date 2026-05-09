'use client';

import { motion } from 'framer-motion';
import { User, Bell, LogOut, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Account <span className="text-gradient">Settings</span>
          </h1>
          <p className="text-muted-foreground mt-2">Manage your profile, preferences, and account security.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide">
            <NavButton icon={<User className="w-4 h-4" />} label="Profile" active />
            <NavButton icon={<Bell className="w-4 h-4" />} label="Notifications (Soon)" disabled />
            <div className="hidden md:block pt-4 mt-4 border-t border-white/5">
              <NavButton
                icon={<LogOut className="w-4 h-4 text-red-400" />}
                label="Logout"
                className="text-red-400"
                onClick={handleLogout}
              />
            </div>
          </div>

          {/* Settings Content */}
          <div className="md:col-span-3 space-y-8">
            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-8 rounded-[2.5rem] glass border border-white/5 space-y-8"
            >
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-white/5">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-2xl bg-primary/20 text-primary">SE</AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white border-4 border-[#0B0F19] hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Public Profile</h3>
                  <p className="text-sm text-muted-foreground">This information will be displayed on your profile.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Full Name</label>
                  <Input defaultValue="Sai Eshwar" className="h-12 glass border-white/10 focus:border-primary/50 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Username</label>
                  <Input defaultValue="saieshwar" className="h-12 glass border-white/10 focus:border-primary/50 text-white" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  disabled
                  className="bg-primary/40 text-white/70 rounded-xl px-8 h-12 font-bold"
                  title="Coming soon"
                >
                  Save Changes (Soon)
                </Button>
              </div>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-[2.5rem] glass border border-white/5"
            >
              <h3 className="text-xl font-bold text-white mb-6">Danger Zone</h3>
              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Delete Account</div>
                  <p className="text-xs text-muted-foreground">Permanently remove your account and all data.</p>
                </div>
                <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10 font-bold">
                  Delete (Soon)
                </Button>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  disabled,
  className,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
        active
          ? 'bg-primary/20 text-primary border border-primary/20'
          : disabled
            ? 'text-white/25 bg-white/5 border border-white/5 cursor-not-allowed'
            : 'text-muted-foreground hover:text-white hover:bg-white/5'
      } ${className}`}
      title={disabled ? 'Coming soon' : undefined}
    >
      {icon}
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}
