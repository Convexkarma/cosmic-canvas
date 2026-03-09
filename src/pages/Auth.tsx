import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Starfield from '@/components/Starfield';

type AuthMode = 'login' | 'signup' | 'forgot';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Check your email', description: 'We sent you a verification link.' });
      setMode('login');
    }
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Check your email', description: 'Password reset link sent.' });
    }
    setLoading(false);
  };

  const onSubmit = mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgot;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <Starfield />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="rounded-2xl bg-card/90 cosmic-border backdrop-blur-xl p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Sparkles className="h-5 w-5 text-primary animate-pulse-glow" />
            <h1 className="font-display text-xl font-bold text-foreground">
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h1>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  required
                  className="w-full rounded-lg bg-muted/30 cosmic-border pl-10 pr-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full rounded-lg bg-muted/30 cosmic-border pl-10 pr-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            {mode !== 'forgot' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="w-full rounded-lg bg-muted/30 cosmic-border pl-10 pr-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 font-display text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-4 space-y-2 text-center">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('forgot')} className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
                  Forgot password?
                </button>
                <p className="text-xs font-mono text-muted-foreground">
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-primary hover:underline">Sign up</button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-xs font-mono text-muted-foreground">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-primary hover:underline">Sign in</button>
              </p>
            )}
            {mode === 'forgot' && (
              <button onClick={() => setMode('login')} className="text-xs font-mono text-primary hover:underline">
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
