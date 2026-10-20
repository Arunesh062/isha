import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  user_id: string;
  full_name: string;
  phone: string;
  role: 'customer' | 'admin';
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        return;
      }
      (async () => {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone, role')
          .eq('user_id', nextSession.user.id)
          .maybeSingle();
        if (mounted) setProfile(data as Profile | null);
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      const msg = signInError.message?.toLowerCase() || '';
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        setError('Incorrect email or password. Please double-check your credentials and try again.');
      } else if (msg.includes('email not confirmed')) {
        setError('Please check your inbox to confirm your email address before signing in.');
      } else if (signInError.message) {
        setError(signInError.message);
      } else {
        setError('We could not sign you in. Check your email and password and try again.');
      }
      return false;
    }
    return true;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setError('');
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (signUpError) {
      const code = (signUpError as unknown as { code?: string }).code;
      const msg = signUpError.message?.toLowerCase() || '';

      if (code === 'weak_password' || msg.includes('weak') || msg.includes('pwned') || msg.includes('compromised')) {
        setError('This password is too common or easily guessed. Please choose a stronger password (e.g. mix letters, numbers, and symbols).');
      } else if (code === 'user_already_exists' || msg.includes('already registered') || msg.includes('already exists')) {
        setError('An account with this email address already exists. Please switch to "Sign in" above.');
      } else if (signUpError.message) {
        setError(signUpError.message);
      } else {
        setError('We could not create your account. Please check your details and try again.');
      }
      return false;
    }
    return true;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        clearError: () => setError(''),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
