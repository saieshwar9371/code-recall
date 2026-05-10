'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Camera, Mail, Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [user, setUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function getProfile() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUser(user);
          setEmail(user.email || '');
          setFullName(user.user_metadata?.full_name || '');
          setAvatarUrl(user.user_metadata?.avatar_url || '');
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [router]);

  async function updateProfile() {
    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName,
          avatar_url: avatarUrl 
        }
      });

      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch {
      alert('Error uploading image');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }
    
    try {
      setSaving(true);
      // In a real app: await supabase.rpc('delete_user_account') or similar
      alert('Account deletion requested. In a production environment, this would permanently remove your data.');
      await handleLogout();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Account <span className="text-gradient">Settings</span>
          </h1>
          <p className="text-muted-foreground mt-2">Personalize your coding identity.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass border border-white/5 rounded-[3rem] p-10 md:p-16 relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            {/* Avatar Section */}
            <div className="relative group">
              <Avatar className="w-40 h-40 border-4 border-white/10 relative">
                <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                <AvatarFallback className="text-4xl bg-primary/20 text-primary font-bold">
                  {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : email[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 flex gap-2 translate-y-1/4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-2xl bg-primary text-white border-2 border-[#0B0F19] hover:scale-110 active:scale-95 transition-all shadow-xl shadow-primary/20"
                  title="Change Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                {avatarUrl && (
                  <button 
                    onClick={handleRemovePhoto}
                    className="p-2 rounded-2xl bg-red-500 text-white border-2 border-[#0B0F19] hover:scale-110 active:scale-95 transition-all shadow-xl shadow-red-500/20"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>

            {/* Info Section */}
            <div className="flex-1 space-y-6 w-full">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">Full Name</label>
                <div className="relative group">
                  <Input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Name"
                    className="h-16 text-2xl font-bold bg-white/5 border-white/10 focus:border-primary/50 text-white rounded-2xl px-6 focus:ring-0 transition-all"
                  />
                  <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">Email Address</label>
                <div className="flex items-center gap-3 px-6 h-14 rounded-2xl bg-white/5 border border-white/5 text-white/60">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">{email}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button
                  onClick={updateProfile}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/80 text-white rounded-2xl px-8 h-14 font-bold flex-1 md:flex-none shadow-lg shadow-primary/20"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  Save Profile
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-white/60 hover:text-white hover:bg-white/5 rounded-2xl h-14 font-bold px-6"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Logout
                </Button>
              </div>

              {/* Delete Account Section */}
              <div className="pt-8 border-t border-white/5">
                {!showDeleteConfirm ? (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs font-bold uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors"
                  >
                    Delete Account
                  </button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 p-6 rounded-3xl bg-red-500/5 border border-red-500/10"
                  >
                    <div className="flex items-center gap-3 text-red-500">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm font-bold">Danger Zone</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This action is permanent. Please type <span className="text-white font-bold">DELETE</span> to confirm.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input 
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="Type DELETE"
                        className="h-12 bg-black/20 border-red-500/20 focus:border-red-500 text-white rounded-xl"
                      />
                      <Button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirm !== 'DELETE' || saving}
                        variant="destructive"
                        className="h-12 rounded-xl font-bold px-8"
                      >
                        Confirm Delete
                      </Button>
                      <Button
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(''); }}
                        variant="ghost"
                        className="h-12 rounded-xl font-bold text-white/40 hover:text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

