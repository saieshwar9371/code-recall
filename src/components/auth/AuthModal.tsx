'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Terminal, Loader2 } from 'lucide-react';

const GoogleIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    className="w-5 h-5"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const validatePassword = (password: string) => {
  if (password.length < 6) return "Password must be at least 6 characters long.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/\d/.test(password)) return "Password must contain at least one number.";
  if (!/[!@#$%^&*(),.?":{}|<>\-_]/.test(password)) return "Password must contain at least one symbol.";
  return null;
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEmailAuth = async (type: 'login' | 'signup') => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    if (type === 'signup') {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        setIsLoading(false);
        return;
      }
    }

    try {
      if (type === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Successfully signed up! Please check your email to confirm your account before logging in.');
        setPassword('');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] glass-darker border-white/10 p-0 overflow-hidden text-white">
        <div className="p-8">
          <DialogHeader className="mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl bg-primary/20 border border-primary/30">
                <Terminal className="w-8 h-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-white">Welcome Back</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Master Python with the community.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="login" className="w-full" onValueChange={() => { setError(null); setSuccess(null); }}>
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 rounded-xl p-1">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-primary">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-primary">Sign Up</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full h-12 glass border-white/10 hover:bg-white/5 gap-3"
                onClick={() => handleOAuth('google')}
              >
                <GoogleIcon />
                Continue with Google
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <TabsContent value="login" className="space-y-4">
                <Input 
                  type="email" 
                  placeholder="Email address" 
                  className="h-12 glass border-white/10 focus:border-primary/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input 
                  type="password" 
                  placeholder="Password" 
                  className="h-12 glass border-white/10 focus:border-primary/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button 
                  className="w-full h-12 bg-primary hover:bg-primary/80 text-white font-semibold rounded-xl"
                  onClick={() => handleEmailAuth('login')}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <Input 
                  type="email" 
                  placeholder="Email address" 
                  className="h-12 glass border-white/10 focus:border-primary/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input 
                  type="password" 
                  placeholder="Create Password" 
                  className="h-12 glass border-white/10 focus:border-primary/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button 
                  className="w-full h-12 bg-primary hover:bg-primary/80 text-white font-semibold rounded-xl"
                  onClick={() => handleEmailAuth('signup')}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </Button>
              </TabsContent>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
            )}
            {success && (
              <p className="mt-4 text-sm text-green-400 text-center bg-green-400/10 p-3 rounded-lg border border-green-400/20">{success}</p>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
